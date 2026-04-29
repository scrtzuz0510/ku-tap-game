# ─────────────────────────────────────────────
# 1. 보안 그룹 생성
# ─────────────────────────────────────────────
openstack security group create \
    --description "SG for Isolated App-DB Instance" \
    isolated-app-sg


# 인바운드 규칙 추가
openstack security group rule create \
    --protocol tcp \
    --dst-port 22 \
    --ingress \
    --remote-ip 0.0.0.0/0 \
    isolated-app-sg

# PostgreSQL(5432)을 외부 전체에 여는 것은 매우 위험
openstack security group rule create \
    --protocol tcp \
    --dst-port 5432 \
    --ingress \
    --remote-ip 0.0.0.0/0 \
    isolated-app-sg


# ─────────────────────────────────────────────
# 2. Cloud-Init 설정 파일 작성
# ─────────────────────────────────────────────
cat > /tmp/isolated-cloud-init.yaml << 'CLOUDINIT'
#cloud-config

package_update: true
package_upgrade: true

packages:
  - curl
  - ca-certificates
  - gnupg
  - lsb-release

runcmd:
  # 1. Docker 공식 스크립트로 설치 (get.docker.com)
  - curl -fsSL https://get.docker.com -o get-docker.sh
  - sh get-docker.sh
  - usermod -aG docker ubuntu   # ubuntu 유저에 docker 그룹 부여 (재로그인 필요)
  - systemctl enable docker
  - systemctl start docker

  # 2. 작업 디렉토리 생성 및 Docker Compose 파일 작성
  - mkdir -p /opt/<PROJECT_NAME>
  - |
    cat > /opt/<PROJECT_NAME>/docker-compose.yml << 'EOF'
    version: '3.8'
    services:
      db:
        image: postgres:17
        container_name: <PROJECT_NAME>-db
        restart: always
        ports:
          - "5432:5432"
        environment:
          POSTGRES_USER: <PROJECT_NAME>        # ← 실제 DB 유저명으로 교체
          POSTGRES_PASSWORD: <DB_PASSWORD>      # ← 실제 DB 비밀번호로 교체
          POSTGRES_DB: <PROJECT_NAME>           # ← 실제 DB명으로 교체
        volumes:
          - pgdata:/var/lib/postgresql/data
        networks:
          - isolated-net

      backend:
        image: <DOCKERHUB_USERNAME>/node-backend:latest  # ← Docker Hub 이미지 경로
        container_name: node-backend
        restart: always
        ports:
          - "3000:3000"
        environment:
          DB_HOST: db           # Docker 내부 네트워크에서 서비스명으로 DNS 해석됨
          DB_PORT: 5432
          DB_USER: <PROJECT_NAME>
          DB_PASSWORD: <DB_PASSWORD>
          DB_NAME: <PROJECT_NAME>
        depends_on:
          - db
        networks:
          - isolated-net

      tunnel:
        image: cloudflare/cloudflared:latest
        container_name: cloudflare-tunnel
        restart: always
        # ⚠️ Cloudflare Tunnel 토큰 절대 외부 공개 금지
        #    노출 시 Cloudflare 대시보드에서 즉시 토큰 재발급 필요
        #    운영 환경에서는 Docker Secret 또는 환경변수 파일(.env)로 분리 권장
        command: tunnel --no-autoupdate run --token <CLOUDFLARE_TUNNEL_TOKEN>
        depends_on:
          - backend
        networks:
          - isolated-net

    networks:
      isolated-net:
        driver: bridge   # 컨테이너 간 격리된 내부 브리지 네트워크

    volumes:
      pgdata:            # PostgreSQL 데이터 영속성 보장용 Named Volume
    EOF

  # // Changed: Docker Hub에서 이미지 pull, 실패 시 Alpine 임시 이미지로 대체 (파이프라인 미중단)
  - >
    docker pull <DOCKERHUB_USERNAME>/node-backend:latest ||
    printf 'FROM alpine\nCMD ["tail", "-f", "/dev/null"]\n' |
    docker build -t <DOCKERHUB_USERNAME>/node-backend:latest -

  # 3. Docker Compose 백그라운드 실행
  - cd /opt/<PROJECT_NAME> && docker compose up -d

final_message: "Cloud-init complete. Isolated <PROJECT_NAME> Instance is Ready."
CLOUDINIT


# ─────────────────────────────────────────────
# 3. OpenStack 인스턴스 생성
# ─────────────────────────────────────────────
openstack server create \
    --flavor app.small \
    --image "Ubuntu-24.04-Noble" \
    --network app-net \
    --security-group isolated-app-sg \
    --key-name app-keypair \
    --user-data /tmp/isolated-cloud-init.yaml \
    --availability-zone nova:compute2-host-acer \   # 특정 compute 호스트 핀닝
    <PROJECT_NAME>-integrated-01


# ─────────────────────────────────────────────
# 4. Floating IP 생성 및 인스턴스 할당
# ─────────────────────────────────────────────
NEW_FIP=$(openstack floating ip create public -f value -c floating_ip_address)
openstack server add floating ip <PROJECT_NAME>-integrated-01 $NEW_FIP
echo "할당된 FIP: $NEW_FIP"


# ─────────────────────────────────────────────
# 5. Controller 노드 iptables DNAT 설정
#    공인 IP 비표준 포트 → Floating IP 표준 포트 포워딩
#    비표준 포트 사용 이유: 포트 충돌 방지 + 포트 스캔 노출 최소화
# ─────────────────────────────────────────────
PUBLIC_IP="<PUBLIC_IP>"    # ← 컨트롤러 공인 IP
EXT_SSH_PORT="2226"        # 외부 SSH 접속 포트 (기본 22 대신 사용)
EXT_DB_PORT="15922"        # 외부 DB 접속 포트 (기본 5432 대신 사용)

# SSH: <PUBLIC_IP>:2226 → Floating IP:22
iptables -t nat -A PREROUTING \
    -p tcp -d $PUBLIC_IP --dport $EXT_SSH_PORT \
    -j DNAT --to-destination ${NEW_FIP}:22

# PostgreSQL: <PUBLIC_IP>:15922 → Floating IP:5432
iptables -t nat -A PREROUTING \
    -p tcp -d $PUBLIC_IP --dport $EXT_DB_PORT \
    -j DNAT --to-destination ${NEW_FIP}:5432

# MASQUERADE: DNAT 이후 응답 패킷의 source를 컨트롤러 IP로 재작성
# 참고: 공인 IP가 고정이라면 MASQUERADE 대신 아래처럼 명시적 SNAT도 가능
#   iptables -t nat -A POSTROUTING -d $NEW_FIP -j SNAT --to-source $PUBLIC_IP
iptables -t nat -A POSTROUTING \
    -d $NEW_FIP \
    -j MASQUERADE

# iptables 규칙 영속 저장
service iptables save