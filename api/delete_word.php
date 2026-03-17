<?php
// ============================================================
// delete_word.php — Vokabel löschen
// POST /api/delete_word.php
// Body: { "word_id": 42 }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

$body   = json_decode(file_get_contents('php://input'), true);
$wordId = (int) ($body['word_id'] ?? 0);

if ($wordId <= 0) {
    jsonResponse(['error' => 'Ungültige ID'], 400);
}

try {
    $db = getDB();
    $db->beginTransaction();

    // Fortschritt aller User für dieses Wort löschen (FK)
    $db->prepare('DELETE FROM user_progress WHERE word_id = :id')
       ->execute([':id' => $wordId]);

    // Wort löschen
    $db->prepare('DELETE FROM vocabulary WHERE id = :id')
       ->execute([':id' => $wordId]);

    $db->commit();
    jsonResponse(['success' => true]);

} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
