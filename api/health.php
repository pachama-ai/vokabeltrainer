<?php
// ============================================================
// health.php — einfacher Health-Check
// GET /api/health.php
// ============================================================

require_once __DIR__ . '/db.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Nur GET erlaubt'], 405);
}

try {
    $db = getDB();
    $db->query('SELECT 1');
    jsonResponse([
        'status' => 'ok',
        'db' => 'ok',
        'time' => date('c'),
    ]);
} catch (Throwable $e) {
    jsonResponse([
        'status' => 'error',
        'db' => 'error',
    ], 500);
}
