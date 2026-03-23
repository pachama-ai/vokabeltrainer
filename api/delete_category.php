<?php
// ============================================================
// delete_category.php — Kategorie und alle zugehörigen Vokabeln löschen
// POST /api/delete_category.php
// Body: { "category": "MeineKategorie" }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth   = requireAuth();
$userId = (int) $auth['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

$body     = json_decode(file_get_contents('php://input'), true);
$category = trim($body['category'] ?? '');

if ($category === '') {
    jsonResponse(['error' => 'Kein Kategoriename angegeben'], 400);
}

// Eingebaute Kategorien schützen
$builtIn = ['grundwortschatz', 'aufbauwortschatz', 'unregelmaessige_verben'];
if (in_array($category, $builtIn, true)) {
    jsonResponse(['error' => 'Eingebaute Kategorien können nicht gelöscht werden'], 403);
}

try {
    $db = getDB();
    $db->beginTransaction();

    // Alle Wort-IDs der Kategorie holen
    $stmt = $db->prepare('SELECT id FROM vocabulary WHERE category = :category');
    $stmt->execute([':category' => $category]);
    $wordIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!empty($wordIds)) {
        $placeholders = implode(',', array_fill(0, count($wordIds), '?'));

        // Fortschritt aller User für diese Wörter löschen
        $db->prepare("DELETE FROM user_progress WHERE word_id IN ($placeholders)")
           ->execute($wordIds);

        // Wörter löschen
        $db->prepare("DELETE FROM vocabulary WHERE id IN ($placeholders)")
           ->execute($wordIds);
    }

    $db->commit();
    jsonResponse(['success' => true, 'deleted_words' => count($wordIds)]);

} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
