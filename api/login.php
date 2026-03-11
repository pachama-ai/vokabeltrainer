<?php
// ============================================================
// login.php — User einloggen
// POST /api/login.php
// Body: { "email": "...", "password": "..." }
// Antwort: { "token": "...", "user_id": 1, "email": "..." }
// ============================================================

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

$body     = json_decode(file_get_contents('php://input'), true);
$email    = trim($body['email']    ?? '');
$password = trim($body['password'] ?? '');

if (!$email || !$password) {
    jsonResponse(['error' => 'E-Mail und Passwort erforderlich'], 400);
}

try {
    $db = getDB();

    $stmt = $db->prepare('SELECT id, password_hash FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Absichtlich gleiche Fehlermeldung für E-Mail + Passwort (Sicherheit)
    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['error' => 'E-Mail oder Passwort falsch'], 401);
    }

    $token = jwtCreate((int) $user['id'], $email);
    jsonResponse([
        'token'   => $token,
        'user_id' => (int) $user['id'],
        'email'   => $email,
    ]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
