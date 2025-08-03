# Forum Database Migration Guide

## Overview

This migration enhances the forum system with additional tables and features needed for a comprehensive forum implementation.

## What This Migration Does

### 1. Schema Fixes
- **Renames `forum_comments` to `forum_replies`** for consistency with the API routes
- **Updates foreign key references** in the `forum_likes` table
- **Adds missing fields** to existing tables

### 2. New Tables Added

#### `forum_votes`
- Implements upvote/downvote system for posts and replies
- Prevents duplicate votes per user
- Supports both posts and replies

#### `forum_reports`
- Content moderation system
- Users can report inappropriate content
- Admin workflow for reviewing reports

#### `forum_attachments`
- File upload support for posts and replies
- Stores file metadata and paths
- Supports images and documents

#### `forum_subscriptions`
- Thread subscription system
- Email/push notification preferences
- User can subscribe to specific posts

#### `forum_tags`
- Tag system for better content organization
- Usage tracking for popular tags
- Color coding for visual distinction

#### `forum_post_tags`
- Junction table linking posts to tags
- Many-to-many relationship

### 3. Performance Enhancements
- **Comprehensive indexes** for all major query patterns
- **Full-text search indexes** for content search
- **Automatic triggers** for maintaining counters

### 4. New Fields Added

#### `forum_posts` table:
- `tags` - Array of tag strings
- `is_active` - Soft delete support
- `reply_count` - Cached reply count
- `last_reply_at` - Last reply timestamp
- `last_reply_by` - Last reply author

#### `forum_replies` table:
- `is_active` - Soft delete support

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the contents of `migrations/001_forum_schema_fixes.sql`
4. Paste and execute the SQL

### Option 2: Using the Migration Script

```bash
cd backend
node database/apply_migration.js
```

This will output the SQL that you need to copy and paste into Supabase.

## Post-Migration Steps

### 1. Update Your Environment
Make sure your Supabase environment variables are set:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Test the Migration
Run the backend build to ensure no compilation errors:
```bash
npm run build
```

### 3. Verify Database Structure
Check that all tables were created successfully:
- `forum_categories` (existing, updated)
- `forum_posts` (existing, updated)
- `forum_replies` (renamed from forum_comments)
- `forum_votes` (new)
- `forum_reports` (new)
- `forum_attachments` (new)
- `forum_subscriptions` (new)
- `forum_tags` (new)
- `forum_post_tags` (new)

## New API Capabilities

After this migration, the forum system will support:

### Enhanced Features
- ✅ Upvote/downvote system
- ✅ Content reporting and moderation
- ✅ File attachments
- ✅ Thread subscriptions
- ✅ Tag system
- ✅ Full-text search
- ✅ Soft deletes
- ✅ Automatic counter maintenance

### Performance Improvements
- ✅ Optimized database queries
- ✅ Full-text search indexes
- ✅ Efficient pagination
- ✅ Cached counters

## Rollback Plan

If you need to rollback this migration:

1. **Backup your data first**
2. Drop the new tables:
   ```sql
   DROP TABLE IF EXISTS forum_post_tags;
   DROP TABLE IF EXISTS forum_tags;
   DROP TABLE IF EXISTS forum_subscriptions;
   DROP TABLE IF EXISTS forum_attachments;
   DROP TABLE IF EXISTS forum_reports;
   DROP TABLE IF EXISTS forum_votes;
   ```

3. Rename back to original:
   ```sql
   ALTER TABLE forum_replies RENAME TO forum_comments;
   ALTER TABLE forum_likes RENAME COLUMN reply_id TO comment_id;
   ```

4. Remove added columns:
   ```sql
   ALTER TABLE forum_posts DROP COLUMN IF EXISTS tags;
   ALTER TABLE forum_posts DROP COLUMN IF EXISTS is_active;
   ALTER TABLE forum_posts DROP COLUMN IF EXISTS last_reply_at;
   ALTER TABLE forum_posts DROP COLUMN IF EXISTS last_reply_by;
   ALTER TABLE forum_posts RENAME COLUMN reply_count TO comment_count;
   ```

## Next Steps

After applying this migration, you can:

1. **Implement voting endpoints** in the API
2. **Add file upload functionality**
3. **Create moderation tools**
4. **Build notification system**
5. **Implement tag management**

## Support

If you encounter issues with this migration:

1. Check the Supabase logs for detailed error messages
2. Ensure you have sufficient database permissions
3. Verify all foreign key relationships exist
4. Test with a small dataset first

## Migration Status

- [x] Schema design completed
- [x] Migration SQL created
- [x] Migration script created
- [ ] Migration applied to database
- [ ] API endpoints updated
- [ ] Frontend components updated
- [ ] Testing completed
