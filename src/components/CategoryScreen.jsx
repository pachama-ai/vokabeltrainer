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
  { id: 'grundwortschatz',        label: 'Basic Vocabulary',    icon: '🏠', color: '#c4956a' },
  { id: 'aufbauwortschatz',       label: 'Advanced Vocabulary', icon: '📚', color: '#5aab82' },
  { id: 'unregelmaessige_verben', label: 'Irregular Verbs',     icon: '⚡', color: '#b07891' },
]

const CAT_COLOR_MAP = {
  grundwortschatz: '#c4956a',
  aufbauwortschatz: '#5aab82',
  unregelmaessige_verben: '#b07891',
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
  { id: 'learn',   label: 'Learn',  Icon: LearnIcon,  color: '#5b9ec9' },
  { id: 'test',    label: 'Test',   Icon: TestIcon,   color: '#c0826e' },
  { id: 'manage',  label: 'Manage', Icon: ManageIcon, color: '#9a8e5e' },
]

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
    setLearnLevels([])
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
            : `${activeCat.label} — Leitner Box`}
        </h1>
        <div className="hs__streak" style={isAnyActive ? { opacity: 0 } : {}}>🔥 <span>0 Days</span></div>
      </header>

      {/* ── Body: 3 columns ─────────────────────────────── */}
      <div className="hs__body">

        {/* Left sidebar – categories */}
        <aside className={`hs__side${isAnyActive ? ' hs__side--locked' : ''}`}>
          <div className="hs__mascot-wrap">
            <button className="hs__mascot-btn" onClick={onSettings} title="Settings">
              <AvatarIcon idx={avatarIdx} size={36} />
            </button>
            <span className="hs__mascot-lbl">Home</span>
          </div>

          {allCatBtns.map(cat => {
            const isCustom = customCats.includes(cat.id)
            return (
              <button
                key={cat.id}
                className={`hs__cat-btn${activeCatId === cat.id ? ' hs__cat-btn--on' : ''}`}
                style={{ background: cat.color ?? DEFAULT_CAT_COLOR }}
                onClick={() => setActiveCatId(cat.id)}
                onContextMenu={isCustom ? (e) => { e.preventDefault(); setDeleteCatConfirm(cat.id) } : undefined}
                title={cat.label}
              ><PlaceholderIcon /></button>
            )
          })}

          <div className="hs__side-spacer" />
          <button className="hs__cat-btn hs__add-btn" title="Add category" onClick={onAddCategory}>+</button>
        </aside>

        {/* Main content */}
        <main className="hs__main">

          {/* ── LEARN SETUP ── */}
          {learnMode && (
            <div className="hs__test-card">
              <div className="hs__test-header-row">
                <span className="hs__test-section-title">Study Mode Setup</span>
              </div>

              {/* Number of New Words */}
              <div className="hs__test-row">
                <span className="hs__test-row-label">Number of New Words</span>
                <input
                  className="hs__test-num-input"
                  type="number"
                  min={0} max={200}
                  value={learnNewCountStr}
                  onChange={e => setLearnNewCountStr(e.target.value)}
                />
              </div>
              <div className="hs__test-divider" />

              {/* Total Number of Words */}
              <div className="hs__test-row">
                <span className="hs__test-row-label">Total Number of Words</span>
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

              {/* Translation Direction */}
              <div className="hs__test-row">
                <span className="hs__test-row-label">Translation Direction</span>
                <button className="hs__test-dir-btn" onClick={cycleLearnDir}>
                  {learnDir === 'de→en' ? 'Deutsch → Englisch'
                    : learnDir === 'en→de' ? 'Englisch → Deutsch'
                    : 'Deutsch ↔ Englisch'}
                </button>
              </div>
              <div className="hs__test-divider" />

              {/* Level Selection */}
              <div className="hs__test-cat-section">
                <span className="hs__test-row-label">Level Selection</span>
                <div className="hs__test-cat-circles">
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <button
                      key={lvl}
                      className={`hs__level-circle${learnLevels.includes(lvl) ? ' hs__level-circle--on' : ''}`}
                      style={learnLevels.includes(lvl)
                        ? { background: LEARN_LEVEL_COLORS[lvl], borderColor: LEARN_LEVEL_COLORS[lvl], color: '#fff', transform: 'scale(1.12)', boxShadow: `0 0 14px 4px ${LEARN_LEVEL_COLORS[lvl]}88` }
                        : { background: LEARN_LEVEL_COLORS[lvl] + '33', borderColor: LEARN_LEVEL_COLORS[lvl] + 'aa', color: LEARN_LEVEL_COLORS[lvl] }
                      }
                      onClick={() => toggleLearnLevel(lvl)}
                    >{lvl}</button>
                  ))}
                </div>
                <button className="hs__test-confirm-btn" onClick={startLearnNow} disabled={learnLevels.length === 0} style={learnLevels.length === 0 ? { opacity: 0.3, cursor: 'default' } : {}}>✓</button>
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
                  {testDirection === 'de→en' ? 'Deutsch → Englisch'
                    : testDirection === 'en→de' ? 'Englisch → Deutsch'
                    : 'Deutsch ↔ Englisch'}
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
                      className={`hs__test-cat-circle${testCats.includes(c.id) ? ' hs__test-cat-circle--on' : ''}`}
                      title={c.label}
                      onClick={() => setTestCats(prev =>
                        prev.includes(c.id)
                          ? prev.length > 1 ? prev.filter(x => x !== c.id) : prev
                          : [...prev, c.id]
                      )}
                    ><PlaceholderIcon /></button>
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
                  {testDirection === 'de→en' ? 'Deutsch → Englisch'
                    : testDirection === 'en→de' ? 'Englisch → Deutsch'
                    : 'Deutsch ↔ Englisch'}
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
            const msg = pct === 100 ? 'PERFEKT!' : pct >= 70 ? 'GUT GEMACHT!' : 'WEITER ÜBEN!'
            return (
              <div className="hs__quiz-wrap">
                <div className="hs__quiz-info-bar">
                  <span className="hs__quiz-direction">
                    {testDirection === 'de→en' ? 'Deutsch → Englisch'
                      : testDirection === 'en→de' ? 'Englisch → Deutsch'
                      : 'Deutsch ↔ Englisch'}
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
                        <RetryIcon /> Falsche wiederholen
                      </button>
                    ) : <span />}
                    <button className="hs__result-done" onClick={closeTest}>✓ Fertig</button>
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
                  return LEVELS.map((l, i) => {
                    const n = levelCounts[i]
                    const pct = total > 0 ? Math.round((n / total) * 100) : 0
                    return (
                      <div key={l.level} className="hs__row">
                        <span className="hs__row-lbl">{l.label}</span>
                        <div className="hs__bar">
                          <div className="hs__bar-fill" style={{ width: `${pct}%`, background: l.color }} />
                        </div>
                        <span className="hs__row-n">{n}</span>
                        <span className="hs__row-p">{pct}%</span>
                      </div>
                    )
                  })
                })()}
              </div>
            ) : (
              <div className="hs__det">
                <div className="hs__panel">
                  <p className="hs__panel-ttl">Top 10 Failures</p>
                  {detailLoading && <p className="hs__panel-empty">Loading…</p>}
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
          {ACTION_BTNS.map(({ id, label, Icon, color }) => (
            isAnyActive ? (
              <button key={id} className="hs__action-btn hs__action-btn--dim" disabled title={label} style={{ background: color }}>
                <Icon />
                <span className="hs__action-lbl">{label}</span>
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
                <Icon />
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
              Kategorie löschen?<br/>
              <span>Alle Wörter in «{deleteCatConfirm}» werden unwiderruflich gelöscht.</span>
            </p>
            <div className="hs__confirm-btns">
              <button className="hs__confirm-no" onClick={() => setDeleteCatConfirm(null)}>Abbrechen</button>
              <button
                className="hs__confirm-yes"
                onClick={async () => {
                  const catId = deleteCatConfirm
                  setDeleteCatConfirm(null)
                  if (activeCatId === catId) setActiveCatId(allCatBtns[0]?.id ?? null)
                  await onDeleteCategory?.(catId)
                }}
              >Löschen</button>
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
