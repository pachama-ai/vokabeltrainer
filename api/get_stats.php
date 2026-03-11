<?php
// ============================================================
// get_stats.php — Anzahl Wörter je Stufe (für Fortschrittsbalken)
// GET /api/get_stats.php?category=grundwortschatz
// category ist optional — ohne category = Gesamtstatistik
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth     = requireAuth();
$userId   = (int) $auth['user_id'];
$category = $_GET['category'] ?? null;

$allowed = ['grundwortschatz', 'aufbauwortschatz', 'unregelmaessige_verben'];
if ($category !== null && !in_array($category, $allowed, true)) {
    jsonResponse(['error' => 'Ungültige Kategorie'], 400);
}

try {
    $db = getDB();

    // Stufe-0: Wörter ohne user_progress-Eintrag
    $catFilter = $category ? 'AND v.category = :category' : '';

    $stmt = $db->prepare("
        SELECT
            COALESCE(p.level, 0) AS level,
            COUNT(*)              AS cnt
        FROM vocabulary v
        LEFT JOIN user_progress p
            ON p.word_id = v.id AND p.user_id = :user_id
        WHERE 1=1 $catFilter
        GROUP BY COALESCE(p.level, 0)
    ");
    $params = [':user_id' => $userId];
    if ($category) $params[':category'] = $category;
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // In praktisches Objekt umwandeln: { "0": 150, "1": 20, ... }
    $counts = array_fill(0, 6, 0);
    foreach ($rows as $row) {
        $counts[(int) $row['level']] = (int) $row['cnt'];
    }

    $total    = array_sum($counts);
    $mastered = $counts[5];

    jsonResponse([
        'counts'   => $counts,   // [stufe0, stufe1, ..., stufe5]
        'total'    => $total,
        'mastered' => $mastered,
        'category' => $category,
    ]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
