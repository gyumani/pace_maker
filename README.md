# 🏃‍♂️ Pace 전략 계산기 (React Version)

React와 TypeScript로 구현된 런닝 페이스 계산기입니다.

## ✨ 주요 기능

- **실시간 계산**: 페이스 입력시 즉시 누적시간과 평균페이스 자동 계산
- **동적 구간 관리**: 구간을 자유롭게 추가하거나 삭제
- **엑셀 내보내기**: 계산 결과를 Excel 파일(.xlsx)로 다운로드
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

# 개발 서버 실행
npm start
```

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 빌드된 파일을 정적 서버로 테스트
npx serve -s build
```

## 🌐 Vercel 배포

### 1. Vercel CLI 설치 및 배포

```bash
# Vercel CLI 설치 (전역)
npm i -g vercel

# Vercel에 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 2. GitHub 연동 배포

1. GitHub 저장소에 코드 푸시
2. [Vercel 대시보드](https://vercel.com/dashboard)에서 "New Project" 클릭
3. GitHub 저장소 선택
4. 빌드 설정:
   - Framework Preset: **Create React App**
   - Build Command: `npm run build`
   - Output Directory: `build`
5. Deploy 클릭

### 3. 환경 변수 (선택사항)

Vercel 대시보드 > Settings > Environment Variables에서 설정:

```
NODE_ENV=production
```

## 🛠️ 기술 스택

- **React 19**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **XLSX**: Excel 파일 처리
- **CSS3**: 모던 스타일링 (Flexbox, Grid, 애니메이션)
- **Vercel**: 배포 플랫폼

## 📁 프로젝트 구조

```
src/
├── App.tsx          # 메인 컴포넌트
├── App.css          # 스타일시트
├── index.tsx        # 앱 엔트리포인트
└── ...

public/
├── index.html       # HTML 템플릿
└── ...

build/               # 빌드된 파일들 (배포용)
vercel.json         # Vercel 배포 설정
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
