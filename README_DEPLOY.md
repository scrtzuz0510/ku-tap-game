# 쿠 탭게임 ver2 배포 안내

이 폴더는 배포용 정적 웹앱 패키지입니다.

## 포함 파일

- `index.html`
- `styles.css`
- `app.js`
- `assets/`

## 가장 쉬운 배포: Netlify Drop

1. https://app.netlify.com/drop 접속
2. 이 `ku-tap-game-deploy` 폴더를 그대로 드래그 앤 드롭
3. 업로드가 끝나면 즉시 공개 URL이 생성됩니다

## GitHub Pages 배포

1. GitHub에서 새 저장소 생성
2. 이 폴더의 파일들을 저장소 루트에 업로드
3. 저장소 `Settings > Pages` 이동
4. `Deploy from a branch` 선택
5. Branch를 `main`, Folder를 `/root`로 설정
6. 저장 후 몇 분 뒤 공개 URL이 생성됩니다

## Vercel 배포

1. https://vercel.com/new 접속
2. 새 프로젝트를 만들고 이 폴더를 업로드하거나 GitHub 저장소를 연결
3. Framework Preset은 `Other` 또는 자동 감지 그대로 사용
4. Build Command는 비워둡니다
5. Output Directory도 비워둡니다

## 참고

이 앱은 서버가 필요 없는 정적 웹앱입니다. 저장 데이터는 브라우저의 `localStorage`에 저장되므로, 사용자가 브라우저/기기를 바꾸면 기존 진행 상황은 자동으로 이동되지 않습니다.
