# 배포 가이드

## 🚀 배포 환경 설정

### 1. GitHub 레포지토리 설정

1. GitHub에서 새 레포지토리 생성:
   - Repository name: `korean-chatbot-app`
   - Description: "한국어 학습 챗봇 웹 서비스"
   - Public 또는 Private 선택

2. 로컬 레포지토리를 GitHub에 연결:
   ```bash
   git remote add origin https://github.com/[YOUR_USERNAME]/korean-chatbot-app.git
   git push -u origin main
   ```

### 2. Vercel 배포 (프론트엔드)

1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 레포지토리 선택: `korean-chatbot-app`
4. Framework Preset: `Vite` 선택
5. Root Directory: `frontend` 설정
6. Build Command: `npm run build` (기본값)
7. Output Directory: `dist` (기본값)
8. "Deploy" 클릭

### 3. Render 배포 (백엔드)

1. [Render](https://render.com)에 로그인
2. "New +" → "Web Service" 클릭
3. GitHub 레포지토리 연결: `korean-chatbot-app`
4. 설정:
   - **Name**: `korean-chatbot-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

5. Environment Variables 추가:
   - `NODE_ENV`: `production`
   - `PORT`: `3001`

6. "Create Web Service" 클릭

### 4. 환경 변수 설정

#### Vercel (프론트엔드)
- Vercel 대시보드 → Project Settings → Environment Variables
- `VITE_API_URL`: 백엔드 URL (예: `https://korean-chatbot-backend.onrender.com`)

#### Render (백엔드)
- Render 대시보드 → Environment → Environment Variables
- `CORS_ORIGIN`: 프론트엔드 URL (예: `https://korean-chatbot-app.vercel.app`)

### 5. CI/CD 확인

1. GitHub에 코드 푸시:
   ```bash
   git add .
   git commit -m "Update deployment configuration"
   git push origin main
   ```

2. Vercel과 Render에서 자동 배포 확인
3. 배포된 URL에서 애플리케이션 접근 테스트

## 🔧 로컬 개발 환경

### 프론트엔드 실행
```bash
cd frontend
npm run dev
```

### 백엔드 실행
```bash
cd backend
npm run dev
```

### 전체 프로젝트 실행
```bash
pnpm dev
```

## 📝 배포 후 확인사항

1. **프론트엔드**: Vercel URL에서 React 앱이 정상 로드되는지 확인
2. **백엔드**: Render URL + `/health` 엔드포인트에서 정상 응답 확인
3. **CORS**: 프론트엔드에서 백엔드 API 호출이 정상 작동하는지 확인
