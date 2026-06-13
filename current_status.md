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

### Day 5 — 독서 이력 탭 (2026-06-13)
- **이력 탭 추가** (네 번째 탭): 날짜별 독서 시간 목록. "총 N일 · M분 독서" 요약 + 날짜·요일·분 카드, 최신순 정렬, 오늘 항목 강조
- **데이터**: `state.dailyMinutes` ({'YYYY-MM-DD': 분}) 신설 — 타이머 완료 시 누적. 기존 `readDates`(히트맵용)는 유지

### Day 6 — Supabase 클라우드 동기화(선택) (2026-06-13)
- **설정(⚙) 모달에 "클라우드 동기화" 토글 추가**: 기본은 꺼짐(localStorage만 사용). 켜면 익명 로그인 후 책장/한 줄/독서 로그/설정을 Supabase에도 저장
- **신규 파일**: `js/config.js`(SUPABASE_URL/ANON_KEY), `js/supabaseClient.js`(클라이언트 생성)
- **js/app.js**: `state.cloudSync` 필드 + `initCloudSync`/`pullFromCloud`/`pushLocalToCloud`/`enableCloudSync`/`disableCloudSync`/`syncSettingsToCloud`/`updateCloudSyncUI` 신설. `addBook`, 책 삭제, 한 줄 저장, 위시→읽음 이동, 타이머 완료, 설정 저장에 동기화 훅 연결(모두 `if (state.cloudSync)` 가드, 실패 시 console.warn만 — 오프라인에서도 기존처럼 동작)
- **service-worker.js**: `js/config.js`/`js/supabaseClient.js` 캐시 추가, `chaekjang-v1` → `chaekjang-v2`
- **README.md**: Supabase 프로젝트 생성 → 익명 로그인 활성화 → SQL(스키마+RLS) → config.js 키 입력 → 동작 확인까지 전체 가이드 갱신. SQL에 `default auth.uid()`(클라이언트에서 user_id 생략 가능), `quotes.book_id unique`(책당 한 줄 upsert) 추가

---

## [진행 중 작업]

없음 — v1 완료, 이력 탭 + Supabase 클라우드 동기화(선택) 추가 완료

---

## [다음 단계] — v2 후보 또는 필요 시 진행

1. **실제 Supabase 프로젝트로 동기화 테스트** — README "직접 확인하는 법"대로 사용자가 본인 프로젝트 키를 `js/config.js`에 넣고 검증
2. **한 줄 여러 개 저장** — 현재 책당 1개(`quotes.book_id unique`). v2에서 unique 제거 시 복수 저장 지원 가능
3. **PWA 아이콘 고도화** — 현재 SVG 단일. iOS 홈 화면용 PNG 192/512px 필요
4. v2 기능 (사용자 명시 요청 전 보류)
   - 연간 목표 게이지, 통계 대시보드, 별점·완독 리본, SNS 공유, 친구 비교

---

## [미결정 이슈]

- **익명 인증의 멀티기기 한계**: 현재는 기기별로 별도 계정(클라우드 백업 용도). 같은 데이터를 여러 기기에서 보려면 이메일 연결을 통한 계정 업그레이드가 필요 — v2 후보
- **카카오 키 보안**: 클라이언트 직접 호출 → Supabase Edge Function 프록시 경유 검토
- **iOS 리마인더**: iOS 16.4+ PWA 설치 환경에서만 동작. 일반 Safari 브라우저 미지원

---

## 메모

- 시그니처(책 꽂히는 드롭 애니메이션)는 앱 정체성이므로 유지.
- v2 기능은 사용자 명시 요청 전까지 손대지 않는다.
- 배포 URL: https://chaekjang-nine.vercel.app
- GitHub: https://github.com/TeddyChoi-wow/chaekjang
