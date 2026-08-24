-- Migration: 0001_articles_enhance.sql
-- Enhance articles table with bullet_points, tags, location_confidence, incident_type, updated_at

ALTER TABLE articles ADD COLUMN bullet_points TEXT;
ALTER TABLE articles ADD COLUMN tags TEXT;
ALTER TABLE articles ADD COLUMN location_confidence REAL;
ALTER TABLE articles ADD COLUMN incident_type TEXT;
ALTER TABLE articles ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;
