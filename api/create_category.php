<?php
// ============================================================
// create_category.php — Neue Kategorie + Vokabeln anlegen
// POST /api/create_category.php
// Body: { "name": "MeineKategorie", "words": [{"de":"Hund","en":"dog"}, ...] }
// Antwort: { "success": true, "category": "MeineKategorie", "added": 5 }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth   = requireAuth();
$userId = (int) $auth['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

$body  = json_decode(file_get_contents('php://input'), true);
$name  = trim($body['name'] ?? '');
$words = $body['words'] ?? [];

// Validierung
if ($name === '' || mb_strlen($name) > 100) {
    jsonResponse(['error' => 'Ungültiger Kategoriename (max. 100 Zeichen)'], 400);
}

if (!is_array($words) || count($words) === 0) {
    jsonResponse(['error' => 'Keine Vokabeln übergeben'], 400);
}

try {
    $db = getDB();
    $db->beginTransaction();

    $stmtWord = $db->prepare(
        'INSERT INTO vocabulary (word, translations, category) VALUES (:word, :translations, :category)'
    );
    $stmtProg = $db->prepare(
        'INSERT INTO user_progress (user_id, word_id, level)
         VALUES (:user_id, :word_id, 1)
         ON DUPLICATE KEY UPDATE level = GREATEST(level, 1)'
    );

    $added = 0;
    foreach ($words as $w) {
        $de = trim($w['de'] ?? '');
        $en = trim($w['en'] ?? '');
        if ($de === '' || $en === '') continue;

        $stmtWord->execute([
            ':word'         => $de,
            ':translations' => json_encode([$en], JSON_UNESCAPED_UNICODE),
            ':category'     => $name,
        ]);

        $wordId = (int) $db->lastInsertId();
        $stmtProg->execute([':user_id' => $userId, ':word_id' => $wordId]);
        $added++;
    }

    $db->commit();
    jsonResponse(['success' => true, 'category' => $name, 'added' => $added]);

} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
