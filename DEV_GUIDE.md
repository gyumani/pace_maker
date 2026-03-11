# 개발 가이드

## 로컬 개발 환경 실행

### 방법 1: 한 번에 실행 (권장)

```bash
npm run dev
```

이 명령어는 백엔드 서버와 프론트엔드를 동시에 실행합니다.

### 방법 2: 개별 실행

**터미널 1 - 백엔드 서버:**
```bash
cd server
npm install  # 최초 1회만
npm start
```

**터미널 2 - 프론트엔드:**
```bash
npm start
```

## 환경별 구성

### 로컬 개발
- **프론트엔드**: http://localhost:3000
- **백엔드**: http://localhost:3001
- Garmin API는 백엔드 서버를 통해 호출

### Vercel 배포
- **프론트엔드**: https://your-app.vercel.app
- **백엔드 API**: https://your-app.vercel.app/api/*
- `/api` 디렉토리의 Serverless Functions가 자동 실행
- 별도 서버 실행 불필요

## API 엔드포인트

### Health Check
```bash
GET http://localhost:3001/health
```

### Garmin 프로필
```bash
POST http://localhost:3001/api/garmin/profile
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "yourpassword"
}
```

### Garmin 활동 내역
```bash
POST http://localhost:3001/api/garmin/activities?limit=5
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "yourpassword"
}
```

## 문제 해결

### "백엔드 서버가 실행 중이 아닙니다" 오류

**로컬 개발 시:**
```bash
# 백엔드 서버 시작
cd server
npm start
```

**Vercel 배포 후:**
- Serverless Functions가 자동으로 작동하므로 별도 조치 불필요
- API는 `/api/*` 경로에서 자동 실행됨

### 포트가 이미 사용 중

**프론트엔드 (3000):**
```bash
# 실행 중인 프로세스 확인
lsof -i :3000
# 프로세스 종료
kill -9 <PID>
```

**백엔드 (3001):**
```bash
lsof -i :3001
kill -9 <PID>
```

## 배포

### Vercel 배포
```bash
# Vercel CLI 설치 (최초 1회)
npm install -g vercel

# 배포
vercel
```

또는 GitHub에 푸시하면 자동 배포됩니다.

## 기능별 사용법

### Garmin 로그인
1. 프로필 설정 섹션에서 "Garmin 연동" 탭 선택
2. Garmin Connect 이메일/비밀번호 입력
3. 로그인하면 프로필과 최근 활동 자동 로드
4. 세션은 1시간 동안 유지됨

### 경로 계산
1. 사용자 프로필 입력 (나이, VO2Max 필수)
2. "경로 계산" 탭 선택
3. 지도에서 출발지/도착지 클릭
4. 경로 계산 후 3가지 전략 확인
5. 엑셀 다운로드 가능

### 구간별 계산
1. 각 구간의 거리와 페이스 입력
2. 자동으로 누적시간, 평균페이스, 심박수 계산
3. 엑셀 다운로드 가능
