<?php
// ============================================================
// get_profile.php — Profildaten des eingeloggten Users
// GET /api/get_profile.php
// Antwort: { "username": "...", "email": "...", "name": "...",
//            "address": "...", "language": "..." }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth   = requireAuth();
$userId = (int) $auth['user_id'];

try {
    $db   = getDB();
    $stmt = $db->prepare('SELECT username, email, name, address, language FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['error' => 'Benutzer nicht gefunden'], 404);
    }

    jsonResponse([
        'username' => $user['username'] ?? '',
        'email'    => $user['email']    ?? '',
        'name'     => $user['name']     ?? '',
        'address'  => $user['address']  ?? '',
        'language' => $user['language'] ?? '',
    ]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
