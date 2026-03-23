<?php
// ============================================================
// change_password.php — Passwort ändern
// POST /api/change_password.php
// Body: { "current_password": "...", "new_password": "..." }
// Antwort: { "success": true }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth   = requireAuth();
$userId = (int) $auth['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

$body            = json_decode(file_get_contents('php://input'), true);
$currentPassword = $body['current_password'] ?? '';
$newPassword     = $body['new_password']     ?? '';

if (!$currentPassword || !$newPassword) {
    jsonResponse(['error' => 'Aktuelles und neues Passwort erforderlich'], 400);
}

if (mb_strlen($newPassword) < 8) {
    jsonResponse(['error' => 'Neues Passwort muss mindestens 8 Zeichen lang sein'], 400);
}

try {
    $db   = getDB();
    $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
        jsonResponse(['error' => 'Aktuelles Passwort ist falsch'], 401);
    }

    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmt    = $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $stmt->execute([$newHash, $userId]);

    jsonResponse(['success' => true]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
