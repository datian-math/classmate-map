-- Students table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  wechat VARCHAR(50),
  qq VARCHAR(20),
  university VARCHAR(100) NOT NULL,
  major VARCHAR(100),
  province VARCHAR(20) NOT NULL,
  city VARCHAR(50) NOT NULL,
  enroll_year INTEGER,
  class_num VARCHAR(20),
  message TEXT,
  avatar_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins table
CREATE TABLE admins (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY
);

-- Index for province-based queries
CREATE INDEX idx_students_province ON students(province);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_user_id ON students(user_id);

-- RLS policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved students
CREATE POLICY "Approved students are visible to everyone"
  ON students FOR SELECT
  USING (status = 'approved');

-- Users can read their own student record regardless of status
CREATE POLICY "Users can read own student record"
  ON students FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own student record
CREATE POLICY "Users can insert own student record"
  ON students FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own student record
CREATE POLICY "Users can update own student record"
  ON students FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can read all students
CREATE POLICY "Admins can read all students"
  ON students FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Admins can update any student
CREATE POLICY "Admins can update any student"
  ON students FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Admins can delete any student
CREATE POLICY "Admins can delete any student"
  ON students FOR DELETE
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Admins can read admins table
CREATE POLICY "Admins can read admins"
  ON admins FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Admins can insert admins
CREATE POLICY "Admins can insert admins"
  ON admins FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
