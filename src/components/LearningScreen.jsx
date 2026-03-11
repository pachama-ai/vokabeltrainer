import { useState, useEffect, useRef } from 'react'
import { checkAnswer } from '../logic/learningEngine'

// Props:
//   category:   string
//   words:      Array von { id, word, translations, level, correct_streak }
//   counts:     [anzahl_stufe0, ..., anzahl_stufe5]  (aus getStats)
//   onAnswer:   async (wordId, correct) => { new_level, correct_streak }
//   onBack:     () => void

const STAGE_COLORS = [
  'bg-gray-600', 'bg-red-500', 'bg-orange-500',
  'bg-yellow-500', 'bg-lime-500', 'bg-green-500',
]
const STAGE_LABELS = ['Pool', 'Stufe 1', 'Stufe 2', 'Stufe 3', 'Stufe 4', 'Gemeistert']
const CATEGORY_LABELS = {
  grundwortschatz: 'Grundwortschatz',
  aufbauwortschatz: 'Aufbauwortschatz',
  unregelmaessige_verben: 'Unregelmäßige Verben',
}

function pickWord(words, lastId) {
  if (words.length === 0) return null
  // Niedrigere Stufen öfter abfragen
  const weighted = words.flatMap((w) => {
    const weight = Math.max(1, 5 - w.level)
    return Array(weight).fill(w)
  })
  const pool = weighted.filter((w) => w.id !== lastId)
  const source = pool.length > 0 ? pool : weighted
  return source[Math.floor(Math.random() * source.length)]
}

export default function LearningScreen({ category, words: initialWords, counts, onAnswer, onBack }) {
  // Lokale Kopie der Wörter — wird nach jeder Antwort per new_level aktualisiert
  const [words, setWords] = useState(initialWords.filter((w) => w.level >= 1 && w.level <= 4))
  const [current, setCurrent] = useState(() =>
    pickWord(initialWords.filter((w) => w.level >= 1 && w.level <= 4), null)
  )
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'incorrect'
  const [answered, setAnswered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localCounts, setLocalCounts] = useState(counts)
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 })
  const inputRef = useRef(null)

  useEffect(() => {
    if (!answered && !loading) inputRef.current?.focus()
  }, [answered, loading, current])

  const total = localCounts.reduce((a, b) => a + b, 0)

  async function handleSubmit() {
    if (answered) {
      // "Weiter" — API-Antwort wurde schon gesendet, nächstes Wort
      const updatedWords = words.filter((w) => w.level >= 1 && w.level <= 4)
      const next = pickWord(updatedWords, current.id)
      setCurrent(next)
      setInput('')
      setFeedback(null)
      setAnswered(false)
      return
    }

    if (!input.trim() || loading) return

    const correct = checkAnswer(input, current.translations)
    setFeedback(correct ? 'correct' : 'incorrect')
    setAnswered(true)
    setSessionStats((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }))

    // Im Hintergrund an Backend senden
    setLoading(true)
    try {
      const result = await onAnswer(current.id, correct)
      // Lokalen Wort-Eintrag aktualisieren
      const newLevel = result.new_level
      setWords((prev) =>
        prev.map((w) =>
          w.id === current.id
            ? { ...w, level: newLevel, correct_streak: result.correct_streak }
            : w
        )
      )
      // Lokale Statistik aktualisieren
      setLocalCounts((prev) => {
        const next = [...prev]
        const oldLevel = current.level
        next[oldLevel] = Math.max(0, next[oldLevel] - 1)
        next[newLevel] = (next[newLevel] ?? 0) + 1
        return next
      })
      // Aktuelles Wort mit neuem Level merken (für pickWord nach "Weiter")
      setCurrent((c) => ({ ...c, level: newLevel, correct_streak: result.correct_streak }))
    } catch {
      // API-Fehler: stillschweigend ignorieren, Fortschritt geht nicht verloren
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  const activeWords = words.filter((w) => w.level >= 1 && w.level <= 4)

  if (activeWords.length === 0 || !current) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-2xl mb-4">Keine aktiven Vokabeln mehr!</p>
          <p className="text-slate-400 mb-8">Alle Wörter sind gemeistert oder im Pool.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
          >
            ← Zurück
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
        >
          ← Zurück
        </button>
        <span className="font-semibold text-slate-300">{CATEGORY_LABELS[category]}</span>
        <span className="text-slate-500 text-sm">
          ✓ {sessionStats.correct} · ✗ {sessionStats.incorrect}
        </span>
      </div>

      {/* Fortschrittsbalken */}
      <div className="flex h-1.5">
        {localCounts.map((cnt, stage) => {
          const pct = total > 0 ? (cnt / total) * 100 : 0
          return (
            <div
              key={stage}
              className={`${STAGE_COLORS[stage]} transition-all`}
              style={{ width: `${pct}%` }}
            />
          )
        })}
      </div>

      {/* Haupt-Inhalt */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full">
        <div className={`text-xs px-3 py-1 rounded-full ${STAGE_COLORS[current.level]} mb-6`}>
          {STAGE_LABELS[current.level]}
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 text-center w-full mb-8 shadow-lg">
          <p className="text-slate-400 text-sm mb-3">Wie heißt das auf Englisch?</p>
          <p className="text-3xl font-bold">{current.word}</p>
        </div>

        <div className="w-full mb-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={answered}
            placeholder="Antwort eingeben..."
            className={`w-full px-5 py-4 rounded-xl text-lg outline-none transition-all ${
              answered
                ? feedback === 'correct'
                  ? 'bg-green-900 border-2 border-green-500 text-green-100'
                  : 'bg-red-900 border-2 border-red-500 text-red-100'
                : 'bg-slate-800 border-2 border-slate-700 focus:border-blue-500'
            }`}
          />
        </div>

        {answered && (
          <div className={`w-full rounded-xl p-4 mb-4 text-center ${
            feedback === 'correct' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
          }`}>
            {feedback === 'correct' ? (
              <p className="font-semibold">✓ Richtig!</p>
            ) : (
              <>
                <p className="font-semibold">✗ Leider falsch</p>
                <p className="text-sm mt-1 opacity-80">
                  Richtig: <span className="font-bold">{current.translations.join(' / ')}</span>
                </p>
              </>
            )}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={(!answered && !input.trim()) || loading}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all active:scale-95 disabled:opacity-40 ${
            answered ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          {answered ? 'Weiter →' : loading ? '...' : 'Antworten'}
        </button>
      </div>

      {/* Stufen-Übersicht unten */}
      <div className="p-4 border-t border-slate-800 flex justify-center gap-3 flex-wrap">
        {[1, 2, 3, 4, 5].map((stage) => (
          <div key={stage} className="flex items-center gap-1 text-xs text-slate-400">
            <div className={`w-2 h-2 rounded-full ${STAGE_COLORS[stage]}`} />
            <span>{STAGE_LABELS[stage]}: {localCounts[stage] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
