-- ============================================
-- 「等你」数据库完整 Schema v4.5
-- 14张核心表 · MVP版本
-- 更新：新增 user_daily_stats（用户时间系统）
-- ============================================

-- 1. users 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  birth_year INTEGER NOT NULL CHECK (birth_year BETWEEN 1900 AND 2010),
  gender_description VARCHAR(100),
  city VARCHAR(50),
  province VARCHAR(50),
  growth_minutes INTEGER DEFAULT 0,
  garden_stage INTEGER DEFAULT 0,
  cooling_completed BOOLEAN DEFAULT FALSE,
  cooling_completed_at TIMESTAMPTZ,
  phone_verified BOOLEAN DEFAULT FALSE,
  real_name_verified BOOLEAN DEFAULT FALSE,
  agreement_signed BOOLEAN DEFAULT FALSE,
  agreement_signed_at TIMESTAMPTZ,
  invite_code VARCHAR(20),
  photo_url TEXT,
  photo_real_promise BOOLEAN DEFAULT FALSE,
  badges JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

CREATE FUNCTION get_match_profile(match_user_id UUID)
RETURNS TABLE(id UUID, birth_year INTEGER, city VARCHAR(50), garden_stage INTEGER, badges JSONB)
SECURITY DEFINER
AS $$
  SELECT u.id, u.birth_year, u.city, u.garden_stage, u.badges
  FROM users u WHERE u.id = match_user_id AND u.deleted_at IS NULL;
$$ LANGUAGE sql;

-- 2. open_questions 开放式问题表
CREATE TABLE open_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('required', 'optional')),
  sort_order INTEGER
);

INSERT INTO open_questions (question_text, question_type, sort_order) VALUES
  ('你人生中最重要的一个转折点是什么？', 'required', 1),
  ('你觉得什么样的人会让你感到安全？', 'required', 2),
  ('你正在学习放下的一件事情是什么？', 'required', 3),
  ('如果有一个完全自由的周末，你会怎么度过？', 'optional', 4),
  ('有没有一本书/一部电影改变了你对爱情的理解？', 'optional', 5),
  ('你最想让未来的伴侣知道的关于你的一件事是什么？', 'optional', 6);

-- 3. user_answers 用户答题表
CREATE TABLE user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES open_questions(id),
  answer_text TEXT NOT NULL,
  feedback_template_key VARCHAR(50),
  growth_minutes_earned INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "answers_read_own" ON user_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "answers_insert_own" ON user_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. personality_tests 人格测评表
CREATE TABLE personality_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('big_five', 'ecrr', 'raven')),
  answers_json JSONB NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  openness INTEGER CHECK (openness BETWEEN 0 AND 100),
  conscientiousness INTEGER CHECK (conscientiousness BETWEEN 0 AND 100),
  extraversion INTEGER CHECK (extraversion BETWEEN 0 AND 100),
  agreeableness INTEGER CHECK (agreeableness BETWEEN 0 AND 100),
  neuroticism INTEGER CHECK (neuroticism BETWEEN 0 AND 100),
  attachment_style VARCHAR(20) CHECK (attachment_style IN ('secure', 'anxious', 'avoidant', 'fearful')),
  raven_score INTEGER,
  result_narrative TEXT,
  result_tags JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE personality_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tests_read_own" ON personality_tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tests_insert_own" ON personality_tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tests_update_own" ON personality_tests FOR UPDATE USING (auth.uid() = user_id);

-- 5. weekly_matches 每周匹配表
CREATE TABLE weekly_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  matched_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_week DATE NOT NULL,
  match_score DECIMAL(5,2),
  matched_by VARCHAR(20) DEFAULT 'manual',
  curator_note TEXT,
  icebreaker_question TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  decided_at TIMESTAMPTZ,
  mutual_confirmed BOOLEAN DEFAULT FALSE,
  mutual_confirmed_at TIMESTAMPTZ,
  chat_open BOOLEAN DEFAULT FALSE,
  chat_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_weekly_match UNIQUE(user_id, match_week)
);

ALTER TABLE weekly_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_read_own" ON weekly_matches FOR SELECT USING (auth.uid() = user_id);

-- 6. messages 聊天消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES weekly_matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  nvc_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_read_own" ON messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM weekly_matches wm WHERE wm.id = messages.match_id
  AND (wm.user_id = auth.uid() OR wm.matched_user_id = auth.uid())
));
CREATE POLICY "messages_insert_own" ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM weekly_matches wm WHERE wm.id = messages.match_id
    AND wm.chat_open = TRUE AND wm.chat_expires_at > NOW()
    AND (wm.user_id = auth.uid() OR wm.matched_user_id = auth.uid())
  )
);

-- 7. story_canvas 故事画布表
CREATE TABLE story_canvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES weekly_matches(id) ON DELETE CASCADE,
  entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('tag', 'sentence', 'emoji', 'milestone')),
  content TEXT NOT NULL,
  added_by UUID REFERENCES users(id),
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE story_canvas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "canvas_read_own" ON story_canvas FOR SELECT
USING (EXISTS (
  SELECT 1 FROM weekly_matches wm WHERE wm.id = story_canvas.match_id
  AND (wm.user_id = auth.uid() OR wm.matched_user_id = auth.uid())
));
CREATE POLICY "canvas_insert_own" ON story_canvas FOR INSERT
WITH CHECK (
  added_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM weekly_matches wm WHERE wm.id = story_canvas.match_id
    AND (wm.user_id = auth.uid() OR wm.matched_user_id = auth.uid())
  )
);

-- 8. daily_stories 每日故事页
CREATE TABLE daily_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES weekly_matches(id) ON DELETE CASCADE,
  story_date DATE NOT NULL,
  highlight_entry_id UUID REFERENCES story_canvas(id),
  highlight_sentence TEXT,
  version_for_a TEXT,
  version_for_b TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_daily_match_date UNIQUE(match_id, story_date)
);

ALTER TABLE daily_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stories_read_own" ON daily_stories FOR SELECT
USING (EXISTS (
  SELECT 1 FROM weekly_matches wm WHERE wm.id = daily_stories.match_id
  AND (wm.user_id = auth.uid() OR wm.matched_user_id = auth.uid())
));

-- 9. profile_views 资料浏览记录
-- 张璐建议：砍掉实时通知，仅用于匹配成功后的告知
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID REFERENCES users(id),
  viewed_user_id UUID REFERENCES users(id),
  match_id UUID REFERENCES weekly_matches(id),
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "views_insert_own" ON profile_views FOR INSERT WITH CHECK (viewer_id = auth.uid());
-- 用户不可查询谁看了自己（隐私）

-- 10. user_activity_log 用户活跃日志
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN (
    'read_question', 'submit_answer',
    'start_test', 'answer_test_question', 'complete_test',
    'upload_photo', 'view_match_card', 'send_message',
    'add_canvas_entry', 'view_story',
    'scroll_content', 'heartbeat'
  )),
  metadata JSONB DEFAULT '{}'::JSONB,
  growth_seconds_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_read_own" ON user_activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_insert_own" ON user_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. user_daily_stats 用户每日活跃汇总（用户时间系统）
CREATE TABLE user_daily_stats (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  active_date DATE NOT NULL,
  active_seconds INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  last_heartbeat_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, active_date)
);

ALTER TABLE user_daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats_read_own" ON user_daily_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stats_insert_own" ON user_daily_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stats_update_own" ON user_daily_stats FOR UPDATE USING (auth.uid() = user_id);

-- 12. feedback_templates 反馈模板表（替代OpenAI）
CREATE TABLE feedback_templates (
  id SERIAL PRIMARY KEY,
  trigger_keywords JSONB NOT NULL,
  template_text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO feedback_templates (trigger_keywords, template_text, sort_order) VALUES
  ('["离开", "告别", "失去", "放下"]', '你提到了"离开"。有时候，离开一个地方，其实是走向一个自己。', 1),
  ('["改变", "转折", "决定"]', '那个转折点——你回头看的时候，它是什么颜色的？', 2),
  ('["家庭", "父母", "妈妈", "爸爸"]', '家庭是我们最早学会爱的地方。你在那里学到了什么？', 3),
  ('["梦想", "想", "希望", "未来"]', '你的梦想里，住着一个什么样的自己？', 4),
  ('["害怕", "恐惧", "担心", "不敢"]', '恐惧常常指向我们真正在意的东西。', 5),
  ('["坚持", "熬", "扛", "忍"]', '坚持了很久——这个过程中你照顾过自己吗？', 6),
  ('["原谅", "和解", "放下"]', '和解不是忘记，是允许自己不再痛。', 7),
  ('["遗憾", "后悔", "如果"]', '遗憾里藏着我们最深的在乎。', 8),
  ('["孤单", "一个人", "孤独"]', '孤单和孤独不一样。你知道自己现在在感受哪一种吗？', 9),
  ('["安全", "信任", "安心"]', '安全感——你在什么时候最能感觉到它？', 10),
  ('["书", "电影", "故事"]', '一个故事改变你对爱情的理解——那是故事的力量。也是你的力量。', 11),
  ('["伴侣", "对象", "在一起"]', '你在寻找的，可能不只是一个人，而是一种被理解的方式。', 12),
  ('["自己", "我", "了解"]', '了解自己是一生的功课。你刚才写下的，是其中很美的一页。', 13),
  ('["时间", "等待", "慢慢"]', '等待不是什么都不做。等待是在土壤里生长。', 14),
  ('["自由", "周末", "旅行"]', '自由——你描述的那个周末里，藏着你对生活的向往。', 15),
  ('["真实", "真诚", "诚实"]', '真实需要勇气。你在这里选择真实，这座花园也因此更好。', 16),
  ('["照顾", "关心", "温暖"]', '你提到了照顾。会照顾人的人，往往也需要被照顾。', 17),
  ('["责任", "义务", "应该"]', '"应该"和"想要"之间，你更常听从哪一个？', 18),
  ('["成长", "学习", "变"]', '成长有时候不是变成另一个人，而是更像自己。', 19),
  ('["爱", "喜欢", "心动"]', '爱——你写下这个字的时候，心里浮现的是什么画面？', 20);

-- 13. invite_codes 邀请码表
CREATE TABLE invite_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO invite_codes (code, max_uses) VALUES
  ('GARDEN-001', 10),
  ('GARDEN-002', 10),
  ('GARDEN-003', 10),
  ('FOUNDER-001', 50);

-- 14. admin_logs 管理员操作日志
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(30) NOT NULL,
  performed_by VARCHAR(50) DEFAULT 'founder',
  target_user_id UUID REFERENCES users(id),
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_cooling ON users(cooling_completed, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_answers_user ON user_answers(user_id);
CREATE INDEX idx_personality_tests_user ON personality_tests(user_id);
CREATE INDEX idx_weekly_matches_user_week ON weekly_matches(user_id, match_week);
CREATE INDEX idx_weekly_matches_status ON weekly_matches(status, mutual_confirmed);
CREATE INDEX idx_messages_match ON messages(match_id, created_at);
CREATE INDEX idx_story_canvas_match ON story_canvas(match_id, version);
CREATE INDEX idx_daily_stories_match ON daily_stories(match_id, story_date);
CREATE INDEX idx_activity_log_user ON user_activity_log(user_id, created_at);
CREATE INDEX idx_daily_stats_user ON user_daily_stats(user_id, active_date);
CREATE INDEX idx_invite_codes_code ON invite_codes(code) WHERE is_active = TRUE;
CREATE INDEX idx_profile_views_match ON profile_views(match_id);

-- ============================================
-- 14张核心表 · 完
-- ============================================
