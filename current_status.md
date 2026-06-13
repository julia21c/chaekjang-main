# current_status.md — 오늘의 한 칸

> 표준 포맷: [완료된 작업] / [진행 중 작업] / [다음 단계] / [미결정 이슈]
> 작업 단위가 끝날 때마다 이 파일을 갱신한다.

---

## [완료된 작업] — v1 전체 완료

### 기반 작업
- **문서 4종** 작성: PRD.md, CLAUDE.md, README.md, current_status.md
- **로컬 프로토타입 (reading.html)** — 단일 HTML 백업본 유지

### Day 1 — 파일 분리 + 영속성
- `index.html` / `css/style.css` / `js/app.js` 3파일 구조로 분리
- **localStorage 영속성**: 새로고침해도 책·스트릭·설정 유지. 날짜 바뀌면 오늘 독서 분 자동 초기화
- **타이머 일시정지/계속**: 대기 → 진행 → 일시정지 3단계. 시간 보존, 그만두기는 일시정지 후에만 노출
- **타이머 분 설정 모달**: `prompt()` 제거 → 5/10/20/30분 프리셋 + 직접 입력
- **설정 모달 (⚙)**: 카카오 REST API 키 입력 → localStorage 저장

### Day 3 — 습관 장치
- **독서 잔디 히트맵**: 올해 1월~오늘, 주 단위 격자, 현재 주로 자동 스크롤
- **5분 비상 모드**: "⚡ 딱 5분만" 버튼. 완료 후 원래 분으로 자동 복구
- **저녁 리마인더**: 설정 모달에서 시각 지정 + 알림 권한 요청. 1분마다 체크, 이미 읽은 날 건너뜀
- **PWA**: manifest.json + service-worker.js (오프라인 캐시) + icons/icon.svg

### Day 4 — 마무리
- **한 줄 모아보기** (필사 노트 뷰): 세 번째 탭 "한 줄". 인용구 카드 + 책 정보. staggered 페이드인
- **마이크로 인터랙션**: 타이머 완료 시 링 골드 글로우, 스트릭 불꽃 펄스, 탭 전환 페이드
- **Vercel 배포**: https://chaekjang-nine.vercel.app
- **vercel.json**: service-worker 캐시 헤더 + 보안 헤더(X-Frame-Options 등)

---

## [진행 중 작업]

없음 — v1 완료

---

## [다음 단계] — v2 후보 또는 필요 시 진행

1. **Supabase 연동** — Auth + 4개 테이블(books/quotes/reading_logs/settings) + RLS
   - 현재 localStorage 기반. 실사용·멀티기기 대응에 필요
2. **한 줄 여러 개 저장** — 현재 책당 1개. quotes 테이블 연동 시 복수 저장 지원
3. **PWA 아이콘 고도화** — 현재 SVG 단일. iOS 홈 화면용 PNG 192/512px 필요
4. v2 기능 (사용자 명시 요청 전 보류)
   - 연간 목표 게이지, 통계 대시보드, 별점·완독 리본, SNS 공유, 친구 비교

---

## [미결정 이슈]

- **데이터 마이그레이션**: localStorage 데이터 → Supabase 전환 시 기존 데이터 처리 방법
- **카카오 키 보안**: 클라이언트 직접 호출 → Supabase Edge Function 프록시 경유 검토
- **iOS 리마인더**: iOS 16.4+ PWA 설치 환경에서만 동작. 일반 Safari 브라우저 미지원

---

## 메모

- 시그니처(책 꽂히는 드롭 애니메이션)는 앱 정체성이므로 유지.
- v2 기능은 사용자 명시 요청 전까지 손대지 않는다.
- 배포 URL: https://chaekjang-nine.vercel.app
- GitHub: https://github.com/TeddyChoi-wow/chaekjang
