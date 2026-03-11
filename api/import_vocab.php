<?php
// ============================================================
// import_vocab.php — Vokabeln aus vocabulary.json importieren
// Einmalig ausführen: php import_vocab.php
// NICHT über den Browser erreichbar machen!
// ============================================================

// CLI-Only
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit("Nur über die Kommandozeile ausführen.\n");
}

require_once __DIR__ . '/db.php';

// Pfad zur JSON-Datei — mehrere Orte werden geprüft:
// 1. Als Argument: php import_vocab.php C:\pfad\zur\vocabulary.json
// 2. Neben diesem Skript: api/vocabulary.json
// 3. Relativ zum Projekt: api/../src/data/vocabulary.json
$jsonPath = $argv[1]
    ?? (file_exists(__DIR__ . '/vocabulary.json') ? __DIR__ . '/vocabulary.json' : null)
    ?? __DIR__ . '/../src/data/vocabulary.json';

if (!file_exists($jsonPath)) {
    exit("Fehler: vocabulary.json nicht gefunden.\nLösung: Datei direkt neben import_vocab.php kopieren.\n");
}

$json  = file_get_contents($jsonPath);
$words = json_decode($json, true);

if (!is_array($words)) {
    exit("Fehler: JSON konnte nicht gelesen werden.\n");
}

$db   = getDB();
$stmt = $db->prepare(
    'INSERT IGNORE INTO vocabulary (word, translations, category)
     VALUES (?, ?, ?)'
);

$imported = 0;
$skipped  = 0;

foreach ($words as $w) {
    $word         = trim($w['word'] ?? '');
    $translations = json_encode($w['translations'] ?? [], JSON_UNESCAPED_UNICODE);
    $category     = trim($w['category'] ?? '');

    if (!$word || !$category) {
        $skipped++;
        continue;
    }

    $stmt->execute([$word, $translations, $category]);
    if ($stmt->rowCount() > 0) {
        $imported++;
    } else {
        $skipped++;
    }
}

echo "Fertig! Importiert: $imported · Übersprungen (Duplikate): $skipped\n";
