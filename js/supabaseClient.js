/* ============================================================
   오늘의 한 칸 — Supabase 클라이언트 초기화
   config.js의 URL/anon key로 클라이언트를 생성한다.
   ============================================================ */
const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
