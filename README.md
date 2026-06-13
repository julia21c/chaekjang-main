# 오늘의 한 칸 📖

> 숏츠 1시간 대신 하루 20분. 독서를 다시 펼치게 만들고, 그 보상으로 나만의 책장이 채워지는 앱.

---

## 무엇인가

- **앱을 열면 책장이 아니라 20분 타이머가 먼저.** 시작 버튼 하나.
- 20분을 끝내면 → 오늘 읽은 책에 한 줄을 남기고 → 책이 책장에 꽂힌다.
- 올해 읽은 책 · 책 속 한 줄 · 읽고 싶은 책을 표지와 함께 책장처럼 관리.
- 연속 기록(🔥)과 독서 잔디로 "안 끊기게" 잡아준다.

---

## 빠른 시작 (로컬 프로토타입)

별도 설치 없이 `reading.html` 파일을 브라우저에서 열면 바로 작동한다.

```
reading.html 더블클릭 → 끝
```

> 단, 이 로컬 버전은 데이터가 메모리에만 저장되어 새로고침 시 초기화된다.
> 매일 쓰려면 아래 Supabase 연동이 필요하다.

---

## 표지 검색 설정

- 기본은 **구글북스 API**로 동작한다 (키 불필요).
- 한국 책 표지 정확도를 높이려면 **카카오 책 검색 API** 키를 넣는다.

1. [카카오 디벨로퍼스](https://developers.kakao.com)에서 앱 생성 → REST API 키 발급
2. 코드의 `KAKAO_KEY = ""` 에 키 입력 (실전에선 환경변수로 관리)

> 교육 팁: 키 한 줄로 표지 품질이 확 바뀌는 걸 시연하면
> "API 키의 가치"를 직관적으로 전달할 수 있다.

---

## Supabase 연동 (실전 전환)

### 1. 프로젝트 생성
[supabase.com](https://supabase.com) → New Project → URL과 anon key 확보.

### 2. 테이블 스키마 (SQL Editor에 붙여넣기)

```sql
-- 책 (읽은 책 + 위시리스트 공용)
create table books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  author text,
  cover_url text,
  shelf text not null default 'read',  -- 'read' | 'wish'
  year int,
  rating int,                          -- v2용
  created_at timestamptz default now()
);

-- 책 속 한 줄
create table quotes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books on delete cascade,
  user_id uuid references auth.users not null,
  text text not null,
  created_at timestamptz default now()
);

-- 독서 로그 (잔디·스트릭 원천)
create table reading_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  minutes int not null default 20,
  created_at timestamptz default now()
);

-- 설정
create table settings (
  user_id uuid primary key references auth.users,
  timer_minutes int default 20,
  reminder_time time,
  kakao_key text
);
```

### 3. RLS (행 수준 보안) — 필수

```sql
-- 각 테이블에 RLS 활성화 후, 본인 데이터만 접근하도록
alter table books enable row level security;
alter table quotes enable row level security;
alter table reading_logs enable row level security;
alter table settings enable row level security;

create policy "own books" on books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quotes" on quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own logs" on reading_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own settings" on settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### 4. 코드 연결
로컬 버전의 `state` 메모리 저장 부분을 Supabase 호출로 교체한다.
- `addBook()` → `supabase.from('books').insert(...)`
- `state.books` 읽기 → `supabase.from('books').select(...)`
- 타이머 완료 → `reading_logs`에 insert

> 이 "로컬 → 클라우드 전환"이 바이브코딩 교육의 클라이맥스다.

---

## 배포 (Vercel)

```
1. GitHub에 푸시
2. Vercel → Import → 환경변수(SUPABASE_URL, SUPABASE_ANON_KEY, KAKAO_KEY) 입력
3. Deploy
```

---

## 프로젝트 문서

| 문서 | 내용 |
|------|------|
| `PRD.md` | 제품 요구사항 · 기능 명세 · v1/v2 구분 근거 |
| `CLAUDE.md` | Claude Code 개발 지침 · 코딩 규칙 |
| `README.md` | 이 문서 — 설치 · 설정 · 스키마 |
| `current_status.md` | 진행 상태 추적 |

---

## 기능 한눈에

| 기능 | v1 | v2 |
|------|:--:|:--:|
| 20분 타이머 / 5분 비상 모드 | ✅ | |
| 책장 (읽은 책) | ✅ | |
| 책 속 한 줄 / 한 줄 모아보기 | ✅ | |
| 읽고 싶은 책 | ✅ | |
| 표지 자동 검색 | ✅ | |
| 연속 기록 · 독서 잔디 | ✅ | |
| 저녁 리마인더 · PWA | ✅ | |
| 연간 목표 · 통계 대시보드 | | ✅ |
| 별점 · SNS 공유 · 친구 비교 | | ✅ |

---

WOWD.LAB · 디자인씽킹 × AI로 일하는 방식을 바꾸는 교육
