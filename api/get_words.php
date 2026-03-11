<?php
// ============================================================
// get_words.php — Vokabeln + Fortschritt für eine Kategorie
// GET /api/get_words.php?category=grundwortschatz
// Antwort: Array von Vokabeln mit aktuellem Fortschritt des Users
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth     = requireAuth();
$userId   = (int) $auth['user_id'];
$category = $_GET['category'] ?? '';

$allowed = ['grundwortschatz', 'aufbauwortschatz', 'unregelmaessige_verben'];
if (!in_array($category, $allowed, true)) {
    jsonResponse(['error' => 'Ungültige Kategorie'], 400);
}

try {
    $db = getDB();

    // Vokabeln mit Fortschritt per LEFT JOIN
    // Wörter ohne Eintrag in user_progress gelten als Stufe 0
    $stmt = $db->prepare('
        SELECT
            v.id,
            v.word,
            v.translations,
            v.category,
            COALESCE(p.level, 0)          AS level,
            COALESCE(p.correct_streak, 0) AS correct_streak,
            p.last_reviewed,
            p.last_level5_at
        FROM vocabulary v
        LEFT JOIN user_progress p
            ON p.word_id = v.id AND p.user_id = :user_id
        WHERE v.category = :category
        ORDER BY v.id
    ');
    $stmt->execute([':user_id' => $userId, ':category' => $category]);
    $words = $stmt->fetchAll();

    // translations ist JSON-String → Array machen
    foreach ($words as &$w) {
        $w['translations'] = json_decode($w['translations'], true);
        $w['level']         = (int) $w['level'];
        $w['correct_streak'] = (int) $w['correct_streak'];
    }

    jsonResponse($words);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
