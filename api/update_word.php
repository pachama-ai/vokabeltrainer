<?php
// ============================================================
// update_word.php — Vokabel bearbeiten
// POST /api/update_word.php
// Body: { "word_id": 42, "word": "Hund", "translation": "dog" }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

$body        = json_decode(file_get_contents('php://input'), true);
$wordId      = (int) ($body['word_id'] ?? 0);
$word        = trim($body['word'] ?? '');
$translation = trim($body['translation'] ?? '');

if ($wordId <= 0 || $word === '' || $translation === '') {
    jsonResponse(['error' => 'Ungültige Daten'], 400);
}
if (mb_strlen($word) > 255 || mb_strlen($translation) > 255) {
    jsonResponse(['error' => 'Text zu lang (max. 255 Zeichen)'], 400);
}

try {
    $db   = getDB();
    $stmt = $db->prepare(
        'UPDATE vocabulary SET word = :word, translations = :translations WHERE id = :id'
    );
    $stmt->execute([
        ':word'         => $word,
        ':translations' => json_encode([$translation], JSON_UNESCAPED_UNICODE),
        ':id'           => $wordId,
    ]);

    jsonResponse(['success' => true]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
