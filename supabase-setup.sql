-- ================================================
-- GADA 도입문의 리드 테이블
-- Supabase SQL Editor에서 실행하세요
-- ================================================

CREATE TABLE IF NOT EXISTS leads (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  company_type  TEXT,
  company_name  TEXT        NOT NULL,
  contact_name  TEXT        NOT NULL,
  contact_phone TEXT        NOT NULL,
  contact_email TEXT,
  requirements  TEXT,
  source        TEXT,         -- 유입 페이지 (index / pension / direct-pay)
  status        TEXT        DEFAULT 'new'  -- new / contacted / qualified / closed
);

-- RLS 활성화
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 익명 사용자 INSERT 허용 (폼 제출용)
CREATE POLICY "anon_insert" ON leads
  FOR INSERT TO anon
  WITH CHECK (true);

-- 인증된 사용자만 SELECT 허용 (어드민용)
CREATE POLICY "auth_select" ON leads
  FOR SELECT TO authenticated
  USING (true);

-- 인증된 사용자만 UPDATE 허용
CREATE POLICY "auth_update" ON leads
  FOR UPDATE TO authenticated
  USING (true);
