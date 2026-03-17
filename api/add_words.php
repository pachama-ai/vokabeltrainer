<?php
// ============================================================
// add_words.php — N zufällige Wörter aus Stufe 0 → Stufe 1
// POST /api/add_words.php
// Body: { "category": "grundwortschatz", "count": 20 }
// Antwort: { "added": 20 }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth   = requireAuth();
$userId = (int) $auth['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

$body     = json_decode(file_get_contents('php://input'), true);
$category = $body['category'] ?? '';
$count    = min(50, max(1, (int) ($body['count'] ?? 20)));

if ($category === '' || mb_strlen($category) > 100) {
    jsonResponse(['error' => 'Ungültige Kategorie'], 400);
}

try {
    $db = getDB();

    // Wörter holen die der User noch nicht angefangen hat (kein Eintrag = Stufe 0)
    $stmt = $db->prepare('
        SELECT v.id
        FROM vocabulary v
        LEFT JOIN user_progress p
            ON p.word_id = v.id AND p.user_id = :user_id
        WHERE v.category = :category
          AND (p.level IS NULL OR p.level = 0)
        ORDER BY RAND()
        LIMIT :cnt
    ');
    $stmt->bindValue(':user_id',  $userId,   PDO::PARAM_INT);
    $stmt->bindValue(':category', $category, PDO::PARAM_STR);
    $stmt->bindValue(':cnt',      $count,    PDO::PARAM_INT);
    $stmt->execute();
    $words = $stmt->fetchAll();

    if (empty($words)) {
        jsonResponse(['added' => 0, 'message' => 'Keine Wörter mehr im Pool']);
    }

    // Alle auf Stufe 1 setzen
    $now  = date('Y-m-d H:i:s');
    $inserts = array_map(fn($w) => "($userId, {$w['id']}, 1, 0, '$now')", $words);
    $sql = 'INSERT INTO user_progress (user_id, word_id, level, correct_streak, last_reviewed)
            VALUES ' . implode(', ', $inserts) . '
            ON DUPLICATE KEY UPDATE level = GREATEST(level, 1)';
    $db->exec($sql);

    jsonResponse(['added' => count($words)]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
