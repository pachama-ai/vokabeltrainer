import { useState, useEffect, useRef } from 'react'
import { checkAnswer } from '../logic/learningEngine'
import { startSession, endSession } from '../api/vocabApi'
import { AvatarIcon, getAvatarIdx } from './avatars'
import './LearningScreen.css'
import './CategoryScreen.css'

const BUILTIN_CAT_IDS = [
  'grundwortschatz',
  'aufbauwortschatz',
  'unregelmaessige_verben',
]

const CAT_COLOR_MAP = {
  grundwortschatz: '#c4956a',
  aufbauwortschatz: '#5aab82',
  unregelmaessige_verben: '#b07891',
}
const DEFAULT_CAT_COLOR = '#8da0c0'

const PlaceholderIcon = () => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
    <ellipse cx="16" cy="13" rx="9" ry="8" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M10 20 Q8 28 16 28 Q24 28 22 20" stroke="currentColor" strokeWidth="1.8" fill="none"/>
    <circle cx="13" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
    <path d="M13 16 Q16 18.5 19 16" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
)

const LearnIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5,3 19,12 5,21"/>
  </svg>
)
const TestIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
)
const ManageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)

const ACTION_BTNS = [
  { id: 'learn',  label: 'Learn',  Icon: LearnIcon,  color: '#5b9ec9' },
  { id: 'test',   label: 'Test',   Icon: TestIcon,   color: '#c0826e' },
  { id: 'manage', label: 'Manage', Icon: ManageIcon, color: '#9a8e5e' },
]

const LEVELS = [
  { level: 1, label: 'Level 1', color: '#e87070' },
  { level: 2, label: 'Level 2', color: '#f0a055' },
  { level: 3, label: 'Level 3', color: '#f0d055' },
  { level: 4, label: 'Level 4', color: '#84c97e' },
  { level: 5, label: 'Level 5', color: '#68b0e2' },
]
const LEVEL_ICONS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']

function pickWord(words, lastId) {
  if (words.length === 0) return null
  const weighted = words.flatMap((w) => {
    const weight = Math.max(1, 6 - w.level)
    return Array(weight).fill(w)
  })
  const pool = weighted.filter((w) => w.id !== lastId)
  const source = pool.length > 0 ? pool : weighted
  return source[Math.floor(Math.random() * source.length)]
}

export default function LearningScreen({ category, words: initialWords, counts, onAnswer, onBack, learnSettings, activeCatId, onSettings, customCats = [] }) {
  const [avatarIdx] = useState(getAvatarIdx)

  // Which levels to include (learnSettings?.levels, or default 1-4)
  const activeLevels = learnSettings?.levels ?? [1, 2, 3, 4]
  // Filter by selected levels, then limit by total if set
  const filteredInitial = initialWords.filter((w) => activeLevels.includes(w.level))
  const sessionLimit = learnSettings?.total ?? null
  const activeInitial = sessionLimit ? filteredInitial.slice(0, sessionLimit) : filteredInitial

  // Direction helpers
  const dirs = learnSettings?.direction ?? ['de']
  function pickDir() {
    if (dirs.length >= 2) return Math.random() < 0.5 ? 'de' : 'en'
    return dirs[0]
  }

  const [words, setWords] = useState(activeInitial)
  const [current, setCurrent] = useState(() => pickWord(activeInitial, null))
  const [currentDir, setCurrentDir] = useState(() => pickDir())
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'incorrect'
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [answered, setAnswered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localCounts, setLocalCounts] = useState(counts)
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 })
  const [wrongWords, setWrongWords] = useState([])
  const [sessionDone, setSessionDone] = useState(false)
  const [showMistakes, setShowMistakes] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showCorrect, setShowCorrect] = useState(false)
  const inputRef = useRef(null)
  const sessionIdRef = useRef(null)
  const cardsReviewedRef = useRef(0)

  useEffect(() => {
    startSession(category)
      .then(d => { sessionIdRef.current = d.session_id })
      .catch(() => {})
    return () => {
      if (sessionIdRef.current) {
        endSession(sessionIdRef.current, cardsReviewedRef.current).catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    if (!answered && !loading) inputRef.current?.focus()
  }, [answered, loading, current])

  const total = localCounts.reduce((a, b) => a + b, 0)

  async function handleSubmit() {
    if (answered) {
      const nextCount = cardsReviewedRef.current
      if (sessionLimit && nextCount >= sessionLimit) {
        setSessionDone(true)
        setAnswered(false)
        return
      }
      const updatedWords = words.filter((w) => activeLevels.includes(w.level))
      const next = pickWord(updatedWords, current?.id)
      if (!next) {
        setSessionDone(true)
        setAnswered(false)
        return
      }
      setCurrent(next)
      setCurrentDir(pickDir())
      setInput('')
      setFeedback(null)
      setCorrectAnswer('')
      setAnswered(false)
      setShowCorrect(false)
      return
    }

    if (!input.trim() || loading || !current) return

    // Determine answer translations based on direction
    const answerTranslations = currentDir === 'en' ? [current.word] : current.translations
    const correct = checkAnswer(input, answerTranslations)
    setFeedback(correct ? 'correct' : 'incorrect')
    setCorrectAnswer(answerTranslations[0])
    setAnswered(true)
    cardsReviewedRef.current += 1
    setSessionStats((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }))
    if (!correct) {
      setWrongWords(prev => prev.find(w => w.id === current.id) ? prev : [...prev, current])
    }

    setLoading(true)
    try {
      const result = await onAnswer(current.id, correct)
      const newLevel = result.new_level
      setWords((prev) =>
        prev.map((w) => w.id === current.id ? { ...w, level: newLevel } : w)
      )
      setLocalCounts((prev) => {
        const next = [...prev]
        const oldLevel = current.level
        if (next[oldLevel] > 0) next[oldLevel]--
        next[newLevel] = (next[newLevel] ?? 0) + 1
        return next
      })
    } catch (e) {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  const dirLabel = currentDir === 'en' ? 'Englisch → Deutsch' : 'Deutsch → Englisch'
  const displayTotal = sessionLimit ?? cardsReviewedRef.current
  const levelTotal = localCounts.reduce((a, b) => a + b, 0)

  const allCatIds = [...BUILTIN_CAT_IDS, ...customCats]

  const sidebar = (
    <>
      {/* Left sidebar */}
      <aside className="hs__side hs__side--locked">
        <div className="hs__mascot-wrap">
          <button className="hs__mascot-btn" title="Settings" onClick={onSettings}>
            <AvatarIcon idx={avatarIdx} size={36} />
          </button>
          <span className="hs__mascot-lbl">Home</span>
        </div>
        {allCatIds.map(id => (
          <button
            key={id}
            className={`hs__cat-btn${activeCatId === id ? ' hs__cat-btn--on' : ''}`}
            style={{ background: CAT_COLOR_MAP[id] ?? DEFAULT_CAT_COLOR }}
            disabled
          ><PlaceholderIcon /></button>
        ))}
        <div className="hs__side-spacer" />
        <button className="hs__cat-btn hs__add-btn" disabled>+</button>
      </aside>
    </>
  )

  const rightSidebar = (
    <aside className="hs__side hs__side--r hs__side--r-test">
      {ACTION_BTNS.map(({ id, label, Icon, color }) => (
        <button key={id} className="hs__action-btn hs__action-btn--dim" disabled title={label} style={{ background: color }}>
          <Icon />
          <span className="hs__action-lbl">{label}</span>
        </button>
      ))}
      <div className="hs__side-spacer" />
      <button className="hs__cancel-btn" onClick={() => setShowExitConfirm(true)}>✕</button>
    </aside>
  )

  // ── MISTAKES LIST SCREEN ──────────────────────────────────────────────────
  if (sessionDone && showMistakes) {
    return (
      <div className="hs">
        <header className="hs__header">
          <div />
          <h1 className="hs__title">Study Mode</h1>
          <div />
        </header>
        <div className="hs__body">
          {sidebar}
          <main className="hs__main" style={{ justifyContent: 'center' }}>
            <div className="hs__quiz-wrap">
              <div className="hs__quiz-info-bar">
                <span className="hs__quiz-direction">{dirLabel}</span>
              </div>
              <div className="ls__mistakes-card">
                <div className="ls__mistakes-list">
                  {wrongWords.map((w, i) => (
                    <div key={w.id} className="ls__mistake-row">
                      <span className="ls__mistake-de">{w.word}</span>
                      <span className="ls__mistake-en">{w.translations?.[0] ?? ''}</span>
                      <span className="ls__mistake-level">Stufe {w.level}</span>
                    </div>
                  ))}
                </div>
                <div className="hs__result-footer">
                  <span />
                  <button className="hs__result-done" onClick={() => setShowMistakes(false)}>✓ Fertig</button>
                </div>
              </div>
            </div>
          </main>
          {rightSidebar}
        </div>
      </div>
    )
  }

  // ── RESULTS SCREEN ──────────────────────────────────────────────────────────
  if (sessionDone) {
    return (
      <div className="hs">
        <header className="hs__header">
          <div />
          <h1 className="hs__title">Study Mode</h1>
          <div />
        </header>
        <div className="hs__body">
          {sidebar}
          <main className="hs__main" style={{ justifyContent: 'center' }}>
            <div className="hs__quiz-wrap">
              <div className="hs__quiz-info-bar">
                <span className="hs__quiz-direction">Actualised Statistics</span>
                <span className="hs__quiz-counter">{sessionStats.correct + sessionStats.incorrect}/{displayTotal}</span>
              </div>
              <div className="hs__result-card ls__result-card">
                <div className="ls__result-body">
                  <div className="ls__result-left">
                    <div className="ls__result-avatar-sm">
                      <AvatarIcon idx={avatarIdx} size={56} />
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className="hs__result-star" style={{ '--angle': `${(i / 14) * 360}deg`, '--delay': `${i * 0.06}s` }}>★</div>
                      ))}
                    </div>
                    <p className="ls__result-score">
                      <span className="hs__result-score-n">{sessionStats.correct}</span>
                      <span className="hs__result-score-d">/{sessionStats.correct + sessionStats.incorrect}</span>
                    </p>
                  </div>
                  <div className="ls__result-rows">
                  {LEVELS.map((l, i) => {
                    const n = localCounts[l.level] ?? 0
                    const pct = levelTotal > 0 ? Math.round((n / levelTotal) * 100) : 0
                    return (
                      <div key={l.level} className="ls__result-row">
                        <span className="hs__row-ico">{LEVEL_ICONS[i]}</span>
                        <span className="hs__row-lbl">{l.label}</span>
                        <div className="hs__bar">
                          <div className="hs__bar-fill" style={{ width: `${pct}%`, background: l.color }} />
                        </div>
                        <span className="hs__row-n">{n}</span>
                        <span className="hs__row-p">{pct}%</span>
                      </div>
                    )
                  })}
                  </div>
                </div>
                <div className="hs__result-footer">
                  {wrongWords.length > 0 ? (
                    <button className="ls__see-mistakes-btn" onClick={() => setShowMistakes(true)}>See mistakes</button>
                  ) : <span />}
                  <button className="hs__result-done" onClick={onBack}>✓ Fertig</button>
                </div>
              </div>
            </div>
          </main>
          {rightSidebar}
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="hs">
        <header className="hs__header">
          <div />
          <h1 className="hs__title">Study Mode</h1>
          <div />
        </header>
        <div className="hs__body">
          {sidebar}
          <main className="hs__main">
            <div className="ls__empty">
              <p>No active words!</p>
              <button onClick={onBack} style={{ fontSize: '1rem', padding: '10px 24px', borderRadius: '14px', marginTop: 16 }}>← Back</button>
            </div>
          </main>
          {rightSidebar}
        </div>
      </div>
    )
  }

  return (
    <div className="hs">
      {showExitConfirm && (
        <div className="ls__modal-overlay">
          <div className="ls__modal">
            <h3>End study session?</h3>
            <p>You will return to the start screen.</p>
            <div className="ls__modal-btns">
              <button className="ls__modal-btn--cancel" onClick={() => setShowExitConfirm(false)}>Continue</button>
              <button className="ls__modal-btn--confirm" onClick={onBack}>End Session</button>
            </div>
          </div>
        </div>
      )}

      <header className="hs__header">
        <div />
        <h1 className="hs__title">Study Mode</h1>
        <div />
      </header>

      <div className="hs__body">
        {sidebar}

        <main className="hs__main" style={{ justifyContent: 'center' }}>
          <div className="hs__quiz-wrap">
            <div className="hs__quiz-info-bar">
              <span className="hs__quiz-direction">{dirLabel}</span>
              <div className="ls__session-stats">
                <span className="ls__pill ls__pill--ok">{sessionStats.correct}</span>
                <span className="ls__pill ls__pill--err">{sessionStats.incorrect}</span>
              </div>
            </div>
            <div className={`hs__quiz-card${answered ? (feedback === 'correct' ? ' hs__quiz-card--ok' : (showCorrect ? '' : ' hs__quiz-card--err')) : ''}`}>
              <div className="hs__quiz-top">
                <p className="hs__quiz-word">
                  {currentDir === 'en' ? current.translations[0] : current.word}
                </p>
              </div>
              <div className="hs__quiz-divider" />
              <div className="hs__quiz-bot">
                {!answered ? (
                  <>
                    <input
                      ref={inputRef}
                      className="hs__quiz-input"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Your answer…"
                      autoComplete="off"
                      disabled={loading}
                    />
                    <button
                      className="hs__quiz-submit"
                      onClick={handleSubmit}
                      disabled={!input.trim() || loading}
                    >✓</button>
                  </>
                ) : (
                  <>
                    {feedback === 'correct' ? (
                      <p className="hs__quiz-answer hs__quiz-answer--ok">{input}</p>
                    ) : (
                      <p className="hs__quiz-answer hs__quiz-answer--err">
                        {showCorrect
                          ? <span className="hs__quiz-correct-reveal">{correctAnswer}</span>
                          : <s>{input}</s>
                        }
                      </p>
                    )}
                    {feedback === 'correct' ? (
                      <button className="hs__quiz-action-btn" onClick={handleSubmit}>Next -&gt;</button>
                    ) : (
                      <button className="hs__quiz-action-btn" onClick={() => showCorrect ? handleSubmit() : setShowCorrect(true)}>
                        {showCorrect ? 'Next ->' : 'See correct answer'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>

        {rightSidebar}
      </div>
    </div>
  )
}
