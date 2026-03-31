# GADA Direct — 소개 및 개발 문서

> **배포 URL**: https://direct.1gada.com
> **GitHub**: https://github.com/wondalcity/gada-direct
> **호스팅**: GitHub Pages (main 브랜치 자동 배포)

---

## 개요

GADA(가다) 제품 소개 및 도입 문의를 위한 정적 랜딩 사이트입니다.
두 가지 제품 — **가다 오피스**(건설 노무 자동화)와 **가다 직접지급**(임금 직접지급 솔루션) — 을 소개하고, 잠재 고객의 도입 문의와 미팅 예약을 처리합니다.

---

## 페이지 구성

| 파일 | URL | 설명 |
|------|-----|------|
| `index.html` | `/` | 메인 랜딩 페이지 — 두 제품 통합 소개 |
| `pension.html` | `/pension.html` | 가다 오피스 — 4대보험·9종 문서 자동화 |
| `direct-pay.html` | `/direct-pay.html` | 가다 직접지급 — 건설기준법 제43조 대응 |
| `admin.html` | `/admin.html` | 내부 관리자 페이지 (robots.txt로 색인 제외) |

---

## 디렉토리 구조

```
finpay-guide/
├── index.html           # 메인 랜딩
├── pension.html         # 가다 오피스 소개
├── direct-pay.html      # 가다 직접지급 소개
├── admin.html           # 어드민 (비공개)
│
├── inquiry.js           # 도입 문의 모달 + 미팅 예약 공통 스크립트
├── booking.gs           # [Apps Script] 캘린더 예약 백엔드
├── apps-script.gs       # [Apps Script] 리드 저장 백엔드 (구버전 참고용)
│
├── favicon.png          # 파비콘 (GADA 노란 로고)
├── favicon.svg          # 파비콘 SVG
├── gada-logo.png        # GNB 로고
├── home-hero-tablet.jpg # 메인 히어로 배경 이미지
├── og_image.png         # Open Graph 공유 이미지 (1200×630)
├── law-doc-2.png        # 법령 문서 이미지 (direct-pay.html)
├── process-diagram.png  # 직접지급 프로세스 다이어그램
│
├── sitemap.xml          # 검색엔진 사이트맵
├── robots.txt           # 크롤링 설정 (admin.html 제외)
├── CNAME                # GitHub Pages 커스텀 도메인 설정
└── supabase-setup.sql   # Supabase 초기 테이블 스키마 (참고용)
```

---

## 기술 스택

- **프론트엔드**: 순수 HTML · CSS · Vanilla JS (프레임워크 없음)
- **폰트**: Pretendard (CDN)
- **백엔드**: Google Apps Script (웹 앱 배포)
- **캘린더/이메일**: Google Calendar API, Gmail (Apps Script 경유)
- **스프레드시트**: Google Sheets (예약 및 리드 데이터 적재)
- **호스팅**: GitHub Pages
- **도메인**: `direct.1gada.com` (DNS CNAME → `wondalcity.github.io`)
- **분석**: Google Analytics 4 (`G-6SEH7PEC3H`)

---

## 도입 문의 플로우 (`inquiry.js`)

```
사용자 클릭 "도입 문의"
  └─ 1단계: 건설사 유형 / 회사명 / 담당자 / 연락처 / 이메일 / 현장 규모 / 요구사항 입력
  └─ 2단계: 미팅 날짜 선택 (평일만, 오늘로부터 30일 이내)
  └─ 3단계: 시간 슬롯 선택 (10:00 / 13:00 / 16:00 고정)
  └─ 4단계: 예약 확인 → Apps Script POST 전송

[Apps Script - booking.gs]
  ├─ Google Calendar에 이벤트 생성 (worksmate2020@gmail.com)
  ├─ Google Meet 링크 자동 생성
  ├─ 신청자에게 확인 이메일 발송 (이메일 입력 시)
  └─ Google Sheets에 예약 정보 적재
```

### 주요 상수 (`inquiry.js`)

| 변수 | 값 | 설명 |
|------|-----|------|
| `BOOKING_URL` | Apps Script 웹 앱 URL | 예약 처리 엔드포인트 |
| `SUPABASE_URL` | Supabase 프로젝트 URL | (현재 미사용, 레거시) |

---

## Google Apps Script 설정 (`booking.gs`)

### 주요 변수

| 변수 | 현재 값 | 설명 |
|------|---------|------|
| `CAL_ID` | `worksmate2020@gmail.com` | 캘린더 소유자 계정 |
| `ADMIN_PW` | `admin1234` | 어드민 API 비밀번호 |
| `SS_ID` | `1Mv1i-rpEk1eYZDFm...` | 예약/리드 데이터 스프레드시트 ID |

### 배포 방법

1. [Google Apps Script](https://script.google.com) 접속 (worksmate2020@gmail.com 계정)
2. 새 프로젝트 생성 → `booking.gs` 전체 내용 붙여넣기
3. **배포** → **새 배포** → 유형: **웹 앱**
4. 실행 계정: **나 (본인)** / 액세스: **모든 사용자**
5. 배포 후 생성된 URL을 `inquiry.js`의 `BOOKING_URL`에 업데이트

### API 엔드포인트

| Method | Action | 설명 |
|--------|--------|------|
| GET | `?action=slots&date=YYYY-MM-DD` | 가용 슬롯 조회 |
| GET | `?action=bookings&pw=...` | 예약 목록 조회 (어드민) |
| GET | `?action=config&pw=...` | 설정 조회 (어드민) |
| GET | `?action=blocked&pw=...` | 차단 날짜 조회 (어드민) |
| POST | `{ action: "book", ... }` | 예약 생성 |
| POST | `{ action: "saveLead", ... }` | 리드 저장 |
| POST | `{ action: "updateConfig", pw, config }` | 설정 변경 (어드민) |
| POST | `{ action: "blockDate", pw, date, block }` | 날짜 차단/해제 (어드민) |

### 스프레드시트 구조

**`예약` 시트**: 날짜 · 시간 · 건설사 · 담당자 · 연락처 · 이메일 · 메모 · 이벤트ID · 미팅링크 · 등록일시

**`리드` 시트**: 접수일시 · 건설사유형 · 건설사명 · 담당자 · 연락처 · 이메일 · 현장규모 · 요구사항 · 유입경로

---

## 도메인 설정

### DNS 설정 (1gada.com 네임서버)

```
CNAME  direct  wondalcity.github.io
```

### GitHub Pages 설정

- 레포지토리: `wondalcity/gada-direct`
- 브랜치: `main` (루트 `/`)
- `CNAME` 파일 내용: `direct.1gada.com`
- HTTPS: GitHub Pages 자동 제공

---

## SEO 설정

- **메타 태그**: title · description · keywords · canonical
- **Open Graph**: og:title · og:description · og:image (`og_image.png`, 1200×630)
- **Twitter Card**: summary_large_image
- **JSON-LD**: Organization, WebPage, SoftwareApplication, FAQPage (페이지별)
- **Google Search Console**: `MgM3U3To5m07HY6_7DktuOybd2SU25fFAUUS8_m4gYk`
- **사이트맵**: `https://direct.1gada.com/sitemap.xml`

---

## 로컬 개발

별도 빌드 도구 없이 HTML 파일을 직접 브라우저에서 열거나, 간단한 로컬 서버를 사용합니다.

```bash
# Python 내장 서버 사용
python3 -m http.server 8080
# → http://localhost:8080
```

---

## 배포

`main` 브랜치에 푸시하면 GitHub Pages가 자동으로 배포합니다.

```bash
git add .
git commit -m "변경 내용 설명"
git push origin main
# → https://direct.1gada.com 에 약 1~2분 후 반영
```

---

## 연락처

- **회사**: 주식회사 웍스메이트 (WORKSMATE Inc.)
- **대표전화**: 1661-0109
- **이메일**: sales@worksmate.co.kr
