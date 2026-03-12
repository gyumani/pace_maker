# Vercel 배포 원리 상세 설명

## 🤔 "클라이언트만 올라가는 거 아니야?"

**아닙니다!** Vercel은 똑똑하게 작동합니다.

## 🔍 Vercel의 자동 감지 메커니즘

### 1. 프론트엔드 (클라이언트)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build"
}
```
→ React 앱 빌드 → `build/` 디렉토리 → 정적 파일 호스팅

### 2. 백엔드 (서버) - **자동 감지!**
```
/api 디렉토리 발견
  ↓
자동으로 Serverless Functions로 인식
  ↓
각 .js 파일 = 하나의 API 엔드포인트
```

## 📂 Vercel이 보는 프로젝트 구조

```
pace_maker/
├── src/                     ← React 소스 (빌드됨)
├── build/                   ← 빌드 결과물 (정적 파일)
│   ├── index.html
│   ├── static/
│   └── ...
│
└── api/                     ← 🔥 자동으로 Serverless Functions로 배포!
    ├── health.js            → /api/health
    ├── garmin/
    │   ├── profile.js       → /api/garmin/profile
    │   └── activities.js    → /api/garmin/activities
    └── _lib/
        └── garmin.js        → 공유 라이브러리 (엔드포인트 아님)
```

## 🎯 배포 과정

### Step 1: 프론트엔드 빌드
```bash
npm run build
→ build/ 디렉토리 생성
→ 정적 파일 (HTML, CSS, JS)
```

### Step 2: API 함수 자동 감지 (별도 설정 불필요!)
```
Vercel이 자동으로 감지:
✅ api/health.js 발견 → Serverless Function 생성
✅ api/garmin/profile.js 발견 → Serverless Function 생성
✅ api/garmin/activities.js 발견 → Serverless Function 생성
✅ api/_lib/garmin.js → 엔드포인트 아님 (공유 라이브러리)
```

### Step 3: 배포
```
프론트엔드: CDN에 배포 (전 세계 분산)
백엔드 API: Serverless Functions (요청 시 실행)
```

## 🔧 vercel.json의 역할

```json
{
  "buildCommand": "npm run build",        // 프론트엔드 빌드
  "outputDirectory": "build",             // 정적 파일 위치
  "rewrites": [                           // URL 라우팅 규칙
    {
      "source": "/api/:path*",            // /api/* 요청은
      "destination": "/api/:path*"        // /api/* 함수로
    },
    {
      "source": "/(.*)",                  // 나머지는
      "destination": "/index.html"        // SPA 라우팅
    }
  ]
}
```

**중요:** `rewrites`는 라우팅 규칙일 뿐, API 함수 배포와는 **별개**입니다!

## ✅ Vercel이 자동으로 하는 것

1. **`/api` 디렉토리 스캔**
2. **각 `.js`, `.ts` 파일을 Serverless Function으로 변환**
3. **`node_modules` 자동 번들링**
4. **환경 변수 주입**
5. **HTTPS 자동 설정**

## 🎯 실제 배포 결과

### 프론트엔드
```
https://pace-calculator-nine.vercel.app
→ build/index.html 제공 (CDN)
```

### 백엔드 API
```
https://pace-calculator-nine.vercel.app/api/health
→ api/health.js 실행 (Serverless Function)

https://pace-calculator-nine.vercel.app/api/garmin/profile
→ api/garmin/profile.js 실행 (Serverless Function)

https://pace-calculator-nine.vercel.app/api/garmin/activities
→ api/garmin/activities.js 실행 (Serverless Function)
```

## 🔍 확인 방법

### 1. Vercel 대시보드에서 확인

1. https://vercel.com 로그인
2. `pace-calculator` 프로젝트
3. **Functions** 탭 클릭

**보이는 것:**
```
✅ /api/health
✅ /api/garmin/profile
✅ /api/garmin/activities
```

### 2. 배포 로그에서 확인

```bash
vercel logs

# 출력:
Detected the following Serverless Functions:
  - api/health.js
  - api/garmin/profile.js
  - api/garmin/activities.js
```

### 3. 직접 테스트

```bash
# Health check
curl https://pace-calculator-nine.vercel.app/api/health
→ {"status":"ok","message":"..."}

# Profile API
curl -X POST https://pace-calculator-nine.vercel.app/api/garmin/profile \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
→ {"success":false,"error":"..."}
```

## 💡 왜 명시적 설정이 없어도 되나?

Vercel의 **Zero Config 철학:**

```javascript
// 이 형태를 자동 감지
module.exports = async (req, res) => {
  res.json({ ... });
};

// 또는
export default async function handler(req, res) {
  res.json({ ... });
}
```

**파일 위치 = API 경로**
- `api/health.js` → `/api/health`
- `api/garmin/profile.js` → `/api/garmin/profile`
- `api/foo/bar/baz.js` → `/api/foo/bar/baz`

## 📊 배포 후 확인 체크리스트

```bash
# 1. 프론트엔드
curl https://pace-calculator-nine.vercel.app
→ HTML 반환 ✅

# 2. Health API
curl https://pace-calculator-nine.vercel.app/api/health
→ JSON 반환 ✅

# 3. Garmin Profile API
curl -X POST https://pace-calculator-nine.vercel.app/api/garmin/profile \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
→ JSON 반환 ✅
```

## 🔧 명시적 설정 (선택사항)

더 세밀한 제어가 필요하다면:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x",
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [...]
}
```

하지만 **현재는 불필요합니다!** 기본 설정으로 충분합니다.

## 🎯 정리

| 구성 요소 | 설정 방법 | 배포 방식 |
|----------|----------|----------|
| **프론트엔드** | `buildCommand`, `outputDirectory` | 정적 파일 (CDN) |
| **백엔드 API** | ❌ 설정 불필요 (자동 감지) | Serverless Functions |
| **라우팅** | `rewrites` | URL 매핑 규칙 |

## ✅ 결론

```
vercel.json에 API 설정이 없어도
→ /api 디렉토리를 자동 감지
→ Serverless Functions로 배포
→ 클라이언트 + 서버 모두 정상 작동!
```

**현재 설정은 완벽합니다!** 🎉
