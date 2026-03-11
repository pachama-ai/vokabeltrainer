<?php
// ============================================================
// db.php — Datenbankverbindung
// Diese Datei außerhalb des Web-Root ablegen oder mit
// .htaccess schützen! Niemals direkt aufrufen.
// ============================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'vokabeltrainer');
define('DB_USER', 'root');             // XAMPP: root. Server: eigenen User eintragen.
define('DB_PASS', '');                 // XAMPP: leer lassen. Server: Passwort eintragen.
define('DB_CHARSET', 'utf8mb4');

// JWT Secret — langer, zufälliger String (mindestens 32 Zeichen)
define('JWT_SECRET', 'AENDERN_langer_geheimer_schluessel_hier_eintragen');
define('JWT_EXPIRY', 60 * 60 * 24 * 30); // 30 Tage in Sekunden

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

// CORS-Header — erlaubt Anfragen vom React-Frontend
function setCorsHeaders(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// JSON-Antwort senden und beenden
function jsonResponse(mixed $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
