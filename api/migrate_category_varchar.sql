-- ============================================================
-- Migration: vocabulary.category  ENUM → VARCHAR(100)
-- Ausführen mit: mysql -u root -p vocab_app < api/migrate_category_varchar.sql
-- oder direkt in phpMyAdmin einfügen
-- ============================================================

USE vocab_app;

ALTER TABLE vocabulary
  MODIFY COLUMN category VARCHAR(100) NOT NULL;
