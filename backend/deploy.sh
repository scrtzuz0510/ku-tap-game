######## 최초 cloud-init 이후 재배포 (빈 이미지 파일 들어있다면)
# 1. 기존 수동 컨테이너 정리
docker stop node-backend
docker rm node-backend

# 2. compose 파일 위치로 이동
cd /opt/makersfarm

# 3. 이미지명 업데이트 (새 이미지로 교체)
sed -i 's|<DOCKERHUB_USERNAME>/node-backend:latest|judemin/ku-tap-backend:latest|' docker-compose.yml

# 4. 새 이미지 pull 후 재실행
docker compose pull backend
docker compose up -d backend

######## DB 컨테이너 스키마 주입
docker exec -i makersfarm-db psql -U makersfarm -d makersfarm < schema.sql

docker exec -it makersfarm-db psql -U makersfarm -d makersfarm -c "\dt"
            List of relations
 Schema |    Name    | Type  |   Owner
--------+------------+-------+------------
 public | game_saves | table | makersfarm
 public | users      | table | makersfarm
(2 rows)

######## 추후 재배포시
cd /opt/makersfarm

# 이미지 업데이트 + 컨테이너 재시작
docker compose pull backend && docker compose up -d --no-deps backend