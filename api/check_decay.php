<?php
// ============================================================
// check_decay.php — Stufe-5-Wörter nach 30 Tagen auf Stufe 4
// POST /api/check_decay.php
// Beim Login aufrufen. Keine Body-Parameter nötig.
// Antwort: { "decayed": 3 }  (Anzahl betroffener Wörter)
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth   = requireAuth();
$userId = (int) $auth['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

try {
    $db = getDB();

    // Alle Stufe-5-Wörter des Users die seit > 30 Tagen nicht mehr
    // auf Stufe 5 gebracht wurden → auf Stufe 4 zurücksetzen
    $stmt = $db->prepare('
        UPDATE user_progress
        SET level          = 4,
            correct_streak = 0
        WHERE user_id       = :user_id
          AND level         = 5
          AND last_level5_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    ');
    $stmt->execute([':user_id' => $userId]);
    $decayed = $stmt->rowCount();

    jsonResponse(['decayed' => $decayed]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
