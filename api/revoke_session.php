<?php
// ============================================================
// revoke_session.php — Session widerrufen
// POST /api/revoke_session.php
// Body: { "session_id": 1 }
// Antwort: { "success": true }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

// Kein persistentes Session-Tracking: Erfolg zurückmelden,
// das Frontend löscht den Token selbst.
jsonResponse(['success' => true]);
