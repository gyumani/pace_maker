# 로깅 확인 실전 가이드

## 🚀 빠른 시작

### 1. Vercel CLI로 실시간 로그 보기

```bash
# 터미널에서 실행
vercel logs --follow
```

### 2. 다른 터미널에서 테스트 실행

```bash
# Garmin 로그인 테스트
curl -X POST https://pace-calculator-nine.vercel.app/api/garmin/profile \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

### 3. 로그 출력 예시

```
2024-03-12 10:25:30 GMT  api/garmin/profile.js  📍 [Profile API] 요청 시작: {
  timestamp: '2024-03-12T10:25:30.123Z',
  method: 'POST',
  url: '/api/garmin/profile'
}

2024-03-12 10:25:30 GMT  api/garmin/profile.js  🔄 [Profile API] Garmin 로그인 시도: user@email.com

2024-03-12 10:25:31 GMT  api/_lib/garmin.js      ✅ Garmin Connect 로그인 성공: user@email.com

2024-03-12 10:25:32 GMT  api/garmin/profile.js  ✅ [Profile API] 성공: {
  email: 'user@email.com',
  duration: '1234ms',
  profileData: { age: 30, vo2max: 45, weight: 70 }
}
```

## 📊 로그 구조

### 성공 플로우
```
📍 요청 시작
  ↓
🔄 작업 진행 중
  ↓
✅ 성공 (duration 포함)
```

### 실패 플로우
```
📍 요청 시작
  ↓
⚠️ 경고 또는
❌ 에러 (stack trace 포함)
```

## 🔍 Vercel 대시보드에서 확인

### 1. 빌드 로그
1. https://vercel.com 로그인
2. `pace-calculator` 프로젝트 클릭
3. **Deployments** 탭
4. 최신 배포 클릭
5. **Building** 섹션 확인

**확인 사항:**
```
✅ Installing dependencies...
✅ Running "npm run build"
✅ Creating an optimized production build...
✅ Compiled successfully
✅ Build Completed
```

### 2. Function 로그 (실시간)
1. Vercel 대시보드
2. 프로젝트 → **Logs** 탭
3. 필터:
   - `Function: api/garmin/profile.js`
   - `Level: All`

## 🎯 로그 필터링

### CLI에서 필터링

```bash
# 에러만 보기
vercel logs --follow | grep "❌\|Error"

# Profile API만 보기
vercel logs --follow | grep "Profile API"

# 성공 로그만
vercel logs --follow | grep "✅"

# duration(성능) 확인
vercel logs --follow | grep "duration"
```

## 📈 로그 분석 예시

### 성능 분석
```bash
# 로그에서 duration 추출
vercel logs | grep "duration" | tail -20

# 출력:
duration: '456ms'   # 빠름
duration: '1234ms'  # 보통
duration: '3456ms'  # 느림 (Garmin API 응답 지연)
```

### 에러 추적
```bash
# 최근 에러 확인
vercel logs | grep "❌" | tail -10

# 출력:
❌ [Profile API] 실패: {
  error: 'Garmin 로그인 실패: Invalid credentials',
  duration: '234ms',
  stack: 'Error: Invalid credentials\n    at ...'
}
```

## 🛠️ 로컬 테스트

로컬에서도 동일한 로그 확인 가능:

```bash
# 터미널 1: 서버 실행
cd server
npm start

# 터미널 2: 테스트
curl -X POST http://localhost:3001/api/garmin/profile \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# 터미널 1에서 로그 확인:
📍 [Profile API] 요청 시작: {...}
🔄 [Profile API] Garmin 로그인 시도: test@test.com
✅ [Profile API] 성공: {...}
```

## 🔔 알림 설정 (선택)

### Vercel 알림 (Pro 플랜)
1. Vercel 대시보드
2. 프로젝트 → **Settings** → **Notifications**
3. 알림 설정:
   - Deployment failed
   - Function errors
   - Performance alerts

## 📝 로그 레벨별 의미

| 아이콘 | 레벨 | 의미 | 사용 시점 |
|--------|------|------|----------|
| 📍 | INFO | 정보 | 요청 시작, 상태 변경 |
| 🔄 | INFO | 진행 | 작업 처리 중 |
| ✅ | SUCCESS | 성공 | 작업 완료 |
| ⚠️ | WARN | 경고 | 잘못된 입력, 권한 없음 |
| ❌ | ERROR | 에러 | 예외 발생, 실패 |

## 🎓 문제 해결 시나리오

### 시나리오 1: "백엔드 서버가 실행 중이 아닙니다"

**로그 확인:**
```bash
vercel logs --follow | grep "health"
```

**예상 로그:**
- **없음** → API 함수가 배포되지 않음
- **404** → 경로 오류
- **200** → 정상 (클라이언트 문제)

### 시나리오 2: Garmin 로그인 실패

**로그 확인:**
```bash
vercel logs --follow | grep "Garmin"
```

**예상 출력:**
```
❌ Garmin Connect 로그인 실패: Invalid credentials
→ 이메일/비밀번호 확인

❌ Garmin Connect 로그인 실패: Network error
→ Garmin 서버 문제 또는 네트워크 이슈
```

### 시나리오 3: 느린 응답 속도

**로그 확인:**
```bash
vercel logs | grep "duration" | tail -20
```

**분석:**
- `<500ms` → 정상
- `500-2000ms` → 보통 (Garmin API 응답)
- `>2000ms` → 느림 (Garmin 서버 부하)

## 🚨 중요 체크리스트

배포 후 확인:
- [ ] 빌드 성공 확인
- [ ] Health check 200 응답
- [ ] Profile API 테스트
- [ ] Activities API 테스트
- [ ] 로그에서 에러 없는지 확인
- [ ] duration이 적절한지 확인

## 📚 추가 명령어

```bash
# 최근 100개 로그
vercel logs --limit=100

# 특정 배포의 로그
vercel logs [deployment-url]

# JSON 형식으로
vercel logs --output=json

# 특정 시간 범위
vercel logs --since=1h  # 최근 1시간
vercel logs --since=1d  # 최근 1일
```
