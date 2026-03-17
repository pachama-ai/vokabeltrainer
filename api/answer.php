<?php
// ============================================================
// answer.php — Antwort verarbeiten, Stufe anpassen
// POST /api/answer.php
// Body: { "word_id": 42, "correct": true }
// Antwort: { "word_id": 42, "new_level": 2, "correct_streak": 2 }
// ============================================================

require_once __DIR__ . '/auth_check.php';

$auth   = requireAuth();
$userId = (int) $auth['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Nur POST erlaubt'], 405);
}

$body    = json_decode(file_get_contents('php://input'), true);
$wordId  = (int) ($body['word_id'] ?? 0);
$correct = (bool) ($body['correct'] ?? false);

if (!$wordId) {
    jsonResponse(['error' => 'word_id fehlt'], 400);
}

// Aufstiegsregeln: wie viele aufeinanderfolgende richtige Antworten für Aufstieg
// Stufe 1→2: 2×, alle anderen: 3×
function streakNeeded(int $level): int {
    return $level === 1 ? 2 : 3;
}

try {
    $db = getDB();

    // Prüfen ob Wort existiert
    $stmt = $db->prepare('SELECT id FROM vocabulary WHERE id = ?');
    $stmt->execute([$wordId]);
    if (!$stmt->fetch()) {
        jsonResponse(['error' => 'Wort nicht gefunden'], 404);
    }

    // Aktuellen Fortschritt holen (oder Standardwerte)
    $stmt = $db->prepare(
        'SELECT level, correct_streak FROM user_progress
         WHERE user_id = ? AND word_id = ?'
    );
    $stmt->execute([$userId, $wordId]);
    $current = $stmt->fetch() ?: ['level' => 0, 'correct_streak' => 0];

    $level  = (int) $current['level'];
    $streak = (int) $current['correct_streak'];
    $now    = date('Y-m-d H:i:s');
    $lastLevel5At = null;

    if ($correct) {
        // Stufe 0 → hat noch nie gelernt, direkt auf 1 setzen
        if ($level === 0) {
            $level  = 1;
            $streak = 1;
        } else {
            $streak++;
            $needed = streakNeeded($level);
            if ($level < 5 && $streak >= $needed) {
                $level++;
                $streak = 0;
                if ($level === 5) {
                    $lastLevel5At = $now;
                }
            }
        }
    } else {
        // Falsch: 2 Stufen zurück, Minimum 1
        $level  = max(1, $level - 2);
        $streak = 0;
    }

    // Fortschritt speichern (INSERT oder UPDATE)
    $wrongInc = $correct ? 0 : 1;
    $stmt = $db->prepare('
        INSERT INTO user_progress (user_id, word_id, level, correct_streak, last_reviewed, last_level5_at, wrong_count, total_reviews)
        VALUES (:user_id, :word_id, :level, :streak, :now, :lv5, :wrong, 1)
        ON DUPLICATE KEY UPDATE
            level          = VALUES(level),
            correct_streak = VALUES(correct_streak),
            last_reviewed  = VALUES(last_reviewed),
            last_level5_at = COALESCE(VALUES(last_level5_at), last_level5_at),
            wrong_count    = wrong_count + :wrong2,
            total_reviews  = total_reviews + 1
    ');
    $stmt->execute([
        ':user_id' => $userId,
        ':word_id' => $wordId,
        ':level'   => $level,
        ':streak'  => $streak,
        ':now'     => $now,
        ':lv5'     => $lastLevel5At,
        ':wrong'   => $wrongInc,
        ':wrong2'  => $wrongInc,
    ]);

    jsonResponse([
        'word_id'        => $wordId,
        'new_level'      => $level,
        'correct_streak' => $streak,
    ]);

} catch (PDOException $e) {
    jsonResponse(['error' => 'Datenbankfehler'], 500);
}
