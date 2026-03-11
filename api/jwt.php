<?php
// ============================================================
// jwt.php — Minimale JWT-Implementierung (kein Composer nötig)
// Algorithmus: HS256 (HMAC-SHA256)
// ============================================================

require_once __DIR__ . '/db.php';

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

// JWT erzeugen
function jwtCreate(int $userId, string $email): string {
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64url_encode(json_encode([
        'user_id' => $userId,
        'email'   => $email,
        'exp'     => time() + JWT_EXPIRY,
        'iat'     => time(),
    ]));
    $signature = base64url_encode(
        hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
    );
    return "$header.$payload.$signature";
}

// JWT prüfen — gibt Payload zurück oder false
function jwtVerify(string $token): array|false {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;

    [$header, $payload, $sig] = $parts;

    // Signatur prüfen
    $expected = base64url_encode(
        hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
    );
    if (!hash_equals($expected, $sig)) return false;

    // Payload dekodieren
    $data = json_decode(base64url_decode($payload), true);
    if (!$data) return false;

    // Ablaufzeit prüfen
    if (isset($data['exp']) && $data['exp'] < time()) return false;

    return $data;
}
