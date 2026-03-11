# Vercel 배포 가이드

## 자동 배포 (GitHub 연동)

### 1. GitHub 리포지토리에 푸시
```bash
git add .
git commit -m "Update for Vercel deployment"
git push origin master
```

### 2. Vercel에서 자동 배포
- GitHub과 연동되어 있다면 자동으로 배포됩니다
- 배포 상태는 Vercel 대시보드에서 확인

## 수동 배포 (Vercel CLI)

### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

### 2. 배포
```bash
vercel
```

프로덕션 배포:
```bash
vercel --prod
```

## 배포 후 확인사항

### ✅ 체크리스트

1. **프론트엔드 작동 확인**
   - `https://your-app.vercel.app` 접속
   - 페이지가 정상적으로 로드되는지 확인

2. **API 함수 작동 확인**
   ```bash
   # Health check
   curl https://your-app.vercel.app/api/health

   # 결과: {"status":"ok","message":"Pace Calculator Server is running on Vercel"}
   ```

3. **Garmin API 테스트**
   ```bash
   curl -X POST https://your-app.vercel.app/api/garmin/profile \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword"}'
   ```

## 주요 설정 파일

### `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### API 함수 구조
```
/api
├── _lib/
│   └── garmin.js       # 공유 Garmin 로직
├── health.js           # GET  /api/health
├── garmin-profile.js   # POST /api/garmin/profile
└── garmin-activities.js # POST /api/garmin/activities
```

## 환경 변수 설정

Vercel 대시보드에서 환경 변수 설정:

1. Vercel 프로젝트 → Settings → Environment Variables
2. 필요한 경우 환경 변수 추가:
   - `NODE_ENV=production` (자동 설정됨)
   - 기타 필요한 환경 변수

## 문제 해결

### 1. API 함수가 404 에러

**원인:** API 경로가 잘못됨

**해결:**
- `/api/garmin/profile` 사용 (올바름)
- `/api/garmin-profile` 사용하지 않기

### 2. "Module not found" 에러

**원인:** 의존성 패키지가 설치되지 않음

**해결:**
- `package.json`에 `garmin-connect` 포함 확인
- Vercel이 자동으로 `npm install` 실행

### 3. CORS 에러

**원인:** API 함수에서 CORS 헤더 미설정

**해결:**
- 모든 API 함수에 CORS 헤더가 이미 설정되어 있음
- 추가 설정 불필요

### 4. 빌드 실패

**로그 확인:**
```bash
vercel logs
```

**일반적인 원인:**
- TypeScript 컴파일 에러
- 누락된 의존성
- vercel.json 설정 오류

## 로컬 vs Vercel 차이점

### 로컬 개발
```
프론트엔드: localhost:3000
백엔드: localhost:3001 (별도 서버 실행 필요)
```

**실행 방법:**
```bash
npm run dev  # 프론트엔드 + 백엔드 동시 실행
```

### Vercel 배포
```
프론트엔드: your-app.vercel.app
백엔드: your-app.vercel.app/api/* (자동 실행)
```

**특징:**
- Serverless Functions가 자동으로 실행됨
- 별도 서버 관리 불필요
- Cold Start 있을 수 있음 (첫 요청이 느릴 수 있음)

## 성능 최적화

### 1. Serverless Functions Cold Start 줄이기
- 자주 호출되는 API는 자동으로 Warm 상태 유지
- 첫 요청 시 2-3초 소요 가능

### 2. 번들 크기 줄이기
```bash
# 빌드 분석
npm run build
```

### 3. 캐싱 활용
- Vercel은 자동으로 정적 파일 캐싱
- API 응답은 필요 시 캐시 헤더 추가

## 배포 URL 확인

배포가 완료되면 Vercel이 제공하는 URL:

- **프로덕션:** `https://pace-maker.vercel.app`
- **프리뷰:** `https://pace-maker-[hash].vercel.app` (각 커밋마다)

## 도메인 연결 (선택사항)

1. Vercel 대시보드 → Settings → Domains
2. 커스텀 도메인 추가
3. DNS 설정 (Vercel 가이드 참고)

## 주의사항

⚠️ **Garmin 로그인 정보 보안**
- 세션은 클라이언트 쿠키에 1시간 동안만 저장
- 서버는 로그인 정보를 저장하지 않음
- HTTPS로 통신 (Vercel 자동 제공)

⚠️ **사용량 제한**
- Vercel Free 플랜: 월 100GB 대역폭
- Serverless Functions: 100GB-hrs/월
- 초과 시 플랜 업그레이드 필요

## 모니터링

### Vercel Analytics
1. Vercel 대시보드 → Analytics
2. 페이지뷰, 성능 메트릭 확인

### 로그 확인
```bash
# 실시간 로그
vercel logs --follow

# 특정 배포 로그
vercel logs [deployment-url]
```

## 롤백

문제가 발생하면 이전 배포로 롤백:

1. Vercel 대시보드 → Deployments
2. 이전 배포 선택
3. "Promote to Production" 클릭
