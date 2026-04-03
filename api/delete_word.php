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

    // Nur den Fortschritt des aktuellen Users für dieses Wort löschen
    // Das Wort selbst bleibt erhalten (kann von anderen Usern noch verwendet werden)
    $db->prepare('DELETE FROM user_progress WHERE user_id = :user_id AND word_id = :word_id')
       ->execute([':user_id' => $auth['id'], ':word_id' => $wordId]);

    jsonResponse(['success' => true]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
