-- Migration: Create Notifications & Messaging Tables
-- Version: 006
-- Author: Backend & Infrastructure Lead
-- Date: 2026-08-25
-- Status: User Communication & Notifications

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- match_scheduled, tournament_created, result_recorded, ranking_change, etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_resource_type VARCHAR(50), -- tournament, match, event, user, club
  related_resource_id UUID,
  status VARCHAR(50) DEFAULT 'unread', -- unread, read, archived
  priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  archived_at TIMESTAMP,
  expires_at TIMESTAMP,

  CONSTRAINT valid_type CHECK (type IN (
    'match_scheduled', 'match_result', 'tournament_created', 'result_recorded',
    'ranking_change', 'achievement_unlocked', 'tournament_registration', 'club_event',
    'friend_request', 'message_received', 'system_alert', 'reminder'
  )),
  CONSTRAINT valid_status CHECK (status IN ('unread', 'read', 'archived')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Create indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Create notification_preferences table for user notification settings
CREATE TABLE IF NOT EXISTS notification_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  match_scheduled_email BOOLEAN DEFAULT TRUE,
  tournament_updates_email BOOLEAN DEFAULT TRUE,
  results_notifications BOOLEAN DEFAULT TRUE,
  news_and_promotions BOOLEAN DEFAULT FALSE,
  ranking_change_notifications BOOLEAN DEFAULT TRUE,
  achievement_notifications BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'UTC',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notification_preferences table
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Create messages table for direct user-to-user messaging
CREATE TABLE IF NOT EXISTS messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(user_id),
  recipient_id UUID NOT NULL REFERENCES users(user_id),
  subject VARCHAR(255),
  content TEXT NOT NULL,
  read_at TIMESTAMP,
  deleted_by_sender BOOLEAN DEFAULT FALSE,
  deleted_by_recipient BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT different_users CHECK (sender_id != recipient_id)
);

-- Create indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at) WHERE read_at IS NULL;

-- Create message_attachments table for file sharing
CREATE TABLE IF NOT EXISTS message_attachments (
  attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  file_type VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for message_attachments table
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);

-- Create channels table for group messaging
CREATE TABLE IF NOT EXISTS channels (
  channel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  channel_type VARCHAR(50) NOT NULL DEFAULT 'group', -- group, tournament, club, direct
  created_by UUID NOT NULL REFERENCES users(user_id),
  related_tournament_id UUID REFERENCES tournaments(id),
  related_club_id UUID REFERENCES clubs(club_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT valid_channel_type CHECK (channel_type IN ('group', 'tournament', 'club', 'direct'))
);

-- Create indexes for channels table
CREATE INDEX IF NOT EXISTS idx_channels_created_by ON channels(created_by);
CREATE INDEX IF NOT EXISTS idx_channels_channel_type ON channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_channels_related_tournament_id ON channels(related_tournament_id);
CREATE INDEX IF NOT EXISTS idx_channels_related_club_id ON channels(related_club_id);

-- Create channel_members table for group membership
CREATE TABLE IF NOT EXISTS channel_members (
  member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(channel_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  UNIQUE(channel_id, user_id),

  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member'))
);

-- Create indexes for channel_members table
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_role ON channel_members(role);

-- Create channel_messages table for group messages
CREATE TABLE IF NOT EXISTS channel_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(channel_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id),
  content TEXT NOT NULL,
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for channel_messages table
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel_id ON channel_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_user_id ON channel_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_created_at ON channel_messages(created_at DESC);

-- Create function for timestamp updates
CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notification_preferences
DROP TRIGGER IF EXISTS trigger_update_notification_preferences_timestamp ON notification_preferences;
CREATE TRIGGER trigger_update_notification_preferences_timestamp
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_notification_timestamp();

-- Create trigger for channels
DROP TRIGGER IF EXISTS trigger_update_channels_timestamp ON channels;
CREATE TRIGGER trigger_update_channels_timestamp
BEFORE UPDATE ON channels
FOR EACH ROW
EXECUTE FUNCTION update_notification_timestamp();

-- Create trigger for channel_messages
DROP TRIGGER IF EXISTS trigger_update_channel_messages_timestamp ON channel_messages;
CREATE TRIGGER trigger_update_channel_messages_timestamp
BEFORE UPDATE ON channel_messages
FOR EACH ROW
EXECUTE FUNCTION update_notification_timestamp();

-- Migration status: COMPLETED
-- Tables created: notifications, notification_preferences, messages, message_attachments, channels, channel_members, channel_messages
-- Indexes created: 23
-- Triggers created: 3
-- Total objects: 33
