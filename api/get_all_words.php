<?php
// ============================================================
// get_all_words.php — Alle Vokabeln (mit Filter + Paginierung)
// GET /api/get_all_words.php?category=all&search=&offset=0&limit=20
// Antwort: { words: [{id,word,translation,category}], total, has_more }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth   = requireAuth();
$userId = (int) $auth['user_id'];

$category = $_GET['category'] ?? 'all';
$search   = trim($_GET['search'] ?? '');
$offset   = max(0, (int) ($_GET['offset'] ?? 0));
$limit    = min(50, max(1, (int) ($_GET['limit'] ?? 20)));

try {
    $db = getDB();

    $where  = [];
    $params = [];

    if ($category !== 'all' && $category !== '' && mb_strlen($category) <= 100) {
        $where[]               = 'v.category = :category';
        $params[':category']   = $category;
    }
    if ($search !== '') {
        $where[]              = '(v.word LIKE :search1 OR v.translations LIKE :search2)';
        $params[':search1']   = '%' . $search . '%';
        $params[':search2']   = '%' . $search . '%';
    }

    $whereStr = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    // Total count
    $countStmt = $db->prepare("SELECT COUNT(*) FROM vocabulary v $whereStr");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    // Words
    $stmt = $db->prepare("
        SELECT v.id, v.word, v.translations, v.category
        FROM vocabulary v
        $whereStr
        ORDER BY v.category, v.word
        LIMIT :lim OFFSET :off
    ");
    foreach ($params as $k => $val) {
        $stmt->bindValue($k, $val);
    }
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $words = $stmt->fetchAll();
    foreach ($words as &$w) {
        $trans           = json_decode($w['translations'], true);
        $w['translation'] = is_array($trans) ? ($trans[0] ?? '') : '';
        unset($w['translations']);
        $w['id'] = (int) $w['id'];
    }

    jsonResponse([
        'words'    => $words,
        'total'    => $total,
        'has_more' => ($offset + $limit) < $total,
    ]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
