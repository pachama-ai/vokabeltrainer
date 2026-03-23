<?php
// ============================================================
// update_profile.php — Profildaten aktualisieren
// POST /api/update_profile.php
// Body: { "username": "...", "name": "...",
//         "address": "...", "language": "..." }
// Antwort: { "success": true }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth   = requireAuth();
$userId = (int) $auth['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

$body     = json_decode(file_get_contents('php://input'), true);
$username = trim($body['username'] ?? '');
$name     = trim($body['name']     ?? '');
$address  = trim($body['address']  ?? '');
$language = trim($body['language'] ?? '');

if (mb_strlen($username) > 80) {
    jsonResponse(['error' => 'Benutzername zu lang (max. 80 Zeichen)'], 400);
}
if (mb_strlen($name) > 120) {
    jsonResponse(['error' => 'Name zu lang (max. 120 Zeichen)'], 400);
}
if (mb_strlen($address) > 255) {
    jsonResponse(['error' => 'Adresse zu lang (max. 255 Zeichen)'], 400);
}
if (mb_strlen($language) > 10) {
    jsonResponse(['error' => 'Sprache zu lang'], 400);
}

try {
    $db   = getDB();
    $stmt = $db->prepare(
        'UPDATE users SET username = ?, name = ?, address = ?, language = ? WHERE id = ?'
    );
    $stmt->execute([$username ?: null, $name ?: null, $address ?: null, $language ?: null, $userId]);

    jsonResponse(['success' => true]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
