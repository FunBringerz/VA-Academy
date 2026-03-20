-- Core Tables
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  name VARCHAR(255) NOT NULL, 
  start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE generation_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE, 
  code VARCHAR(50) UNIQUE NOT NULL, 
  is_used BOOLEAN DEFAULT FALSE, 
  used_by UUID, -- Will be linked to profiles(id) after profiles is created
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, 
  role VARCHAR(20) DEFAULT 'trainee', 
  batch_id UUID REFERENCES batches(id), 
  generation_code_id UUID REFERENCES generation_codes(id), 
  username VARCHAR(100) UNIQUE, 
  full_name VARCHAR(255), 
  age INT, 
  birthday DATE, 
  address TEXT, 
  contact_number VARCHAR(50), 
  email_address VARCHAR(255), 
  password_hash VARCHAR(255), 
  academic_background JSONB, 
  work_background JSONB, 
  amazon_va_experience JSONB, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the missing foreign key to generation_codes now that profiles exists
ALTER TABLE generation_codes ADD CONSTRAINT fk_generation_codes_used_by FOREIGN KEY (used_by) REFERENCES profiles(id);

CREATE TABLE sourcing_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  user_id UUID REFERENCES profiles(id), 
  batch_id UUID REFERENCES batches(id), 
  date_entered TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
  product_name TEXT NOT NULL, 
  product_category VARCHAR(255), 
  amazon_asin VARCHAR(50) NOT NULL, 
  amazon_url TEXT, 
  supplier_url TEXT, 
  screenshot_url TEXT, 
  promo_code VARCHAR(100), 
  roi DECIMAL, 
  profit DECIMAL, 
  bsr INT, 
  cost_price DECIMAL, 
  sale_price DECIMAL, 
  sales_per_month INT, 
  trainee_comment TEXT, 
  lead_remark VARCHAR(50) DEFAULT 'Pending', 
  admin_comment TEXT, 
  bought BOOLEAN DEFAULT FALSE, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quiz_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  trainee_id UUID REFERENCES profiles(id), 
  day_number INT, 
  videos_completed BOOLEAN DEFAULT FALSE, 
  time_spent_seconds INT DEFAULT 0, 
  quiz_score INT, 
  total_items INT DEFAULT 20, 
  is_general_test BOOLEAN DEFAULT FALSE, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  batch_id UUID REFERENCES batches(id), 
  subject VARCHAR(255) NOT NULL, 
  meeting_time TIMESTAMP WITH TIME ZONE, 
  meeting_link TEXT NOT NULL, 
  meeting_type VARCHAR(20) DEFAULT 'group', 
  created_by UUID REFERENCES profiles(id), 
  is_all BOOLEAN DEFAULT TRUE, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE meeting_participants (
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE, 
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, 
  PRIMARY KEY (meeting_id, user_id)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  sender_id UUID REFERENCES profiles(id), 
  receiver_id UUID REFERENCES profiles(id), 
  batch_id UUID REFERENCES batches(id),
  channel VARCHAR(50) DEFAULT 'general',
  message TEXT NOT NULL, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES batches(id),
  title VARCHAR(255) NOT NULL,
  details TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  gdocs_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE task_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  trainee_id UUID REFERENCES profiles(id),
  gdocs_link TEXT NOT NULL,
  admin_comment TEXT,
  grade INT, -- 0-100
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  reporter_id UUID REFERENCES profiles(id), 
  reported_id UUID REFERENCES profiles(id), 
  message_id UUID REFERENCES chat_messages(id), 
  reason VARCHAR(255), 
  status VARCHAR(20) DEFAULT 'pending', 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE daily_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  day_number INT UNIQUE, 
  video_url TEXT, 
  video_title TEXT, 
  video_description TEXT, 
  quiz_questions JSONB, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_number INT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_important BOOLEAN DEFAULT FALSE,
  sequence_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security (RLS) to allow server-side management as requested
ALTER TABLE batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE sourcing_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_content DISABLE ROW LEVEL SECURITY;

CREATE TABLE batch_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  scheduled_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(batch_id, day_number)
);

-- Seed Data (Optional, for reference)
-- Note: auth.users entries must be created via Supabase Auth API or Dashboard
-- INSERT INTO batches (name) VALUES ('Batch 1');
-- INSERT INTO generation_codes (batch_id, code) VALUES ((SELECT id FROM batches LIMIT 1), 'JM-SEED-CODE');
