# 골크러쉬 데이터센터 - 모바일 앱

여자 연예인 축구 경기 데이터, 선수 통계, 커뮤니티 기능을 제공하는 모바일 앱입니다.

> 웹 버전: [www.gtndatacenter.com](https://www.gtndatacenter.com)

## 기술 스택

- **프레임워크**: React Native + Expo 55
- **라우팅**: Expo Router (파일 기반 라우팅)
- **스타일링**: NativeWind (Tailwind CSS for React Native)
- **인증**: Supabase Auth + expo-secure-store
- **데이터 페칭**: TanStack React Query
- **폼 관리**: react-hook-form + Zod
- **아이콘**: lucide-react-native
- **언어**: TypeScript

## 주요 기능

- **홈 대시보드**: 최근 경기 결과, 순위표, 주요 통계
- **시즌**: 시즌별 경기 일정 및 결과
- **선수**: 선수 프로필, 통계, 검색/필터
- **팀**: 팀 정보, 스쿼드, 팀 통계
- **코치**: 코치 프로필, 경력, 통계
- **경기**: 경기 상세 정보, 라인업, 골/어시스트, 상대전적
- **통계**: 득점/어시스트/출전 랭킹, 골키퍼 통계, 상대전적, 승부차기
- **판타지 리그**: 나만의 팀 구성, 포인트 시스템, 랭킹
- **커뮤니티**: 게시글, 댓글, 좋아요, MVP 투표
- **응원**: 경기 응원 투표 및 메시지
- **선수 평점**: 선수 능력치 평가 및 리뷰
- **관리자**: 경기 기록, 선수/팀/시즌 관리

## 시작하기

### 사전 요구 사항

- Node.js 18 이상
- npm 또는 yarn
- Expo Go 앱 (iOS/Android) 또는 개발 빌드

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

### 실행

```bash
# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터
npm run android

# 웹 브라우저
npm run web
```

### 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수를 설정합니다:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_BASE_URL=https://www.gtndatacenter.com
```

## 프로젝트 구조

```
goal-crush-app/
├── app/                          # Expo Router 페이지
│   ├── _layout.tsx               # 루트 레이아웃
│   ├── (tabs)/                   # 하단 탭 네비게이터
│   │   ├── index.tsx             # 홈
│   │   ├── seasons/              # 시즌
│   │   ├── players/              # 선수
│   │   ├── stats/                # 통계
│   │   └── more.tsx              # 더보기
│   ├── teams/                    # 팀
│   ├── coaches/                  # 코치
│   ├── matches/                  # 경기
│   ├── fantasy/                  # 판타지
│   ├── community/                # 커뮤니티
│   ├── supports/                 # 응원
│   ├── profile/                  # 프로필
│   ├── admin/                    # 관리자
│   └── auth/                     # 인증
├── src/
│   ├── api/                      # API 클라이언트
│   ├── hooks/                    # 커스텀 훅
│   ├── types/                    # TypeScript 타입 정의
│   ├── components/               # 공용 컴포넌트
│   │   └── ui/                   # 기본 UI 컴포넌트
│   ├── features/                 # 기능별 컴포넌트
│   ├── design-system/            # 디자인 토큰
│   ├── constants/                # 상수
│   ├── lib/                      # 유틸리티
│   └── config/                   # 설정
└── assets/                       # 이미지, 폰트 등
```

## 백엔드

이 앱은 별도의 백엔드 서버를 사용하지 않고, [골크러쉬 데이터센터](https://www.gtndatacenter.com) 웹사이트의 API를 직접 호출합니다.
