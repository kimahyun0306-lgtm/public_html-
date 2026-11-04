# 김아현 개인 포트폴리오 (Kim Ahyeon Portfolio)

데이터사이언스학부 2학년 김아현의 학업 성과와 분석 프로젝트를 체계적으로 기록하고 소개하는 화이트 미니멀 포트폴리오 웹사이트입니다.

---

## 1. 프로젝트 특징

- **화이트 미니멀 디자인 시스템**: 여백과 간결한 타이포그래피, 아이보리/베이지 포인트 컬러를 적용하여 학술적이고 단정한 인상을 제공합니다.
- **사진 미사용 텍스트 중심**: 프로필 사진이나 아바타 대신 텍스트와 레이아웃을 중심으로 메시지를 전달합니다.
- **프레임워크 프리 (Vanilla JS)**: 별도의 빌드 단계나 무거운 의존성 없이 순수 HTML, CSS, JavaScript로 구현되어 브라우저에서 즉시 실행됩니다.
- **반응형 웹 디자인**: 데스크톱, 태블릿, 모바일 기기 전체에서 유연하게 동작합니다.
- **Firebase 및 로컬 하이브리드 지원**:
  - Firebase 설정 시: Cloud Firestore 및 Firebase Auth를 통한 클라우드 데이터 관리
  - Firebase 미설정 시: 브라우저 로컬 저장소(LocalStorage) 모드로 즉시 동작하여 로컬 환경에서도 CRUD 기능을 100% 테스트 가능
- **1인 전용 관리자 페이지 (`/admin.html`)**: 프로젝트 등록·수정·삭제 및 초안(Draft)/공개(Published) 상태 제어

---

## 2. 사이트 메뉴 구조

```text
├── index.html       # HOME (첫인사 및 개요)
├── about.html       # ABOUT (프로필, 성향 ISFP, 학습 태도)
├── projects.html    # PROJECTS (프로젝트 카드 그리드, 검색, 태그 필터)
├── project.html     # 프로젝트 독립 상세 페이지 (?id=...)
├── skills.html      # SKILLS (전공 데이터 분석 역량 및 기술 설명)
├── hobby.html       # HOBBY (드라마 감상 취미와 재충전)
└── admin.html       # ADMIN (관리자 전용 로그인 및 프로젝트 관리)
```

---

## 3. 시작하기 및 로컬 테스트

### 3.1 로컬 실행 방법
본 프로젝트는 정적 파일로 구성되어 있어 간단한 로컬 웹 서버(또는 Live Server)로 실행할 수 있습니다.

```bash
# Python 내장 서버로 실행할 경우 (선택)
python -m http.server 8000
```
브라우저에서 `http://localhost:8000`에 접속합니다.

### 3.2 관리자 페이지 접속 (`admin.html`)
- **로컬 모드 초기 비밀번호**: `ahyeon2026`
- 로그인 후 "새 프로젝트 등록" 또는 "샘플 프로젝트 추가" 버튼을 눌러 프로젝트를 추가하고, `PROJECTS` 메뉴에 실시간으로 반영되는 것을 확인할 수 있습니다.

---

## 4. 설정 변경 안내

### 4.1 실제 연락처 및 GitHub 주소 입력
`js/firebase-config.js` 상단의 `CONTACT_CONFIG` 객체에 실제 이메일과 GitHub 프로필 URL을 입력하세요. 입력하기 전까지는 빈 링크 대신 사용자 친화적인 안내 메시지가 표시됩니다.

```javascript
export const CONTACT_CONFIG = {
  name: "김아현",
  nameEn: "Kim Ahyeon",
  department: "데이터사이언스학부",
  grade: "2학년",
  email: "your_email@example.com", // 본인의 실제 이메일
  github: "https://github.com/your-username" // 본인의 GitHub 프로필
};
```

### 4.2 Firebase 클라우드 연동
1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트를 생성합니다.
2. Authentication (이메일/비밀번호 로그인)과 Cloud Firestore를 생성합니다.
3. 웹 앱을 등록한 후 발급된 키를 `js/firebase-config.js`의 `firebaseConfig` 객체에 입력합니다.

---

## 5. GitHub Pages 배포 방법

1. GitHub에 새 저장소를 생성합니다. (예: `kim-ahyeon-portfolio` 또는 `<사용자명>.github.io`)
2. 본 폴더의 파일들을 커밋 및 푸시합니다:
   ```bash
   git init
   git add .
   git commit -m "feat: 김아현 개인 포트폴리오 웹사이트 초기 구축"
   git remote add origin https://github.com/<사용자명>/<저장소명>.git
   git push -u origin main
   ```
3. GitHub 저장소의 **Settings > Pages**에서 `Deploy from a branch`를 선택하고 `main` 브랜치의 `/(root)`를 지정 후 저장합니다.

---

## 6. 라이선스 및 저작권
© 2026 Kim Ahyeon. All rights reserved.

