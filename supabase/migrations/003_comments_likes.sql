-- Comments and likes for posts
CREATE TABLE post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES student_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_name VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES student_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are visible to everyone"
  ON post_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment"
  ON post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Likes are visible to everyone"
  ON post_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like"
  ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
  ON post_likes FOR DELETE USING (auth.uid() = user_id);
