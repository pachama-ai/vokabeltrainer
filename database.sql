-- ============================================================
-- Vokabeltrainer Datenbankschema
-- Ausführen mit: mysql -u root -p vocab_app < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS vocab_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vocab_app;

-- ------------------------------------------------------------
-- Benutzer
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255) NOT NULL UNIQUE,       -- Login-E-Mail
  password_hash VARCHAR(255) NOT NULL,             -- bcrypt via password_hash()
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Vokabeln (werden einmalig per import_vocab.php befüllt)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vocabulary (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  word         VARCHAR(500) NOT NULL,              -- Deutsches Wort mit Artikel
  translations JSON NOT NULL,                      -- ["car", "automobile"]
  category     ENUM(
    'grundwortschatz',
    'aufbauwortschatz',
    'unregelmaessige_verben'
  ) NOT NULL,
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Lernfortschritt je User
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_progress (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  word_id        INT UNSIGNED NOT NULL,
  level          TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- 0–5
  correct_streak TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_reviewed  DATETIME DEFAULT NULL,
  last_level5_at DATETIME DEFAULT NULL,               -- Für Verfall-Logik

  UNIQUE KEY uq_user_word (user_id, word_id),         -- Ein Eintrag pro User+Wort
  INDEX idx_user_id (user_id),
  INDEX idx_word_id (word_id),

  FOREIGN KEY (user_id) REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES vocabulary(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
