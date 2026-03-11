// Nur noch die Client-seitige Antwortprüfung.
// Die gesamte Stufenlogik läuft jetzt im PHP-Backend.
import levenshtein from 'fast-levenshtein';

/**
 * Prüft ob die Eingabe eine der Übersetzungen trifft.
 * Toleranz: Levenshtein-Distanz <= 1 für Wörter > 4 Zeichen.
 */
export function checkAnswer(input, translations) {
  const cleaned = input.trim().toLowerCase();
  return translations.some((translation) => {
    const target = translation.trim().toLowerCase();
    if (cleaned === target) return true;
    if (target.length > 4 && levenshtein.get(cleaned, target) <= 1) return true;
    return false;
  });
}
