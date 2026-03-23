<?php
// ============================================================
// db.php — Datenbankverbindung
// Diese Datei außerhalb des Web-Root ablegen oder mit
// .htaccess schützen! Niemals direkt aufrufen.
// ============================================================

$__APP_LOCAL_CONFIG = [];
$__APP_LOCAL_CONFIG_FILE = __DIR__ . '/config.local.php';
if (is_file($__APP_LOCAL_CONFIG_FILE)) {
    $loaded = require $__APP_LOCAL_CONFIG_FILE;
    if (is_array($loaded)) {
        $__APP_LOCAL_CONFIG = $loaded;
    }
}

function cfg(string $key, mixed $default): mixed {
    global $__APP_LOCAL_CONFIG;

    if (array_key_exists($key, $__APP_LOCAL_CONFIG)) {
        return $__APP_LOCAL_CONFIG[$key];
    }

    $env = getenv($key);
    if ($env !== false && $env !== '') {
        return $env;
    }

    return $default;
}

define('DB_HOST', (string) cfg('DB_HOST', 'localhost'));
define('DB_NAME', (string) cfg('DB_NAME', 'vocab_app'));
define('DB_NAME_FALLBACK', (string) cfg('DB_NAME_FALLBACK', 'vokabeltrainer'));
define('DB_USER', (string) cfg('DB_USER', 'root'));      // XAMPP: root. Server: eigenen User eintragen.
define('DB_PASS', (string) cfg('DB_PASS', ''));          // XAMPP: leer lassen. Server: Passwort eintragen.
define('DB_CHARSET', 'utf8mb4');

// JWT Secret — langer, zufälliger String (mindestens 32 Zeichen)
define('JWT_SECRET', (string) cfg('JWT_SECRET', 'AENDERN_langer_geheimer_schluessel_hier_eintragen'));
define('JWT_EXPIRY', 60 * 60 * 24 * 30); // 30 Tage in Sekunden

// Passwort-Reset / E-Mail-Konfiguration
define('APP_BASE_URL', (string) cfg('APP_BASE_URL', 'http://localhost:5173'));
define('MAIL_FROM_ADDRESS', (string) cfg('MAIL_FROM_ADDRESS', 'no-reply@localhost'));
define('MAIL_FROM_NAME', (string) cfg('MAIL_FROM_NAME', 'Vokabeltrainer'));
define('PASSWORD_RESET_EXPIRY_MINUTES', 30);

// SMTP-Konfiguration fuer echten Mailversand
define('SMTP_ENABLED', (string) cfg('SMTP_ENABLED', '0') === '1');
define('SMTP_HOST', (string) cfg('SMTP_HOST', ''));
define('SMTP_PORT', (int) cfg('SMTP_PORT', 587));
define('SMTP_SECURE', (string) cfg('SMTP_SECURE', 'tls')); // tls | ssl | none
define('SMTP_USER', (string) cfg('SMTP_USER', ''));
define('SMTP_PASS', (string) cfg('SMTP_PASS', ''));
define('SMTP_TIMEOUT_SECONDS', (int) cfg('SMTP_TIMEOUT_SECONDS', 15));
define('SMTP_EHLO_HOST', (string) cfg('SMTP_EHLO_HOST', 'localhost'));

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dbNames = [DB_NAME];
        if (DB_NAME_FALLBACK !== '' && DB_NAME_FALLBACK !== DB_NAME) {
            $dbNames[] = DB_NAME_FALLBACK;
        }

        $lastException = null;
        foreach ($dbNames as $dbName) {
            try {
                $dsn = sprintf(
                    'mysql:host=%s;dbname=%s;charset=%s',
                    DB_HOST, $dbName, DB_CHARSET
                );
                $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
                break;
            } catch (PDOException $e) {
                $lastException = $e;
            }
        }

        if ($pdo === null && $lastException !== null) {
            throw $lastException;
        }
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
