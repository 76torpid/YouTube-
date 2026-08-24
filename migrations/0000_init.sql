-- Migration: 0000_init.sql
-- Create search_rules table
CREATE TABLE IF NOT EXISTS search_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  interval_minutes INTEGER NOT NULL DEFAULT 15,
  enabled INTEGER NOT NULL DEFAULT 1,
  published_within_hours INTEGER NOT NULL DEFAULT 24,
  exclude_words TEXT,
  last_checked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create videos table with video_id PRIMARY KEY (Canonical deduplication key)
CREATE TABLE IF NOT EXISTS videos (
  video_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  published_at TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  discovered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  raw_metadata_json TEXT
);

-- Create articles table referencing videos
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL UNIQUE REFERENCES videos(video_id),
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT,
  prefecture TEXT,
  city TEXT,
  location_name TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  source_basis TEXT NOT NULL DEFAULT 'youtube_metadata',
  ai_model TEXT,
  ai_confidence REAL,
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table to prevent duplicate LINE notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL REFERENCES articles(id),
  destination_type TEXT NOT NULL DEFAULT 'line',
  sent_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, destination_type)
);

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
