/* ============================================================
   오늘의 한 칸 — Supabase 프로젝트 설정
   ============================================================
   1. supabase.com → 프로젝트 → Settings → API 에서
      "Project URL"과 "anon public" 키를 복사해 아래에 붙여넣으세요.
   2. anon key는 RLS(행 수준 보안)로 보호되어 클라이언트 코드에
      그대로 노출되어도 안전합니다 — Supabase 공식 가이드도
      이 방식을 전제로 합니다(카카오 REST 키 같은 진짜 비밀값이 아님).
   3. README.md "Supabase 연동" 섹션의 설정 순서를 함께 확인하세요.
   ============================================================ */

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
