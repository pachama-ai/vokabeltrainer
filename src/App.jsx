import { useState, useEffect } from 'react'
import {
  isLoggedIn, getSavedUser, logout,
  checkDecay, getStats, getWords, submitAnswer, addWords,
} from './api/vocabApi'
import LoginScreen from './components/LoginScreen'
import CategoryScreen from './components/CategoryScreen'
import LearningScreen from './components/LearningScreen'
import AddWordsDialog from './components/AddWordsDialog'

// Screens: 'login' | 'categories' | 'add-words' | 'learning'

export default function App() {
  const [user, setUser]               = useState(null)
  const [screen, setScreen]           = useState('login')
  const [activeCategory, setCategory] = useState(null)

  // Daten für CategoryScreen
  const [allStats, setAllStats]         = useState(null)
  const [totalMastered, setMastered]    = useState(0)
  const [statsLoading, setStatsLoading] = useState(false)

  // Daten für LearningScreen / AddWordsDialog
  const [words, setWords]              = useState([])
  const [categoryCounts, setCounts]    = useState([0,0,0,0,0,0])
  const [availableCount, setAvailable] = useState(0)
  const [categoryLoading, setCatLoad]  = useState(false)

  // ── Beim Start: eingeloggter User? ───────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn()) {
      const savedUser = getSavedUser()
      setUser(savedUser)
      setScreen('categories')
      initAfterLogin()
    }
  }, [])

  async function initAfterLogin() {
    try { await checkDecay() } catch { /* ignorieren */ }
    loadAllStats()
  }

  // ── Statistik aller Kategorien laden ─────────────────────────────────────
  async function loadAllStats() {
    setStatsLoading(true)
    try {
      const [s1, s2, s3, total] = await Promise.all([
        getStats('grundwortschatz'),
        getStats('aufbauwortschatz'),
        getStats('unregelmaessige_verben'),
        getStats(),
      ])
      setAllStats({
        grundwortschatz:        { counts: s1.counts, total: s1.total },
        aufbauwortschatz:       { counts: s2.counts, total: s2.total },
        unregelmaessige_verben: { counts: s3.counts, total: s3.total },
      })
      setMastered(total.mastered)
    } catch { /* still ignorieren */ }
    finally { setStatsLoading(false) }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function handleLoginSuccess(userData) {
    setUser(userData)
    setScreen('categories')
    await initAfterLogin()
  }

  // ── Abmelden ─────────────────────────────────────────────────────────────
  function handleLogout() {
    logout()
    setUser(null)
    setAllStats(null)
    setScreen('login')
  }

  // ── Kategorie auswählen ───────────────────────────────────────────────────
  async function handleSelectCategory(category) {
    setCategory(category)
    setCatLoad(true)
    try {
      const [wordList, stats] = await Promise.all([
        getWords(category),
        getStats(category),
      ])
      setWords(wordList)
      setCounts(stats.counts)
      setAvailable(stats.counts[0])

      const active = stats.counts[1] + stats.counts[2] + stats.counts[3] + stats.counts[4]
      setScreen(active === 0 ? 'add-words' : 'learning')
    } catch (err) {
      alert('Fehler beim Laden: ' + err.message)
    } finally {
      setCatLoad(false)
    }
  }

  // ── Neue Wörter hinzufügen ────────────────────────────────────────────────
  async function handleAddWords(count) {
    try {
      await addWords(activeCategory, count)
      const [wordList, stats] = await Promise.all([
        getWords(activeCategory),
        getStats(activeCategory),
      ])
      setWords(wordList)
      setCounts(stats.counts)
      setScreen('learning')
    } catch (err) {
      alert('Fehler: ' + err.message)
    }
  }

  // ── Antwort einreichen ────────────────────────────────────────────────────
  async function handleAnswer(wordId, correct) {
    const result = await submitAnswer(wordId, correct)
    loadAllStats() // im Hintergrund aktualisieren
    return result
  }

  // ── Zurück zur Kategorieübersicht ─────────────────────────────────────────
  function goBack() {
    setScreen('categories')
    setCategory(null)
    loadAllStats()
  }

  // ── Rendering ─────────────────────────────────────────────────────────────
  if (screen === 'login') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />
  }

  if (screen === 'learning') {
    return (
      <LearningScreen
        category={activeCategory}
        words={words}
        counts={categoryCounts}
        onAnswer={handleAnswer}
        onBack={goBack}
      />
    )
  }

  if (screen === 'add-words') {
    return (
      <AddWordsDialog
        category={activeCategory}
        availableCount={availableCount}
        onConfirm={handleAddWords}
        onBack={goBack}
      />
    )
  }

  return (
    <CategoryScreen
      allStats={allStats}
      totalMastered={totalMastered}
      loading={statsLoading || categoryLoading}
      onSelectCategory={handleSelectCategory}
      onLogout={handleLogout}
    />
  )
}
