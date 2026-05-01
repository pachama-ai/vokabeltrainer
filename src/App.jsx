import { useState, useEffect } from 'react'
import {
  isLoggedIn, logout,
  checkDecay, getStats, getWords, submitAnswer, addWords, getCategories, deleteCategory,
} from './api/vocabApi'
import LoginScreen from './components/LoginScreen'
import CategoryScreen from './components/CategoryScreen'
import LearningScreen from './components/LearningScreen'
import AddWordsDialog from './components/AddWordsDialog'
import SettingsScreen from './components/SettingsScreen'
import AddCategoryScreen from './components/AddCategoryScreen'
import VocabManagerScreen from './components/VocabManagerScreen'

// Screens: 'login' | 'categories' | 'add-words' | 'learning' | 'settings'
const BUILTIN_CATS = 'abcdefghijklmnopqrstuvwxyz'.split('')

export default function App() {
  const [screen, setScreen]           = useState('login')
  const [activeCategory, setCategory] = useState(null)

  // Daten für CategoryScreen
  const [allStats, setAllStats]         = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [customCats, setCustomCats]     = useState([]) // extra Kategorien aus DB
  const [daysStreak, setDaysStreak]     = useState(0)

  // Daten für LearningScreen / AddWordsDialog
  const [words, setWords]              = useState([])
  const [categoryCounts, setCounts]    = useState([0,0,0,0,0,0])
  const [availableCount, setAvailable] = useState(0)
  const [categoryLoading, setCatLoad]  = useState(false)
  const [learnSettings, setLearnSettings] = useState(null)
  const [manageInitialCat, setManageInitialCat] = useState('all')

  // ── Beim Start: eingeloggter User? ───────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn()) {
      setScreen('categories')
      initAfterLogin()
    }
  }, [])

  async function initAfterLogin() {
    try { await checkDecay() } catch (err) {
      if (err?.status === 401) { handleLogout(); return }
    }
    loadAllStats()
  }

  // ── Statistik aller Kategorien laden ─────────────────────────────────────
  async function loadAllStats() {
    setStatsLoading(true)
    try {
      const [catRes, globalStats, ...builtinStats] = await Promise.all([
        getCategories(),
        getStats(),  // ohne category = globale Stats inkl. days_streak
        ...BUILTIN_CATS.map(c => getStats(c)),
      ])

      setDaysStreak(globalStats.days_streak ?? 0)

      const extras = (catRes.categories ?? []).filter(c => !BUILTIN_CATS.includes(c))
      setCustomCats(extras)

      const stats = {}
      BUILTIN_CATS.forEach((c, i) => {
        stats[c] = { counts: builtinStats[i].counts, total: builtinStats[i].total }
      })
      // Stats für custom Kategorien laden
      if (extras.length > 0) {
        const extraStats = await Promise.all(extras.map(c => getStats(c)))
        extras.forEach((c, i) => {
          stats[c] = { counts: extraStats[i].counts, total: extraStats[i].total }
        })
      }

      setAllStats(stats)
    } catch (err) {
      if (err?.status === 401) { handleLogout(); return }
    } finally { setStatsLoading(false) }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function handleLoginSuccess() {
    setScreen('categories')
    await initAfterLogin()
  }

  // ── Abmelden ─────────────────────────────────────────────────────────────
  function handleLogout() {
    logout()
    setAllStats(null)
    setScreen('login')
  }

  // ── Einstellungen ───────────────────────────────────────────────────────
  function handleSettings() {
    setScreen('settings')
  }

  function handleBackFromSettings() {
    setScreen('categories')
  }

  // ── Kategorie auswählen ───────────────────────────────────────────────────
  async function handleSelectCategory(category, settings = null) {
    setCategory(category)
    setLearnSettings(settings)
    setCatLoad(true)
    try {
      // Neue Wörter hinzufügen falls gewünscht
      if (settings?.newCount > 0) {
        await addWords(category, settings.newCount)
      }
      const [wordList, stats] = await Promise.all([
        getWords(category),
        getStats(category),
      ])
      setWords(wordList)
      setCounts(stats.counts)
      setAvailable(stats.counts[0])

      const active = stats.counts[1] + stats.counts[2] + stats.counts[3] + stats.counts[4] + stats.counts[5]
      setScreen(active === 0 ? 'add-words' : 'learning')
    } catch (err) {
      if (err?.status === 401) { handleLogout(); return }
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
  // ── Kategorie löschen ─────────────────────────────────────────────────────
  async function handleDeleteCategory(catId) {
    try {
      await deleteCategory(catId)
      await loadAllStats()
    } catch (err) {
      if (err?.status === 401) { handleLogout(); return }
      alert('Fehler beim Löschen: ' + (err?.message ?? 'Unbekannter Fehler'))
    }
  }
  // ── Rendering ─────────────────────────────────────────────────────────────
  if (screen === 'login') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />
  }

  if (screen === 'settings') {
    return <SettingsScreen onBack={handleBackFromSettings} onLogout={handleLogout} />
  }

  if (screen === 'learning') {
    return (
      <LearningScreen
        category={activeCategory}
        words={words}
        counts={categoryCounts}
        onAnswer={handleAnswer}
        onBack={goBack}
        learnSettings={learnSettings}
        activeCatId={activeCategory}
        onSettings={handleSettings}
        customCats={customCats}
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

  if (screen === 'manage') {
    return (
      <VocabManagerScreen
        initialCategory={manageInitialCat}
        customCats={customCats}
        onBack={() => { setScreen('categories'); loadAllStats() }}
        onSettings={handleSettings}
      />
    )
  }

  if (screen === 'add-category') {
    return (
      <AddCategoryScreen
        onBack={() => setScreen('categories')}
        onSettings={handleSettings}
        onSelectCategory={handleSelectCategory}
        onManage={() => { setManageInitialCat('all'); setScreen('manage') }}
        customCats={customCats}
        onSaved={async (categoryName) => {
          setScreen('categories')
          await loadAllStats()
        }}
      />
    )
  }

  return (
    <CategoryScreen
      allStats={allStats}
      loading={statsLoading || categoryLoading}
      customCats={customCats}
      daysStreak={daysStreak}
      onSelectCategory={handleSelectCategory}
      onSettings={handleSettings}
      onAddCategory={() => setScreen('add-category')}
      onManage={(cat) => { setManageInitialCat(cat); setScreen('manage') }}
      onDeleteCategory={handleDeleteCategory}
    />
  )
}
