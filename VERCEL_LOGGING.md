# Vercel 로깅 가이드

## 📊 Vercel 로깅 종류

### 1. 빌드 로그 (Build Logs)
프론트엔드(React) 빌드 과정

### 2. Function 로그 (Runtime Logs)
Serverless Functions(API) 실행 로그

## 🔍 로그 확인 방법

### 방법 1: Vercel 대시보드 (웹)

#### 빌드 로그
1. https://vercel.com 로그인
2. 프로젝트 선택 (pace-calculator)
3. **Deployments** 탭
4. 최신 배포 클릭
5. **Building** 섹션에서 빌드 로그 확인

**확인 가능한 정보:**
```
- npm install 과정
- React 빌드 (npm run build)
- 정적 파일 생성
- 빌드 성공/실패
```

#### Function 로그 (API 실행 로그)
1. Vercel 대시보드
2. 프로젝트 선택
3. **Logs** 탭 또는 **Functions** 탭
4. 실시간 로그 확인

**확인 가능한 정보:**
```
- API 호출 시간
- console.log() 출력
- 에러 스택 트레이스
- 실행 시간 (duration)
- 메모리 사용량
```

### 방법 2: Vercel CLI (권장)

#### 설치
```bash
npm install -g vercel
```

#### 실시간 로그 보기
```bash
# 모든 로그 (빌드 + Function)
vercel logs --follow

# 특정 배포의 로그
vercel logs [deployment-url]

# 최근 100개 로그
vercel logs --limit=100

# 특정 Function만
vercel logs --follow --output=functions
```

**예시:**
```bash
# 실시간 API 로그 모니터링
vercel logs --follow

# 출력 예:
2024-03-12 10:25:30  api/garmin/profile.js  ✅ Garmin Connect 로그인 성공: user@email.com
2024-03-12 10:25:31  api/garmin/profile.js  Profile API completed in 1234ms
```

### 방법 3: Vercel API (프로그래밍)

```bash
# Vercel API 토큰 필요
curl "https://api.vercel.com/v2/deployments/[deployment-id]/events" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 API 함수에 로깅 추가

### 현재 로깅 상태

**api/garmin/profile.js:**
```javascript
module.exports = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ 이미 console.log 있음
    console.log('✅ Garmin Connect 로그인 성공:', email);

    const profile = await getUserProfile(email, password);

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    // ✅ 이미 console.error 있음
    console.error('Profile API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### 더 상세한 로깅 추가

**api/garmin/profile.js 개선:**
```javascript
module.exports = async (req, res) => {
  const startTime = Date.now();

  try {
    console.log('📍 [Profile API] 요청 시작:', {
      method: req.method,
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    const { email, password } = req.body;

    if (!email || !password) {
      console.warn('⚠️ [Profile API] 인증 정보 누락');
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요'
      });
    }

    console.log('🔄 [Profile API] Garmin 로그인 시도:', email);
    const profile = await getUserProfile(email, password);

    const duration = Date.now() - startTime;
    console.log('✅ [Profile API] 성공:', {
      email,
      duration: `${duration}ms`,
      vo2max: profile.vo2max,
      age: profile.age
    });

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [Profile API] 실패:', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

## 🎯 구조화된 로깅 패턴

### 로그 레벨별 사용

```javascript
// ℹ️ 정보성 로그
console.log('ℹ️ [API명] 동작:', data);

// ✅ 성공 로그
console.log('✅ [API명] 성공:', result);

// ⚠️ 경고 로그
console.warn('⚠️ [API명] 경고:', warning);

// ❌ 에러 로그
console.error('❌ [API명] 에러:', error);

// 🔄 진행 중 로그
console.log('🔄 [API명] 처리 중:', status);
```

### 성능 측정

```javascript
const startTime = performance.now();
// ... 작업 수행
const duration = performance.now() - startTime;
console.log(`⏱️ 실행 시간: ${duration.toFixed(2)}ms`);
```

## 📊 로그 분석 팁

### 1. 에러 추적
```bash
# 에러만 필터링
vercel logs --follow | grep "❌\|Error\|error"
```

### 2. 특정 API 추적
```bash
# profile API만
vercel logs --follow | grep "Profile API"
```

### 3. 성능 모니터링
```bash
# 실행 시간 추적
vercel logs --follow | grep "duration"
```

## 🚨 주의사항

### ❌ 하면 안 되는 것

```javascript
// 1. 민감한 정보 로깅 금지
console.log('비밀번호:', password);  // ❌
console.log('API 키:', apiKey);      // ❌

// 2. 너무 많은 로그 (비용 증가)
for (let i = 0; i < 10000; i++) {
  console.log(i);  // ❌
}
```

### ✅ 해야 하는 것

```javascript
// 1. 민감 정보 마스킹
console.log('이메일:', email);  // ✅
console.log('프로필:', { age, vo2max });  // ✅

// 2. 구조화된 로그
console.log('요청:', { method, path, timestamp });  // ✅

// 3. 에러 스택 포함
console.error('에러:', error.message, error.stack);  // ✅
```

## 🎛️ Vercel 로그 제한

### Free 플랜
- **보관 기간:** 1시간
- **로그 크기:** 제한 있음
- **실시간 스트리밍:** 가능

### Pro 플랜
- **보관 기간:** 24시간
- **로그 크기:** 더 큼
- **고급 필터링:** 가능

## 📈 모니터링 대시보드 설정

### 1. Vercel Analytics 활성화
1. Vercel 대시보드
2. 프로젝트 → **Analytics**
3. Enable Analytics

### 2. 확인 가능한 메트릭
- Page views
- API 호출 횟수
- 에러율
- 평균 응답 시간
- 지역별 트래픽

## 🔧 로컬 vs Vercel 로그 비교

| 항목 | 로컬 (localhost:3001) | Vercel |
|------|---------------------|--------|
| **출력 위치** | 터미널 콘솔 | Vercel 대시보드/CLI |
| **보관 기간** | 세션 종료 시까지 | 1시간 (Free) / 24시간 (Pro) |
| **실시간 확인** | 터미널에 즉시 표시 | `vercel logs --follow` |
| **구조화** | `console.log` 사용 | 동일하게 `console.log` |

## 🚀 실전 사용 예시

### 배포 후 로그 모니터링

```bash
# 1. 배포
git push origin master

# 2. 배포 완료 대기
vercel --prod

# 3. 실시간 로그 확인
vercel logs --follow

# 4. 테스트 (다른 터미널)
curl -X POST https://pace-calculator-nine.vercel.app/api/garmin/profile \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# 5. 로그에서 확인
# 📍 [Profile API] 요청 시작: {...}
# 🔄 [Profile API] Garmin 로그인 시도: test@test.com
# ✅ [Profile API] 성공: {...}
```

## 📚 추가 리소스

- [Vercel Logs Documentation](https://vercel.com/docs/observability/logs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Vercel Analytics](https://vercel.com/docs/analytics)
