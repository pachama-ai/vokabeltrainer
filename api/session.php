<?php
// ============================================================
// session.php — Lernsitzungen starten und beenden
// POST /api/session.php
// Body start: { "action": "start", "category": "grundwortschatz" }
// Body end:   { "action": "end", "session_id": 42, "cards_reviewed": 15 }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth   = requireAuth();
$userId = (int) $auth['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

$body   = json_decode(file_get_contents('php://input'), true);
$action = $body['action'] ?? '';

try {
    $db = getDB();

    // Ensure table exists (auto-creates if missing)
    $db->exec('
        CREATE TABLE IF NOT EXISTS learning_sessions (
            id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id        INT UNSIGNED NOT NULL,
            category       VARCHAR(100) NOT NULL,
            started_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ended_at       DATETIME DEFAULT NULL,
            cards_reviewed INT UNSIGNED NOT NULL DEFAULT 0,
            INDEX idx_sess_user (user_id),
            INDEX idx_sess_cat  (user_id, category),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ');

    if ($action === 'start') {
        $category = $body['category'] ?? '';
        if ($category === '' || mb_strlen($category) > 100) {
            jsonResponse(['error' => 'Ungültige Kategorie'], 400);
        }

        $stmt = $db->prepare('
            INSERT INTO learning_sessions (user_id, category, started_at)
            VALUES (:user_id, :category, NOW())
        ');
        $stmt->execute([':user_id' => $userId, ':category' => $category]);
        jsonResponse(['session_id' => (int) $db->lastInsertId()]);

    } elseif ($action === 'end') {
        $sessionId     = (int) ($body['session_id'] ?? 0);
        $cardsReviewed = max(0, (int) ($body['cards_reviewed'] ?? 0));

        if (!$sessionId) {
            jsonResponse(['error' => 'session_id fehlt'], 400);
        }

        $stmt = $db->prepare('
            UPDATE learning_sessions
            SET ended_at = NOW(), cards_reviewed = :cards
            WHERE id = :id AND user_id = :user_id AND ended_at IS NULL
        ');
        $stmt->execute([':cards' => $cardsReviewed, ':id' => $sessionId, ':user_id' => $userId]);
        jsonResponse(['ok' => true]);

    } else {
        jsonResponse(['error' => 'Unbekannte Aktion'], 400);
    }

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
