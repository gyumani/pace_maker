# 🏃‍♂️ Pace 전략 계산기 (React Version)

React와 TypeScript로 구현된 런닝 페이스 계산기입니다.

## ✨ 주요 기능

- **실시간 계산**: 페이스 입력시 즉시 누적시간과 평균페이스 자동 계산
- **동적 구간 관리**: 구간을 자유롭게 추가하거나 삭제
- **엑셀 내보내기**: 계산 결과를 Excel 파일(.xlsx)로 다운로드
- **경로 탐색**: OSRM API를 활용한 실시간 러닝 경로 계산
- **고도 프로필**: Open-Elevation API로 경로의 고도 변화 시각화
- **페이스 전략**: 체력 상태에 따른 최적 페이스 전략 제공 (최상/중간/최하)
- **⌚ Garmin 연동**: Garmin Connect 계정에서 프로필 자동 가져오기
  - VO2max, 심박수, 키, 체중, 나이 자동 입력
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기에서 최적화
- **키보드 단축키**:
  - `Ctrl+S` (또는 `Cmd+S`): 엑셀 내보내기
  - `Ctrl+N` (또는 `Cmd+N`): 새 구간 추가
- **다크모드 지원**: 시스템 설정에 따라 자동 적용

## 🚀 시작하기

### 개발 환경

```bash
# 의존성 설치
npm install

# 프론트엔드 개발 서버 실행
npm start

# 백엔드 서버 실행 (Garmin 연동 기능 사용 시)
cd server
npm install
npm start
```

**참고:** 로컬 개발 시 Garmin 연동 기능을 사용하려면 백엔드 서버를 별도로 실행해야 합니다. 프론트엔드만 사용하는 경우 백엔드 서버는 필요 없습니다.

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 빌드된 파일을 정적 서버로 테스트
npx serve -s build
```

## 🌐 Vercel 배포

이 프로젝트는 프론트엔드(React)와 백엔드(Serverless Functions)를 Vercel에 통합 배포할 수 있습니다.

### 간편 배포 (추천)

1. GitHub 저장소에 코드 푸시
2. [Vercel 대시보드](https://vercel.com/dashboard)에서 "New Project" 클릭
3. GitHub 저장소 선택
4. "Deploy" 클릭 (설정 자동 감지)

**끝!** 🎉 프론트엔드와 Garmin API가 함께 배포됩니다.

### CLI 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 배포 구조

- **프론트엔드**: React 앱 (`/src`)
- **백엔드**: Serverless Functions (`/api`)
  - `/api/health` - Health check
  - `/api/garmin/profile` - Garmin 프로필 API
  - `/api/garmin/activities` - Garmin 활동 API

자세한 배포 가이드는 [DEPLOY.md](./DEPLOY.md)를 참조하세요.

## 🛠️ 기술 스택

### 프론트엔드
- **React 19**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **Leaflet**: 인터랙티브 지도
- **XLSX**: Excel 파일 처리
- **CSS3**: 모던 스타일링 (Flexbox, Grid, 애니메이션)

### 백엔드
- **Vercel Serverless Functions**: API 서버리스 백엔드
- **garmin-connect**: Garmin Connect API 클라이언트

### 외부 API
- **OSRM**: 경로 계산
- **Open-Elevation**: 고도 데이터
- **Garmin Connect**: 사용자 프로필 및 활동 데이터

### 배포
- **Vercel**: 프론트엔드 + 백엔드 통합 배포

## 📁 프로젝트 구조

```
pace_maker/
├── api/                          # Vercel Serverless Functions
│   ├── health.js                 # Health check API
│   ├── garmin-profile.js         # Garmin 프로필 API
│   └── garmin-activities.js      # Garmin 활동 API
├── src/                          # React 앱
│   ├── components/               # React 컴포넌트
│   │   ├── RouteCalculation.tsx  # 경로 계산
│   │   ├── ElevationProfile.tsx  # 고도 프로필
│   │   └── GarminConnect.tsx     # Garmin 연동
│   ├── services/                 # 비즈니스 로직
│   │   ├── garminApiService.ts   # Garmin API 클라이언트
│   │   ├── paceStrategyService.ts # 페이스 전략 계산
│   │   └── ...
│   ├── types/                    # TypeScript 타입 정의
│   ├── App.tsx                   # 메인 컴포넌트
│   ├── App.css                   # 스타일시트
│   └── index.tsx                 # 앱 엔트리포인트
├── server/                       # 로컬 개발용 Express 서버
│   ├── index.js                  # Express 서버
│   └── garminService.js          # Garmin 서비스 로직
├── public/                       # 정적 파일
├── build/                        # 빌드된 파일들 (배포용)
├── vercel.json                   # Vercel 배포 설정
├── DEPLOY.md                     # 배포 가이드
└── package.json                  # 프로젝트 설정
```

## 🎯 사용법

1. **페이스 입력**: "4:30" 형식으로 입력 (4분 30초)
2. **구간 추가**: "구간 추가" 버튼으로 새로운 km 추가
3. **자동 계산**: 누적시간과 평균페이스가 실시간으로 계산
4. **엑셀 내보내기**: 계산 결과를 Excel 파일로 다운로드

## 🔧 개발

### 스크립트

- `npm start`: 개발 서버 실행 (http://localhost:3000)
- `npm run build`: 프로덕션 빌드
- `npm test`: 테스트 실행
- `npm run eject`: Create React App 설정 추출

### 코드 스타일

- TypeScript 엄격 모드 사용
- React Hooks와 함수형 컴포넌트
- useCallback, useMemo로 성능 최적화
- CSS-in-JS 없이 순수 CSS 사용

## 📱 브라우저 지원

- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

🏃‍♂️ Happy Running!
