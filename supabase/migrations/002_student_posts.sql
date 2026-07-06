-- Student messages/guestbook table
CREATE TABLE student_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_name VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_student_posts_student_id ON student_posts(student_id);
CREATE INDEX idx_student_posts_created_at ON student_posts(student_id, created_at DESC);

-- RLS policies
ALTER TABLE student_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts
CREATE POLICY "Posts are visible to everyone"
  ON student_posts FOR SELECT
  USING (true);

-- Logged-in users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON student_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON student_posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Users can delete their own posts, page owner can also delete
CREATE POLICY "Users can delete own posts or posts on their page"
  ON student_posts FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM students WHERE id = student_posts.student_id AND user_id = auth.uid())
  );

-- Storage bucket for post photos
INSERT INTO storage.buckets (id, name, public) VALUES ('post-photos', 'post-photos', true);

-- Storage policies: anyone can view, authenticated users can upload
CREATE POLICY "Photos are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-photos');

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
