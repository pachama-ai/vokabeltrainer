<?php
// ============================================================
// get_categories.php — Alle Kategorien zurückgeben
// GET /api/get_categories.php
// Antwort: { "categories": ["grundwortschatz", "aufbauwortschatz", ...] }
// ============================================================

require_once __DIR__ . '/auth_check.php';

requireAuth(); // Token prüfen, user muss eingeloggt sein

try {
    $db = getDB();
    $stmt = $db->query('SELECT DISTINCT category FROM vocabulary ORDER BY category');
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
    jsonResponse(['categories' => array_values($rows)]);
} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
