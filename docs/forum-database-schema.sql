-- =====================================================
-- EV Community Forum Database Schema (Simplified)
-- =====================================================
-- This schema is designed for simplicity, performance, and maintainability
-- Features: Categories, Threads, Replies (max 2-level nesting), Images
-- Security: Row Level Security (RLS) enabled on all tables

-- =====================================================
-- 1. FORUM CATEGORIES
-- =====================================================
CREATE TABLE forum_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- Emoji or icon identifier
    color VARCHAR(7), -- Hex color code
    slug VARCHAR(100) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. FORUM THREADS
-- =====================================================
CREATE TABLE forum_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(250) NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMPTZ,
    last_reply_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique slug per category
    UNIQUE(category_id, slug)
);

-- =====================================================
-- 3. FORUM REPLIES
-- =====================================================
CREATE TABLE forum_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    nesting_level INTEGER DEFAULT 0 CHECK (nesting_level <= 1), -- Max 2 levels (0 and 1)
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. FORUM IMAGES
-- =====================================================
CREATE TABLE forum_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure image belongs to either thread or reply, not both
    CHECK (
        (thread_id IS NOT NULL AND reply_id IS NULL) OR 
        (thread_id IS NULL AND reply_id IS NOT NULL)
    )
);

-- =====================================================
-- 5. USER PROFILES (Extended for Forum)
-- =====================================================
-- Add forum-specific fields to existing user profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS forum_role VARCHAR(20) DEFAULT 'user' CHECK (forum_role IN ('user', 'moderator', 'admin'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS forum_post_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS forum_reputation INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS forum_joined_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Categories
CREATE INDEX idx_forum_categories_active ON forum_categories(is_active, sort_order);
CREATE INDEX idx_forum_categories_slug ON forum_categories(slug);

-- Threads
CREATE INDEX idx_forum_threads_category ON forum_threads(category_id, created_at DESC);
CREATE INDEX idx_forum_threads_author ON forum_threads(author_id, created_at DESC);
CREATE INDEX idx_forum_threads_active ON forum_threads(is_deleted, is_pinned, last_reply_at DESC);
CREATE INDEX idx_forum_threads_slug ON forum_threads(category_id, slug);

-- Replies
CREATE INDEX idx_forum_replies_thread ON forum_replies(thread_id, created_at ASC);
CREATE INDEX idx_forum_replies_author ON forum_replies(author_id, created_at DESC);
CREATE INDEX idx_forum_replies_parent ON forum_replies(parent_id, created_at ASC);
CREATE INDEX idx_forum_replies_nesting ON forum_replies(thread_id, nesting_level, created_at ASC);

-- Images
CREATE INDEX idx_forum_images_thread ON forum_images(thread_id);
CREATE INDEX idx_forum_images_reply ON forum_images(reply_id);
CREATE INDEX idx_forum_images_author ON forum_images(author_id);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forum_categories_updated_at BEFORE UPDATE ON forum_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_threads_updated_at BEFORE UPDATE ON forum_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_replies_updated_at BEFORE UPDATE ON forum_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update thread counts and activity
CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update thread reply count and last reply info
        UPDATE forum_threads 
        SET 
            reply_count = reply_count + 1,
            last_reply_at = NEW.created_at,
            last_reply_by = NEW.author_id
        WHERE id = NEW.thread_id;
        
        -- Update category stats
        UPDATE forum_categories 
        SET 
            post_count = post_count + 1,
            last_activity_at = NEW.created_at
        WHERE id = (SELECT category_id FROM forum_threads WHERE id = NEW.thread_id);
        
        -- Update user post count
        UPDATE user_profiles 
        SET forum_post_count = forum_post_count + 1
        WHERE user_id = NEW.author_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update thread reply count
        UPDATE forum_threads 
        SET reply_count = reply_count - 1
        WHERE id = OLD.thread_id;
        
        -- Update category stats
        UPDATE forum_categories 
        SET post_count = post_count - 1
        WHERE id = (SELECT category_id FROM forum_threads WHERE id = OLD.thread_id);
        
        -- Update user post count
        UPDATE user_profiles 
        SET forum_post_count = forum_post_count - 1
        WHERE user_id = OLD.author_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_thread_stats 
    AFTER INSERT OR DELETE ON forum_replies 
    FOR EACH ROW EXECUTE FUNCTION update_thread_stats();

-- Update category thread count
CREATE OR REPLACE FUNCTION update_category_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_categories 
        SET 
            thread_count = thread_count + 1,
            post_count = post_count + 1,
            last_activity_at = NEW.created_at
        WHERE id = NEW.category_id;
        
        -- Update user post count
        UPDATE user_profiles 
        SET forum_post_count = forum_post_count + 1
        WHERE user_id = NEW.author_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_categories 
        SET 
            thread_count = thread_count - 1,
            post_count = post_count - 1
        WHERE id = OLD.category_id;
        
        -- Update user post count
        UPDATE user_profiles 
        SET forum_post_count = forum_post_count - 1
        WHERE user_id = OLD.author_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_category_stats
    AFTER INSERT OR DELETE ON forum_threads
    FOR EACH ROW EXECUTE FUNCTION update_category_stats();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all forum tables
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_images ENABLE ROW LEVEL SECURITY;

-- Categories: Public read, admin write
CREATE POLICY "Categories are viewable by everyone" ON forum_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Categories can be managed by admins" ON forum_categories
    FOR ALL USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND forum_role IN ('admin', 'moderator')
        )
    );

-- Threads: Public read, authenticated write, author/admin edit
CREATE POLICY "Threads are viewable by everyone" ON forum_threads
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Authenticated users can create threads" ON forum_threads
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() = author_id
    );

CREATE POLICY "Authors and admins can update threads" ON forum_threads
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            auth.uid() = author_id OR
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_id = auth.uid()
                AND forum_role IN ('admin', 'moderator')
            )
        )
    );

CREATE POLICY "Authors and admins can delete threads" ON forum_threads
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND (
            auth.uid() = author_id OR
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_id = auth.uid()
                AND forum_role IN ('admin', 'moderator')
            )
        )
    );

-- Replies: Public read, authenticated write, author/admin edit
CREATE POLICY "Replies are viewable by everyone" ON forum_replies
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Authenticated users can create replies" ON forum_replies
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() = author_id AND
        -- Ensure thread is not locked
        NOT EXISTS (
            SELECT 1 FROM forum_threads
            WHERE id = thread_id AND is_locked = true
        )
    );

CREATE POLICY "Authors and admins can update replies" ON forum_replies
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            auth.uid() = author_id OR
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_id = auth.uid()
                AND forum_role IN ('admin', 'moderator')
            )
        )
    );

CREATE POLICY "Authors and admins can delete replies" ON forum_replies
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND (
            auth.uid() = author_id OR
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_id = auth.uid()
                AND forum_role IN ('admin', 'moderator')
            )
        )
    );

-- Images: Public read, author write/edit
CREATE POLICY "Forum images are viewable by everyone" ON forum_images
    FOR SELECT USING (true);

CREATE POLICY "Authors can manage their images" ON forum_images
    FOR ALL USING (
        auth.uid() IS NOT NULL AND
        auth.uid() = author_id
    );

-- =====================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- =====================================================

-- Insert sample categories
INSERT INTO forum_categories (name, description, icon, color, slug, sort_order) VALUES
('General Discussion', 'General EV topics and discussions', '💬', '#3B82F6', 'general', 1),
('Tesla', 'All things Tesla - Model S, 3, X, Y, and Cybertruck', '🚗', '#DC2626', 'tesla', 2),
('Charging', 'Charging stations, home charging, and infrastructure', '⚡', '#059669', 'charging', 3),
('Reviews & Experiences', 'Share your EV ownership experiences and reviews', '⭐', '#7C3AED', 'reviews', 4),
('Technical Support', 'Get help with EV technical issues and maintenance', '🔧', '#EA580C', 'support', 5),
('News & Updates', 'Latest EV industry news and updates', '📰', '#0891B2', 'news', 6);

-- =====================================================
-- VIEWS FOR EASY DATA ACCESS
-- =====================================================

-- Thread list view with author and category info
CREATE VIEW forum_thread_list AS
SELECT
    t.id,
    t.title,
    t.slug,
    t.content,
    t.is_pinned,
    t.is_locked,
    t.view_count,
    t.reply_count,
    t.created_at,
    t.updated_at,
    t.last_reply_at,
    c.name as category_name,
    c.slug as category_slug,
    c.icon as category_icon,
    c.color as category_color,
    up.username as author_username,
    up.full_name as author_name,
    up.avatar_url as author_avatar,
    lr_up.username as last_reply_username
FROM forum_threads t
JOIN forum_categories c ON t.category_id = c.id
JOIN user_profiles up ON t.author_id = up.user_id
LEFT JOIN user_profiles lr_up ON t.last_reply_by = lr_up.user_id
WHERE t.is_deleted = false
ORDER BY t.is_pinned DESC, t.last_reply_at DESC NULLS LAST;

-- Reply tree view with author info
CREATE VIEW forum_reply_tree AS
SELECT
    r.id,
    r.thread_id,
    r.parent_id,
    r.content,
    r.nesting_level,
    r.created_at,
    r.updated_at,
    up.username as author_username,
    up.full_name as author_name,
    up.avatar_url as author_avatar,
    up.forum_role as author_role
FROM forum_replies r
JOIN user_profiles up ON r.author_id = up.user_id
WHERE r.is_deleted = false
ORDER BY r.created_at ASC;
