<?php
// ============================================================
// reset_password.php — Passwort per Reset-Token neu setzen
// POST /api/reset_password.php
// Body: { "token": "...", "password": "..." }
// ============================================================

require_once __DIR__ . '/db.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

$body = json_decode(file_get_contents('php://input'), true);
$token = trim((string) ($body['token'] ?? ''));
$password = (string) ($body['password'] ?? '');

if ($token === '') {
    jsonResponse(['error' => 'Reset-Token fehlt'], 400);
}

if (strlen($password) < 6) {
    jsonResponse(['error' => 'Passwort muss mindestens 6 Zeichen haben'], 400);
}

$tokenHash = hash('sha256', $token);

try {
    $db = getDB();

    $select = $db->prepare(
        'SELECT id, user_id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1'
    );
    $select->execute([$tokenHash]);
    $resetRow = $select->fetch();

    if (!$resetRow) {
        jsonResponse(['error' => 'Reset-Link ist ungueltig oder abgelaufen'], 400);
    }

    $newHash = password_hash($password, PASSWORD_BCRYPT);

    $db->beginTransaction();

    $updateUser = $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $updateUser->execute([$newHash, (int) $resetRow['user_id']]);

    $consumeCurrent = $db->prepare('UPDATE password_resets SET used_at = NOW() WHERE id = ?');
    $consumeCurrent->execute([(int) $resetRow['id']]);

    // Auch alle weiteren offenen Tokens dieses Users ungültig machen.
    $consumeOthers = $db->prepare('UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL');
    $consumeOthers->execute([(int) $resetRow['user_id']]);

    $db->commit();

    jsonResponse(['message' => 'Passwort erfolgreich aktualisiert'], 200);

} catch (Throwable $e) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) {
        $db->rollBack();
    }
    jsonResponse(['error' => 'Serverfehler'], 500);
}
