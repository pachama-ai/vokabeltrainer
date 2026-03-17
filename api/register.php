<?php
// ============================================================
// register.php — Neuen User registrieren
// POST /api/register.php
// Body: { "email": "...", "password": "..." }
// ============================================================

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

$body = json_decode(file_get_contents('php://input'), true);
$username = trim($body['username'] ?? '');
$email    = trim($body['email']    ?? '');
$password = trim($body['password'] ?? '');

// Validierung
if ($username !== '' && strlen($username) > 80) {
    jsonResponse(['error' => 'Benutzername zu lang (max. 80 Zeichen)'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Ungültige E-Mail-Adresse'], 400);
}
if (strlen($password) < 6) {
    jsonResponse(['error' => 'Passwort muss mindestens 6 Zeichen haben'], 400);
}

try {
    $db = getDB();

    // Existiert bereits?
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'E-Mail bereits registriert'], 409);
    }

    // User anlegen
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
    $stmt->execute([$username !== '' ? $username : null, $email, $hash]);
    $userId = (int) $db->lastInsertId();

    // Direkt einloggen — Token zurückgeben
    $token = jwtCreate($userId, $email);
    jsonResponse(['token' => $token, 'user_id' => $userId, 'email' => $email, 'username' => $username]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
