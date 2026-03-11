<?php
// ============================================================
// auth_check.php — JWT prüfen
// Wird von allen geschützten Endpunkten mit require_once eingebunden.
// Setzt $authUserId und $authEmail als globale Variablen.
// ============================================================

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

setCorsHeaders();

function requireAuth(): array {
    // XAMPP/Apache leitet HTTP_AUTHORIZATION manchmal nicht weiter —
    // daher mehrere Quellen prüfen
    $header = $_SERVER['HTTP_AUTHORIZATION']
           ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
           ?? '';

    // Fallback: getallheaders() (funktioniert in den meisten Apache-Configs)
    if (!$header && function_exists('getallheaders')) {
        $all = getallheaders();
        $header = $all['Authorization'] ?? $all['authorization'] ?? '';
    }

    // Format: "Bearer <token>"
    if (!str_starts_with($header, 'Bearer ')) {
        jsonResponse(['error' => 'Nicht eingeloggt'], 401);
    }

    $token   = substr($header, 7);
    $payload = jwtVerify($token);

    if (!$payload) {
        jsonResponse(['error' => 'Token ungültig oder abgelaufen'], 401);
    }

    return $payload; // ['user_id' => ..., 'email' => ...]
}
