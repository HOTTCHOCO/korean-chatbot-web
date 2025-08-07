# GitHub 연동 가이드

## 🚀 GitHub 레포지토리 생성

### 1. GitHub에서 새 레포지토리 생성

1. [GitHub.com](https://github.com)에 로그인
2. 우측 상단 "+" 버튼 → "New repository" 클릭
3. 레포지토리 설정:
   - **Repository name**: `korean-chatbot-app`
   - **Description**: `한국어 학습 챗봇 웹 서비스`
   - **Visibility**: Public 또는 Private 선택
   - **README, .gitignore, license**: 체크 해제 (이미 있음)
4. "Create repository" 클릭

### 2. 로컬 레포지토리 연결

GitHub 레포지토리 생성 후 다음 명령어를 실행하세요:

```bash
# GitHub 레포지토리 연결 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/korean-chatbot-app.git

# 연결 확인
git remote -v

# 메인 브랜치를 GitHub에 푸시
git push -u origin main
```

### 3. SSH 키 설정 (선택사항, 권장)

#### SSH 키 생성
```bash
# SSH 키 생성 (이메일을 GitHub 계정 이메일로 변경)
ssh-keygen -t ed25519 -C "your_email@example.com"

# SSH 에이전트 시작
eval "$(ssh-agent -s)"

# SSH 키 추가
ssh-add ~/.ssh/id_ed25519

# 공개 키 복사 (macOS)
pbcopy < ~/.ssh/id_ed25519.pub
```

#### GitHub에 SSH 키 등록
1. GitHub.com → Settings → SSH and GPG keys
2. "New SSH key" 클릭
3. Title: `MacBook Pro` (또는 원하는 이름)
4. Key: 복사한 공개 키 붙여넣기
5. "Add SSH key" 클릭

#### SSH로 레포지토리 연결 (SSH 키 설정 후)
```bash
# 기존 원격 저장소 제거
git remote remove origin

# SSH로 다시 연결
git remote add origin git@github.com:YOUR_USERNAME/korean-chatbot-app.git

# 연결 확인
git remote -v

# 푸시
git push -u origin main
```

### 4. 브랜치 전략 설정

```bash
# 개발 브랜치 생성
git checkout -b develop

# 개발 브랜치 푸시
git push -u origin develop

# 메인 브랜치로 돌아가기
git checkout main
```

### 5. GitHub Pages 설정 (선택사항)

프론트엔드를 GitHub Pages로 배포하려면:

1. GitHub 레포지토리 → Settings → Pages
2. Source: "Deploy from a branch" 선택
3. Branch: `main` 선택
4. Folder: `/ (root)` 선택
5. "Save" 클릭

### 6. GitHub Actions 설정 (선택사항)

CI/CD를 위해 GitHub Actions 워크플로우 생성:

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm install -g pnpm
        pnpm install
    
    - name: Build frontend
      run: |
        cd frontend
        pnpm run build
    
    - name: Build backend
      run: |
        cd backend
        pnpm run build
```

### 7. 협업 설정

#### 팀원 초대
1. GitHub 레포지토리 → Settings → Collaborators
2. "Add people" 클릭
3. GitHub 사용자명 또는 이메일 입력
4. 권한 설정 (Admin, Maintain, Write, Triage, Read)
5. "Add [username] to this repository" 클릭

#### 브랜치 보호 규칙 설정
1. GitHub 레포지토리 → Settings → Branches
2. "Add rule" 클릭
3. Branch name pattern: `main`
4. 설정:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
5. "Create" 클릭

### 8. 환경 변수 설정

#### GitHub Secrets 설정 (배포용)
1. GitHub 레포지토리 → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. 다음 시크릿 추가:
   - `SUPABASE_URL`: Supabase 프로젝트 URL
   - `SUPABASE_ANON_KEY`: Supabase anon 키
   - `VERCEL_TOKEN`: Vercel 배포 토큰
   - `RENDER_TOKEN`: Render 배포 토큰

### 9. 문제 해결

#### 인증 오류
```bash
# GitHub CLI 설치 (macOS)
brew install gh

# GitHub 로그인
gh auth login

# 토큰 생성 (GitHub.com → Settings → Developer settings → Personal access tokens)
```

#### 푸시 오류
```bash
# 강제 푸시 (주의: 기존 히스토리 덮어씀)
git push -f origin main

# 또는 새 히스토리로 시작
git checkout --orphan new-main
git add .
git commit -m "Initial commit"
git branch -D main
git branch -m main
git push -u origin main
```

## 📝 다음 단계

1. GitHub 레포지토리 생성 완료
2. 로컬 코드 푸시 완료
3. Vercel/Render 배포 설정
4. 환경 변수 설정
5. 자동 배포 테스트
