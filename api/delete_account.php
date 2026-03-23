<?php
// ============================================================
// delete_account.php — Account und alle Daten löschen
// POST /api/delete_account.php
// Antwort: { "success": true }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth   = requireAuth();
$userId = (int) $auth['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

try {
    $db   = getDB();
    // Cascade-Delete: user_progress und password_resets werden durch FK ON DELETE CASCADE mitgelöscht
    $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$userId]);

    jsonResponse(['success' => true]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
