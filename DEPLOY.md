# 🚀 Vercel 배포 가이드

Pace Calculator를 Vercel에 배포하는 방법입니다.

## 📋 사전 준비

1. [Vercel 계정](https://vercel.com) 생성 (GitHub로 로그인 가능)
2. Git 저장소에 프로젝트 푸시 (GitHub, GitLab, Bitbucket)

## 🔧 배포 방법

### 방법 1: Vercel Dashboard (추천)

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 접속
   - "Add New Project" 클릭

2. **Git 저장소 연결**
   - GitHub 저장소 선택
   - pace_maker 프로젝트 Import

3. **프로젝트 설정**
   - Framework Preset: `Create React App` 자동 감지됨
   - Build Command: `npm run vercel-build` (자동 설정됨)
   - Output Directory: `build` (자동 설정됨)

4. **배포**
   - "Deploy" 버튼 클릭
   - 2-3분 대기
   - 배포 완료! 🎉

### 방법 2: Vercel CLI

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 디렉토리에서 실행
cd /Users/gyumani/Main/personal/project/pace_maker
vercel

# 프로덕션 배포
vercel --prod
```

## 🌐 배포 후 확인

배포가 완료되면 Vercel이 자동으로 URL을 제공합니다:
- Production: `https://pace-calculator-xyz.vercel.app`
- Preview: 각 커밋마다 자동 생성

### API 엔드포인트 확인

- Health Check: `https://your-app.vercel.app/api/health`
- Garmin Profile: `https://your-app.vercel.app/api/garmin/profile`
- Garmin Activities: `https://your-app.vercel.app/api/garmin/activities`

## 🔄 자동 배포 설정

Vercel은 Git 저장소와 연결되면 자동으로 배포됩니다:

1. **자동 배포 트리거**
   - `main` 또는 `master` 브랜치에 푸시 → Production 배포
   - 다른 브랜치에 푸시 → Preview 배포
   - Pull Request 생성 → Preview 배포 + 댓글로 URL 제공

2. **배포 확인**
   - Vercel 대시보드에서 실시간 로그 확인
   - 각 배포마다 고유 URL 생성

## 🛠️ 로컬 개발 환경

로컬에서 개발할 때는 여전히 백엔드 서버를 별도로 실행해야 합니다:

```bash
# 터미널 1: React 앱
npm start

# 터미널 2: Express 서버
cd server
npm start
```

## 📂 프로젝트 구조

```
pace_maker/
├── api/                    # Vercel Serverless Functions
│   ├── health.js           # Health check API
│   ├── garmin-profile.js   # Garmin 프로필 API
│   └── garmin-activities.js # Garmin 활동 API
├── src/                    # React 앱
├── server/                 # 로컬 개발용 Express 서버
│   ├── index.js
│   └── garminService.js    # API 함수들이 이 파일 공유
├── vercel.json             # Vercel 설정
└── package.json
```

## ⚙️ 환경 변수 (필요 시)

Vercel에서 환경 변수를 설정하려면:

1. Vercel Dashboard → 프로젝트 선택
2. Settings → Environment Variables
3. 변수 추가:
   - `REACT_APP_API_URL`: (선택사항, 기본값으로 자동 설정됨)

## 🐛 문제 해결

### 빌드 실패 시
- Vercel 대시보드에서 빌드 로그 확인
- `package.json`의 dependencies가 모두 설치되었는지 확인

### API 호출 실패 시
- 브라우저 개발자 도구에서 네트워크 탭 확인
- `/api/*` 경로로 요청이 가는지 확인

### CORS 에러 시
- `/api/*.js` 파일에 CORS 헤더가 설정되어 있는지 확인
- 이미 설정되어 있으므로 정상 작동해야 함

## 📱 커스텀 도메인 연결 (선택사항)

1. Vercel Dashboard → 프로젝트 선택
2. Settings → Domains
3. 도메인 추가 및 DNS 설정
4. Vercel이 자동으로 SSL 인증서 발급

## 🎯 배포 체크리스트

- [ ] Git 저장소에 코드 푸시
- [ ] Vercel에 프로젝트 Import
- [ ] 빌드 성공 확인
- [ ] 프로덕션 URL 접속 확인
- [ ] Garmin 연동 기능 테스트
- [ ] 모든 페이지 동작 확인

---

## 💡 추가 정보

- [Vercel 공식 문서](https://vercel.com/docs)
- [Create React App 배포 가이드](https://vercel.com/guides/deploying-react-with-vercel)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
