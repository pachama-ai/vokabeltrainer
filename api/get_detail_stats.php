<?php
// ============================================================
// get_detail_stats.php — Detailstatistik für eine Kategorie
// GET /api/get_detail_stats.php?category=grundwortschatz
// Antwort: { top_failures: [{word, translation, wrong_count}], avg_time: null|{...} }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth     = requireAuth();
$userId   = (int) $auth['user_id'];
$category = $_GET['category'] ?? '';

if ($category === '' || mb_strlen($category) > 100) {
    jsonResponse(['error' => 'Ungültige Kategorie'], 400);
}

try {
    $db = getDB();

    // Ensure columns exist (migration guard)
    try {
        $db->exec('ALTER TABLE user_progress
            ADD COLUMN IF NOT EXISTS wrong_count   INT UNSIGNED NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS total_reviews INT UNSIGNED NOT NULL DEFAULT 0');
    } catch (PDOException $ignored) {}

    // ── Top 10 Failures ───────────────────────────────────────
    $stmt = $db->prepare('
        SELECT v.word, v.translations, p.wrong_count
        FROM user_progress p
        JOIN vocabulary v ON v.id = p.word_id
        WHERE p.user_id = :user_id
          AND v.category = :category
          AND p.wrong_count > 0
        ORDER BY p.wrong_count DESC
        LIMIT 10
    ');
    $stmt->execute([':user_id' => $userId, ':category' => $category]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $topFailures = [];
    foreach ($rows as $row) {
        $translations = json_decode($row['translations'], true);
        $topFailures[] = [
            'word'        => $row['word'],
            'translation' => is_array($translations) ? implode(', ', $translations) : $row['translations'],
            'wrong_count' => (int) $row['wrong_count'],
        ];
    }

    // ── Average Session Time ──────────────────────────────────
    // Requires learning_sessions table; if not present, return null gracefully
    $avgTime = null;
    try {
        $stmt2 = $db->prepare('
            SELECT COUNT(*) AS session_count,
                   AVG(TIMESTAMPDIFF(SECOND, started_at, ended_at)) AS avg_seconds,
                   SUM(cards_reviewed) AS total_cards
            FROM learning_sessions
            WHERE user_id = :user_id
              AND category = :category
              AND ended_at IS NOT NULL
              AND TIMESTAMPDIFF(SECOND, started_at, ended_at) BETWEEN 10 AND 7200
        ');
        $stmt2->execute([':user_id' => $userId, ':category' => $category]);
        $row2 = $stmt2->fetch(PDO::FETCH_ASSOC);

        if ($row2 && (int)$row2['session_count'] >= 1 && $row2['avg_seconds'] !== null) {
            $avgTime = [
                'minutes'       => (int) round($row2['avg_seconds'] / 60),
                'session_count' => (int) $row2['session_count'],
                'total_cards'   => (int) ($row2['total_cards'] ?? 0),
            ];
        }
    } catch (PDOException $e) {
        // Table doesn't exist yet — silently return null
        $avgTime = null;
    }

    jsonResponse([
        'top_failures' => $topFailures,
        'avg_time'     => $avgTime,
    ]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
