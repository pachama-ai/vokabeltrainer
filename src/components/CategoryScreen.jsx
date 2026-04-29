import { useState, useEffect, useRef } from 'react'
import { getDetailStats, getWords, submitAnswer } from '../api/vocabApi'
import { checkAnswer } from '../logic/learningEngine'
import { AvatarIcon, getAvatarIdx } from './avatars'
import './CategoryScreen.css'

const LEVELS = [
  { level: 1, label: 'Level 1', color: '#e87070' },
  { level: 2, label: 'Level 2', color: '#f0a055' },
  { level: 3, label: 'Level 3', color: '#f0d055' },
  { level: 4, label: 'Level 4', color: '#84c97e' },
  { level: 5, label: 'Level 5', color: '#68b0e2' },
]

const LEVEL_ICONS = [] // unused – kept for potential future use

const CAT_BTNS = [
  { id: 'a1',                     label: 'A1', color: '#5aab82' },
  { id: 'a2',                     label: 'A2', color: '#68b0e2' },
  { id: 'b1',                     label: 'B1', color: '#c4956a' },
  { id: 'b2',                     label: 'B2', color: '#b07891' },
  { id: 'unregelmaessige_verben', label: 'Irregular Verbs', color: '#9b73c0', img: '/irregular.png' },
]

const CAT_COLOR_MAP = {
  a1: '#5aab82',
  a2: '#68b0e2',
  b1: '#c4956a',
  b2: '#b07891',
  unregelmaessige_verben: '#9b73c0',
}
const DEFAULT_CAT_COLOR = '#8da0c0'

// Placeholder icon
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

const LEARN_LEVEL_COLORS = ['', '#e87070', '#f0a055', '#f0d055', '#84c97e', '#68b0e2']

const RetryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
)

const ACTION_BTNS = [
  { id: 'learn',   label: 'Learn',  img: '/learn.png',  color: '#5b9ec9' },
  { id: 'test',    label: 'Test',   img: '/test.png',   color: '#c0826e' },
  { id: 'manage',  label: 'Manage', img: '/manage.png', color: '#4ca87a' },
]

function RingChart({ pct, color, count, label }) {
  const r = 26
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="hs__ring-item">
      <svg width="66" height="66" viewBox="0 0 66 66">
        <circle cx="33" cy="33" r={r} fill="none" stroke="rgba(165,155,140,0.25)" strokeWidth="7" />
        <circle cx="33" cy="33" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 33 33)"
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <text x="33" y="33" textAnchor="middle" dominantBaseline="central"
          fontSize="13" fontWeight="700" fill="rgba(56,60,92,0.9)">{count}</text>
      </svg>
      <span className="hs__ring-lbl">{label}</span>
    </div>
  )
}

export default function CategoryScreen({ allStats, loading, onSelectCategory, onSettings, onAddCategory, onManage, customCats = [], onDeleteCategory }) {
  const [activeCatId, setActiveCatId] = useState(CAT_BTNS[0].id)
  const [view, setView] = useState('overview') // 'overview' | 'detail'
  const [detailStats, setDetailStats] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [avatarIdx] = useState(getAvatarIdx)

  // ── Test mode state ───────────────────────────────────────────────────────
  const [testMode, setTestMode]           = useState(false)
  const [testRunning, setTestRunning]     = useState(false)
  const [testResults, setTestResults]     = useState(null)
  const [testWordCountStr, setTestWordCountStr] = useState('35')
  const [testDirection, setTestDirection] = useState('both')
  const [testCats, setTestCats]           = useState([CAT_BTNS[0].id])
  const [testWords, setTestWords]         = useState([])
  const [testIndex, setTestIndex]         = useState(0)
  const [testInput, setTestInput]         = useState('')
  const [testAnswers, setTestAnswers]     = useState([])
  const [testLoading, setTestLoading]     = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const testInputRef = useRef(null)

  // ── Learn mode state ──────────────────────────────────────────────────────
  const [learnMode, setLearnMode]             = useState(false)
  const [learnNewCountStr, setLearnNewCountStr] = useState('10')
  const [learnTotalStr, setLearnTotalStr]     = useState('')
  const [learnDir, setLearnDir]               = useState('both')
  const [learnLevels, setLearnLevels]         = useState([1, 2, 3, 4, 5])
  const [deleteCatConfirm, setDeleteCatConfirm] = useState(null) // catId to confirm delete

  const allCatBtns = [
    ...CAT_BTNS,
    ...customCats.map(id => ({ id, label: id, icon: '📁' }))
  ]
  const activeCat = allCatBtns.find(c => c.id === activeCatId) ?? allCatBtns[0]
  const isTestActive = testMode || testRunning || testResults
  const isAnyActive  = isTestActive || learnMode

  useEffect(() => {
    if (view === 'detail') {
      setDetailStats(null)
      setDetailLoading(true)
      getDetailStats(activeCatId)
        .then(d => setDetailStats(d))
        .catch(() => {})
        .finally(() => setDetailLoading(false))
    }
  }, [view, activeCatId])

  useEffect(() => {
    if (testRunning) testInputRef.current?.focus()
  }, [testRunning, testIndex])

  // ── Test helpers ──────────────────────────────────────────────────────────
  function openTest() {
    setTestMode(true)
    setTestRunning(false)
    setTestResults(null)
    setTestAnswers([])
    setTestWordCountStr('35')
    setTestDirection('both')
    setTestCats([activeCatId])
  }

  async function startTestNow() {
    const count = Math.max(1, parseInt(testWordCountStr) || 20)
    setTestLoading(true)
    try {
      const lists = await Promise.all(testCats.map(c => getWords(c)))
      let pool = lists.flat().filter(w => w.level >= 1 && w.level <= 5)
      // shuffle + limit
      pool = pool.sort(() => Math.random() - 0.5).slice(0, count)
      setTestWords(pool)
      setTestIndex(0)
      setTestInput('')
      setTestAnswers([])
      setTestMode(false)
      setTestRunning(true)
    } catch (e) {
      alert('Error loading words: ' + e.message)
    } finally {
      setTestLoading(false)
    }
  }

  async function handleTestNext() {
    const word = testWords[testIndex]
    // determine prompt/answer based on direction
    let prompt, translations
    if (testDirection === 'en→de') {
      prompt = word.translations[0]
      translations = [word.word]
    } else {
      prompt = word.word
      translations = word.translations
    }
    const correct = checkAnswer(testInput, translations)
    const newAnswers = [...testAnswers, {
      word: prompt,
      expected: translations[0],
      given: testInput,
      correct,
    }]
    setTestAnswers(newAnswers)

    // submit to backend
    submitAnswer(word.id, correct).catch(() => {})

    if (testIndex + 1 >= testWords.length) {
      setTestRunning(false)
      setTestResults(newAnswers)
    } else {
      setTestIndex(i => i + 1)
      setTestInput('')
    }
  }

  function retryWrong() {
    const wrong = testResults.filter(a => !a.correct).map((a, i) => testWords.find(w => {
      const prompt = testDirection === 'en→de' ? w.translations[0] : w.word
      return prompt === a.word
    })).filter(Boolean)
    setTestWords(wrong)
    setTestIndex(0)
    setTestInput('')
    setTestAnswers([])
    setTestResults(null)
    setTestRunning(true)
  }

  function closeTest() {
    setTestMode(false)
    setTestRunning(false)
    setTestResults(null)
    setLearnMode(false)
    setShowCancelConfirm(false)
  }

  function handleCancelClick() {
    setShowCancelConfirm(true)
  }

  // ── Learn helpers ─────────────────────────────────────────────────────────
  function openLearn() {
    setLearnMode(true)
    setLearnNewCountStr('10')
    setLearnTotalStr('')
    setLearnDir('both')
    setLearnLevels([1, 2, 3, 4, 5])
  }

  function cycleLearnDir() {
    setLearnDir(d => d === 'de→en' ? 'en→de' : d === 'en→de' ? 'both' : 'de→en')
  }

  function toggleLearnLevel(lvl) {
    setLearnLevels(prev => {
      if (prev.includes(lvl)) {
        if (prev.length === 1) return prev  // mindestens 1 muss aktiv sein
        return prev.filter(x => x !== lvl)
      }
      return [...prev, lvl]
    })
  }

  function startLearnNow() {
    if (learnLevels.length === 0) {
      setShowCancelConfirm('level-warn')
      return
    }
    const settings = {
      newCount:  Math.max(0, parseInt(learnNewCountStr) || 0),
      total:     learnTotalStr === '' ? null : (parseInt(learnTotalStr) || null),
      direction: learnDir === 'de→en' ? ['de'] : learnDir === 'en→de' ? ['en'] : ['de', 'en'],
      levels:    learnLevels,
    }
    setLearnMode(false)
    onSelectCategory(activeCatId, settings)
  }

  // ── current test word ─────────────────────────────────────────────────────
  const currentTestWord = testRunning ? testWords[testIndex] : null
  const testPrompt = currentTestWord
    ? (testDirection === 'en→de' ? currentTestWord.translations[0] : currentTestWord.word)
    : ''

  return (
    <div className="hs">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="hs__header">
        <div className="hs__header-left">
          <button
            className="hs__arrow"
            onClick={() => !isAnyActive && setView(v => v === 'overview' ? 'detail' : 'overview')}
            aria-label="Statistikansicht wechseln"
            style={isAnyActive ? { opacity: 0, pointerEvents: 'none' } : {}}
          >‹</button>
        </div>
        <h1 className="hs__title">
          {learnMode ? 'Study Mode'
            : isTestActive ? 'Vocabulary Test'
            : <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                {activeCat.img && <img src={activeCat.img} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />}
                {activeCat.label} — Leitner Box
              </span>}
        </h1>
        <div className="hs__streak" style={isAnyActive ? { opacity: 0 } : {}}>🔥 <span>0 Days</span></div>
      </header>

      {/* ── Body: 3 columns ─────────────────────────────── */}
      <div className="hs__body">

        {/* Left sidebar – categories */}
        <aside className={`hs__side${isAnyActive ? ' hs__side--locked' : ''}`}>
          <div className="hs__mascot-wrap">
            <button className="hs__mascot-btn" onClick={onSettings} title="Settings">
              <AvatarIcon idx={avatarIdx} size={72} />
            </button>
            <span className="hs__mascot-lbl">Settings</span>
          </div>

          <div className="hs__cat-list">
            {allCatBtns.map(cat => {
              const isCustom = customCats.includes(cat.id)
              const isActive = activeCatId === cat.id
              return (
                <button
                  key={cat.id}
                  className={`hs__cat-btn${isActive ? ' hs__cat-btn--on' : ''}`}
                  style={{
                    background: cat.color ?? DEFAULT_CAT_COLOR,
                    ...(isActive ? {
                      outline: `3px solid ${cat.color ?? DEFAULT_CAT_COLOR}`,
                      outlineOffset: '3px',
                    } : {})
                  }}
                  onClick={() => setActiveCatId(cat.id)}
                  onContextMenu={isCustom ? (e) => { e.preventDefault(); setDeleteCatConfirm(cat.id) } : undefined}
                  title={cat.label}
                >{cat.img
                  ? <img src={cat.img} alt={cat.label} style={{ width: 50, height: 50, objectFit: 'contain' }} />
                  : <span style={{ fontSize: cat.label.length <= 2 ? 17 : 11, fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1.1, textAlign: 'center', color: 'rgba(255,255,255,0.95)' }}>{cat.label}</span>
                }</button>
              )
            })}
          </div>

          <div className="hs__add-btn-wrap">
            <button className="hs__cat-btn hs__add-btn" title="Add category" onClick={onAddCategory}>+</button>
          </div>
        </aside>

        {/* Main content */}
        <main className="hs__main">

          {/* ── LEARN SETUP ── */}
          {learnMode && (
            <div className="hs__test-card">
              <div className="hs__test-header-row">
                <span className="hs__test-section-title">Study Settings</span>
              </div>

              {/* New Words */}
              <div className="hs__test-row">
                <div className="hs__learn-label-wrap">
                  <span className="hs__test-row-label">New Words</span>
                  <span className="hs__learn-hint">Unknown words added to your session</span>
                </div>
                <input
                  className="hs__test-num-input"
                  type="number"
                  min={0} max={200}
                  value={learnNewCountStr}
                  onChange={e => setLearnNewCountStr(e.target.value)}
                />
              </div>
              <div className="hs__test-divider" />

              {/* Total */}
              <div className="hs__test-row">
                <div className="hs__learn-label-wrap">
                  <span className="hs__test-row-label">Total</span>
                  <span className="hs__learn-hint">How many words to study this session</span>
                </div>
                <div className="hs__learn-total-wrap">
                  {learnTotalStr === '' ? (
                    <button className="hs__test-dir-btn" onClick={() => setLearnTotalStr('20')}>
                      <em>All</em>
                    </button>
                  ) : (
                    <input
                      className="hs__test-num-input"
                      type="number"
                      min={1} max={500}
                      value={learnTotalStr}
                      onChange={e => setLearnTotalStr(e.target.value)}
                      onBlur={() => { if (!learnTotalStr) setLearnTotalStr('') }}
                    />
                  )}
                  {learnTotalStr !== '' && (
                    <button className="hs__learn-all-btn" onClick={() => setLearnTotalStr('')}>All</button>
                  )}
                </div>
              </div>
              <div className="hs__test-divider" />

              {/* Direction */}
              <div className="hs__test-row">
                <div className="hs__learn-label-wrap">
                  <span className="hs__test-row-label">Direction</span>
                  <span className="hs__learn-hint">Which language is shown as the prompt</span>
                </div>
                <button className="hs__test-dir-btn" onClick={cycleLearnDir}>
                  {learnDir === 'de→en' ? 'DE → EN'
                    : learnDir === 'en→de' ? 'EN → DE'
                    : 'DE ↔ EN'}
                </button>
              </div>
              <div className="hs__test-divider" />

              {/* Level Selection */}
              <div className="hs__learn-level-section">
                <div className="hs__learn-label-wrap">
                  <span className="hs__test-row-label">Level</span>
                  <span className="hs__learn-hint">Only include words at these difficulty levels</span>
                </div>
                <div className="hs__learn-levels">
                  {LEVELS.map(l => {
                    const on = learnLevels.includes(l.level)
                    return (
                      <button
                        key={l.level}
                        className={`hs__lvl-btn${on ? ' hs__lvl-btn--on' : ''}`}
                        style={on
                          ? { borderColor: l.color, background: l.color + '22', color: l.color }
                          : { borderColor: 'rgba(150,140,120,0.3)', background: 'transparent', color: 'rgba(120,120,120,0.6)' }
                        }
                        onClick={() => toggleLearnLevel(l.level)}
                      >
                        <span className="hs__lvl-dot" style={{ background: on ? l.color : 'rgba(150,140,120,0.3)' }} />
                        <span className="hs__lvl-num">{l.level}</span>
                      </button>
                    )
                  })}
                </div>
                <button
                  className="hs__learn-start-btn"
                  onClick={startLearnNow}
                  disabled={learnLevels.length === 0}
                >
                  Start Studying
                </button>
              </div>
            </div>
          )}

          {/* ── TEST SETUP ── */}
          {testMode && (
            <div className="hs__test-card">
              <div className="hs__test-header-row">
                <span className="hs__test-section-title">Test Setup</span>
              </div>

              {/* Number of Words */}
              <div className="hs__test-row">
                <span className="hs__test-row-label">Number of Words</span>
                <input
                  className="hs__test-num-input"
                  type="number"
                  min={1}
                  max={500}
                  value={testWordCountStr}
                  onChange={e => setTestWordCountStr(e.target.value)}
                />
              </div>
              <div className="hs__test-divider" />

              {/* Translation Direction */}
              <div className="hs__test-row">
                <span className="hs__test-row-label">Translation Direction</span>
                <button
                  className="hs__test-dir-btn"
                  onClick={() => setTestDirection(d =>
                    d === 'de→en' ? 'en→de' : d === 'en→de' ? 'both' : 'de→en'
                  )}
                >
                  {testDirection === 'de→en' ? 'DE → EN'
                    : testDirection === 'en→de' ? 'EN → DE'
                    : 'DE ↔ EN'}
                </button>
              </div>
              <div className="hs__test-divider" />

              {/* Category Selection */}
              <div className="hs__test-cat-section">
                <span className="hs__test-row-label">Category Selection</span>
                <div className="hs__test-cat-circles">
                  {allCatBtns.map(c => (
                    <button
                      key={c.id}
                      className="hs__test-cat-circle"
                      title={c.label}
                      style={{
                        background: c.color ?? 'rgba(142, 154, 196, 0.38)',
                        outline: testCats.includes(c.id) ? '3px solid #fff' : '3px solid transparent',
                        outlineOffset: '3px',
                        boxShadow: testCats.includes(c.id) ? '0 0 0 5px rgba(255,255,255,0.35)' : 'none',
                        opacity: testCats.includes(c.id) ? 1 : 0.55,
                      }}
                      onClick={() => setTestCats(prev =>
                        prev.includes(c.id)
                          ? prev.length > 1 ? prev.filter(x => x !== c.id) : prev
                          : [...prev, c.id]
                      )}
                    >{c.img
                      ? <img src={c.img} alt={c.label} style={{ width: 50, height: 50, objectFit: 'contain' }} />
                      : <PlaceholderIcon />}</button>
                  ))}
                </div>
                <button
                  className="hs__test-confirm-btn"
                  onClick={startTestNow}
                  disabled={testLoading}
                >✓</button>
              </div>
            </div>
          )}

          {/* ── TEST RUNNING ── */}
          {testRunning && currentTestWord && (
            <div className="hs__quiz-wrap">
              <div className="hs__quiz-info-bar">
                <span className="hs__quiz-direction">
                  {testDirection === 'de→en' ? 'DE → EN'
                    : testDirection === 'en→de' ? 'EN → DE'
                    : 'DE ↔ EN'}
                </span>
                <span className="hs__quiz-counter">{testIndex + 1}/{testWords.length}</span>
              </div>
              <div className="hs__quiz-card">
                <div className="hs__quiz-top">
                  <p className="hs__quiz-word">{testPrompt}</p>
                </div>
                <div className="hs__quiz-divider" />
                <div className="hs__quiz-bot">
                  <input
                    ref={testInputRef}
                    className="hs__quiz-input"
                    value={testInput}
                    onChange={e => setTestInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && testInput.trim() && handleTestNext()}
                    placeholder="Your answer…"
                    autoComplete="off"
                  />
                  <button
                    className="hs__quiz-submit"
                    onClick={handleTestNext}
                    disabled={!testInput.trim()}
                  >✓</button>
                </div>
              </div>
            </div>
          )}

          {/* ── TEST RESULTS ── */}
          {testResults && (() => {
            const correct = testResults.filter(a => a.correct).length
            const total = testResults.length
            const pct = Math.round((correct / total) * 100)
            const msg = pct === 100 ? 'PERFECT!' : pct >= 70 ? 'GREAT JOB!' : 'KEEP TRYING!'
            return (
              <div className="hs__quiz-wrap">
                <div className="hs__quiz-info-bar">
                  <span className="hs__quiz-direction">
                    {testDirection === 'de→en' ? 'DE → EN'
                      : testDirection === 'en→de' ? 'EN → DE'
                      : 'DE ↔ EN'}
                  </span>
                  <span className="hs__quiz-counter">{total}/{total}</span>
                </div>
                <div className="hs__result-card">
                  <div className="hs__result-body">
                    <div className="hs__result-avatar-wrap">
                      <AvatarIcon idx={avatarIdx} size={96} />
                      {Array.from({ length: 22 }).map((_, i) => (
                        <div
                          key={i}
                          className="hs__result-star"
                          style={{ '--angle': `${(i / 22) * 360}deg`, '--delay': `${i * 0.05}s` }}
                        >★</div>
                      ))}
                    </div>
                    <p className="hs__result-msg">{msg}</p>
                    <p className="hs__result-score">
                      <span className="hs__result-score-n">{correct}</span>
                      <span className="hs__result-score-d">/{total}</span>
                    </p>
                  </div>
                  <div className="hs__result-footer">
                    {testResults.some(a => !a.correct) ? (
                      <button className="hs__result-retry" onClick={retryWrong}>
                        <RetryIcon /> Retry Mistakes
                      </button>
                    ) : <span />}
                    <button className="hs__result-done" onClick={closeTest}>✓ Done</button>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ── NORMAL OVERVIEW / DETAIL ── */}
          {!isAnyActive && (
            view === 'overview' ? (
              <div className="hs__ov">
                {(() => {
                  const s = allStats?.[activeCatId]
                  const counts = s?.counts ?? [0,0,0,0,0,0]
                  const levelCounts = LEVELS.map(l => counts[l.level] ?? 0)
                  const total = levelCounts.reduce((a, b) => a + b, 0)
                  const mastered = (levelCounts[3] ?? 0) + (levelCounts[4] ?? 0)
                  const masteryPct = total > 0 ? Math.round((mastered / total) * 100) : 0
                  return (
                    <>
                      <div className="hs__ov-summary">
                        <span className="hs__ov-total">{total} words</span>
                        <span className="hs__ov-mastery" style={{ color: masteryPct >= 50 ? '#4ca87a' : '#c0826e' }}>
                          {masteryPct}% mastered
                        </span>
                      </div>
                      <div className="hs__rings">
                        {LEVELS.map((l, i) => {
                          const pct = total > 0 ? (levelCounts[i] / total) * 100 : 0
                          return <RingChart key={l.level} pct={pct} color={l.color} count={levelCounts[i]} label={l.label} />
                        })}
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="hs__det">
                <div className="hs__panel">
                  <p className="hs__panel-ttl">Top 10 Failures</p>
                  {detailLoading && <p className="hs__panel-empty">Loading…</p>}
                  {!detailLoading && !detailStats && <p className="hs__panel-empty">Could not load data.</p>}
                  {!detailLoading && detailStats && (
                    detailStats.top_failures.length === 0
                      ? <p className="hs__panel-empty">No mistakes yet — keep it up!</p>
                      : <ol className="hs__fail-list">
                          {detailStats.top_failures.map((f, i) => (
                            <li key={i} className="hs__fail-row">
                              <span className="hs__fail-n">{i + 1}.</span>
                              <span className="hs__fail-word">{f.word}</span>
                              <span className="hs__fail-trans">{f.translation}</span>
                              <span className="hs__fail-count">{f.wrong_count}×</span>
                            </li>
                          ))}
                        </ol>
                  )}
                </div>
                <div className="hs__panel">
                  <p className="hs__panel-ttl">Average Learning Time</p>
                  {detailLoading && <p className="hs__panel-empty">Loading…</p>}
                  {!detailLoading && !detailStats && <p className="hs__panel-empty">Could not load data.</p>}
                  {!detailLoading && detailStats && (
                    !detailStats.avg_time
                      ? <p className="hs__panel-empty">Not enough data yet.</p>
                      : <div className="hs__avg-wrap">
                          <p className="hs__avg-num">
                            {detailStats.avg_time.minutes < 60
                              ? `${detailStats.avg_time.minutes} min`
                              : `${(detailStats.avg_time.minutes / 60).toFixed(1)} h`}
                          </p>
                          <p className="hs__avg-sub">Avg. session duration</p>
                          <p className="hs__avg-meta">{detailStats.avg_time.session_count} sessions · {detailStats.avg_time.total_cards} cards</p>
                        </div>
                  )}
                </div>
              </div>
            )
          )}
        </main>

        {/* Right sidebar – actions */}
        <aside className={`hs__side hs__side--r${isAnyActive ? ' hs__side--r-test' : ''}`}>
          {ACTION_BTNS.map(({ id, label, img, color }) => (
            isAnyActive ? (
              <button key={id} className="hs__action-btn hs__action-btn--dim" disabled title={label} style={{ background: color }}>
                <img src={img} alt={label} style={{ width: 60, height: 60, objectFit: 'contain' }} />
              </button>
            ) : (
              <button
                key={id}
                className="hs__action-btn"
                title={label}
                style={{ background: color }}
                onClick={() => {
                  if (id === 'learn')  openLearn()
                  if (id === 'test')   openTest()
                  if (id === 'manage') onManage?.(activeCatId)
                }}
              >
                <img src={img} alt={label} style={{ width: 60, height: 60, objectFit: 'contain' }} />
                <span className="hs__action-lbl">{label}</span>
              </button>
            )
          ))}
          {isAnyActive && (
            <>
              <div className="hs__side-spacer" />
              <button className="hs__cancel-btn" onClick={handleCancelClick} title="Cancel">✕</button>
            </>
          )}
        </aside>
      </div>



      {/* ── Delete category confirmation ── */}
      {deleteCatConfirm && (
        <div className="hs__overlay">
          <div className="hs__confirm-box">
            <p className="hs__confirm-msg">
              Delete Category?<br/>
              <span>All words in «{deleteCatConfirm}» will be permanently deleted.</span>
            </p>
            <div className="hs__confirm-btns">
              <button className="hs__confirm-no" onClick={() => setDeleteCatConfirm(null)}>Cancel</button>
              <button
                className="hs__confirm-yes"
                onClick={async () => {
                  const catId = deleteCatConfirm
                  setDeleteCatConfirm(null)
                  if (activeCatId === catId) setActiveCatId(allCatBtns[0]?.id ?? null)
                  await onDeleteCategory?.(catId)
                }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel confirmation popup ── */}
      {showCancelConfirm === 'level-warn' ? (
        <div className="hs__overlay">
          <div className="hs__confirm-box">
            <p className="hs__confirm-msg">No level selected!<br/><span>Please select at least one level.</span></p>
            <div className="hs__confirm-btns">
              <button className="hs__confirm-no" onClick={() => setShowCancelConfirm(false)}>OK</button>
            </div>
          </div>
        </div>
      ) : showCancelConfirm && (
        <div className="hs__overlay">
          <div className="hs__confirm-box">
            <p className="hs__confirm-msg">
              {learnMode ? 'End study session?' : 'Cancel the test?'}<br/>
              <span>{learnMode ? 'You will return to the start screen.' : 'Your progress will be lost.'}</span>
            </p>
            <div className="hs__confirm-btns">
              <button className="hs__confirm-no"  onClick={() => setShowCancelConfirm(false)}>Continue</button>
              <button className="hs__confirm-yes" onClick={closeTest}>{learnMode ? 'End Session' : 'Cancel Test'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
