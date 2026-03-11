# Vercel API 경로 문제 해결

## 🔴 문제 원인

### 이전 구조 (틀림)
```
/api
├── garmin-profile.js    → /api/garmin-profile
└── garmin-activities.js → /api/garmin-activities
```

### 프론트엔드 호출
```javascript
fetch('/api/garmin/profile')    // ❌ 경로 불일치!
fetch('/api/garmin/activities') // ❌ 경로 불일치!
```

**Vercel은 파일 구조를 그대로 URL로 변환합니다!**

## ✅ 해결 방법

### 새 구조 (올바름)
```
/api
├── _lib/
│   └── garmin.js           # 공유 로직
├── garmin/
│   ├── profile.js          → /api/garmin/profile ✅
│   └── activities.js       → /api/garmin/activities ✅
└── health.js               → /api/health ✅
```

### 변경 사항

1. **디렉토리 생성**
   ```bash
   mkdir -p api/garmin
   ```

2. **파일 이동**
   ```bash
   mv api/garmin-profile.js api/garmin/profile.js
   mv api/garmin-activities.js api/garmin/activities.js
   ```

3. **상대 경로 수정**
   ```javascript
   // api/garmin/profile.js
   const { getUserProfile } = require('../_lib/garmin'); // ✅

   // api/garmin/activities.js
   const { getRecentActivities } = require('../_lib/garmin'); // ✅
   ```

## 📝 배포 방법

### GitHub에 푸시
```bash
git add .
git commit -m "Fix: API 경로 구조 수정 - Vercel 호환"
git push origin master
```

Vercel이 자동으로 감지하고 재배포합니다 (약 2-3분 소요)

## ✅ 테스트 방법

### 1. 배포 완료 대기
Vercel 대시보드에서 "Building" → "Ready" 상태 확인

### 2. Health Check
```bash
curl https://your-app.vercel.app/api/health
```
**예상 응답:**
```json
{"status":"ok","message":"Pace Calculator Server is running on Vercel"}
```

### 3. Garmin API 테스트
```bash
curl -X POST https://your-app.vercel.app/api/garmin/profile \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 4. 브라우저에서 테스트
1. https://your-app.vercel.app 접속
2. "Garmin 연동" 탭 선택
3. 이메일/비밀번호 입력
4. 로그인 시도

**성공 시:** 프로필 정보와 활동 내역이 표시됨
**실패 시:** 개발자 도구(F12) → Console/Network 탭 확인

## 🐛 문제 해결

### "백엔드 서버가 실행 중이 아닙니다" 오류

**원인 1: 배포 진행 중**
- Vercel 대시보드 확인
- 빌드 완료까지 2-3분 대기

**원인 2: API 경로 오류**
- 개발자 도구 → Network 탭
- 실패한 요청 확인
- URL이 `/api/garmin/profile`인지 확인

**원인 3: CORS 오류**
- Console에 CORS 관련 에러 확인
- API 함수에 CORS 헤더가 설정되어 있어야 함 (이미 설정됨)

### 로컬에서는 작동하는데 Vercel에서 안 됨

**로컬:** `localhost:3001` 서버 사용
**Vercel:** Serverless Functions 사용 (다른 환경)

**확인 사항:**
1. `package.json`에 `garmin-connect` 포함되어 있는지
2. `api/_lib/garmin.js`가 정상적으로 배포되었는지
3. Vercel 로그 확인: `vercel logs`

## 📊 최종 구조 확인

```bash
# 올바른 구조
ls -R api/

api/:
_lib  garmin  health.js

api/_lib:
garmin.js

api/garmin:
activities.js  profile.js
```

## 🎯 핵심 포인트

1. **Vercel은 파일 시스템을 URL로 매핑**
   - `api/garmin/profile.js` → `/api/garmin/profile`
   - `api/health.js` → `/api/health`

2. **rewrites는 SPA 라우팅용**
   - API 경로 변경에는 사용 불가
   - 파일 구조를 직접 변경해야 함

3. **상대 경로 주의**
   - `api/garmin/profile.js`에서 `_lib` 접근: `../` 필요
   - `require('../_lib/garmin')`

4. **dependencies 확인**
   - `garmin-connect`가 `dependencies`에 있어야 함
   - `devDependencies`가 아님!

## 🚀 다음 단계

1. GitHub에 푸시
2. Vercel 자동 배포 대기 (2-3분)
3. 브라우저에서 테스트
4. 성공! 🎉
