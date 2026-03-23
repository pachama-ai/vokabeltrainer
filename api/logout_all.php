<?php
// ============================================================
// logout_all.php — Überall ausloggen
// POST /api/logout_all.php
// Antwort: { "success": true }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

// Kein persistentes Session-Tracking: Erfolg zurückmelden,
// das Frontend löscht alle Tokens selbst.
jsonResponse(['success' => true]);
