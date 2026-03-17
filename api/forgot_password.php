<?php
// ============================================================
// forgot_password.php — Neues Passwort per Mail senden
// POST /api/forgot_password.php
// Body: { "email": "..." }
// Antwort: Immer generisch (Sicherheit gegen User-Enumeration)
// ============================================================

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

$body = json_decode(file_get_contents('php://input'), true);
$email = trim((string) ($body['email'] ?? ''));

$genericSuccess = [
    'message' => 'Wenn ein Konto mit dieser E-Mail existiert, wurde ein neues Passwort gesendet.',
];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse($genericSuccess, 200);
}

function generatePassword(int $length = 10): string {
    $chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#%';
    $pw = '';
    for ($i = 0; $i < $length; $i++) {
        $pw .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $pw;
}

try {
    $db = getDB();

    $stmt = $db->prepare('SELECT id, email FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse($genericSuccess, 200);
    }

    $newPassword = generatePassword(10);
    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);

    $update = $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $update->execute([$newHash, (int) $user['id']]);

    $subject = 'Dein neues Passwort - Vokabeltrainer';
    $safeEmail = htmlspecialchars((string) $user['email'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safePw = htmlspecialchars($newPassword, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    $textBody = "Hallo,\n\n" .
        "fuer dein Konto ($safeEmail) wurde ein neues Passwort generiert.\n\n" .
        "Dein neues Passwort: $newPassword\n\n" .
        "Bitte aendere es nach dem Einloggen.\n" .
        "Falls du das nicht angefordert hast, ignoriere diese E-Mail.\n";

    $htmlBody = '<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:480px;margin:40px auto;padding:0 20px">' .
        '<h2 style="color:#4b7a8f">Dein neues Passwort</h2>' .
        '<p>Fuer dein Konto <strong>' . $safeEmail . '</strong> wurde ein neues Passwort generiert:</p>' .
        '<p style="font-size:1.5rem;letter-spacing:0.1em;background:#f0f4f6;padding:14px 20px;border-radius:8px;font-family:monospace"><strong>' . $safePw . '</strong></p>' .
        '<p>Bitte logge dich damit ein und aendere dein Passwort danach.</p>' .
        '<p style="color:#9ca3af;font-size:0.85rem">Falls du das nicht angefordert hast, ignoriere diese E-Mail.</p>' .
        '</body></html>';

    $sent = sendAppMail((string) $user['email'], $subject, $textBody, $htmlBody);

    if (!$sent) {
        $hint = SMTP_ENABLED
            ? 'SMTP konnte nicht senden. Zugangsdaten/Host/Port pruefen.'
            : 'SMTP ist nicht aktiv. In api/config.local.php SMTP_ENABLED auf 1 setzen und SMTP-Daten eintragen.';
        jsonResponse(['error' => 'E-Mail konnte nicht versendet werden. ' . $hint], 500);
    }

    jsonResponse($genericSuccess, 200);

} catch (Throwable $e) {
    jsonResponse(['error' => 'Serverfehler'], 500);
}
