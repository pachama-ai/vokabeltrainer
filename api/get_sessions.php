<?php
// ============================================================
// get_sessions.php — Aktive Sessions zurückgeben
// GET /api/get_sessions.php
// Antwort: { "sessions": [{ "id": 1, "device_name": "...",
//             "last_active": "...", "is_current": true }] }
// Hinweis: Kein persistentes Session-Tracking, daher wird nur
// die aktuelle Session (aus dem JWT) zurückgegeben.
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth = requireAuth();

jsonResponse([
    'sessions' => [
        [
            'id'          => 1,
            'device_name' => 'Current Session',
            'last_active' => date('Y-m-d H:i:s'),
            'is_current'  => true,
        ],
    ],
]);
