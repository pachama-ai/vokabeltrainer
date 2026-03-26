import { useState, useRef, useEffect } from 'react'
import { AvatarIcon, getAvatarIdx } from './avatars'
import { createCategory } from '../api/vocabApi'
import './CategoryScreen.css'

const BUILTIN_CATS = [
  { id: 'grundwortschatz',        label: 'Basic Vocabulary',    img: '/grundwortschatz.png',  color: '#c4956a' },
  { id: 'aufbauwortschatz',       label: 'Advanced Vocabulary', img: '/aufbauwortschatz.png', color: '#5aab82' },
  { id: 'unregelmaessige_verben', label: 'Irregular Verbs',     img: '/irregular.png',        color: '#b07891' },
]

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
const PencilIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
)

const ACTION_BTNS = [
  { id: 'learn',  label: 'Learn',  img: '/learn.png',  color: '#5b9ec9' },
  { id: 'test',   label: 'Test',   img: '/test.png',   color: '#c0826e' },
  { id: 'manage', label: 'Manage', img: '/manage.png', color: '#4ca87a' },
]

const TOTAL_ROWS = 8
let _id = 1
function genId() { return `w${_id++}` }

export default function AddCategoryScreen({ onBack, onSaved, onSettings, onSelectCategory, onManage, customCats = [] }) {
  const [avatarIdx]  = useState(getAvatarIdx)
  const [setName, setSetNameState] = useState('')
  const [words, setWords]          = useState([])
  const [editingId, setEditingId]  = useState(null)
  const [editDe, setEditDe]        = useState('')
  const [editEn, setEditEn]        = useState('')
  const [saving, setSaving]        = useState(false)
  const [error, setError]          = useState(null)
  const editDeRef = useRef(null)

  useEffect(() => {
    if (editingId) editDeRef.current?.focus()
  }, [editingId])

  function addWord() {
    if (editingId) return // already editing
    const id = genId()
    setWords(prev => [...prev, { id, de: '', en: '' }])
    setEditDe('')
    setEditEn('')
    setEditingId(id)
  }

  function startEdit(w) {
    setEditDe(w.de)
    setEditEn(w.en)
    setEditingId(w.id)
  }

  function confirmEdit() {
    if (!editDe.trim() && !editEn.trim()) {
      setWords(prev => prev.filter(w => w.id !== editingId))
    } else {
      setWords(prev => prev.map(w =>
        w.id === editingId ? { ...w, de: editDe.trim(), en: editEn.trim() } : w
      ))
    }
    setEditingId(null)
  }

  function cancelEdit() {
    setWords(prev => prev.filter(w => !(w.id === editingId && !w.de && !w.en)))
    setEditingId(null)
  }

  function deleteWord(id) {
    setWords(prev => prev.filter(w => w.id !== id))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter')  confirmEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  async function handleSave() {
    if (!setName.trim()) { setError('Bitte einen Set-Namen eingeben.'); return }
    const saved = words.filter(w => w.de && w.en)
    if (saved.length === 0) { setError('Bitte mindestens eine Vokabel hinzufügen.'); return }
    setSaving(true)
    setError(null)
    try {
      await createCategory(setName.trim(), saved.map(w => ({ de: w.de, en: w.en })))
      onSaved(setName.trim())
    } catch (err) {
      setError(err.message ?? 'Fehler beim Speichern.')
      setSaving(false)
    }
  }

  const allCatBtns = [
    ...BUILTIN_CATS,
    ...customCats.map(id => ({ id, label: id })),
  ]
  const displayName = setName.trim() || 'Set Name'
  const emptyCount  = Math.max(0, TOTAL_ROWS - words.length - (editingId ? 0 : 1))

  return (
    <div className="hs">
      <header className="hs__header">
        <div className="hs__arrow-ph" />
        <h1 className="hs__title">Add Vocabulary Set</h1>
        <div className="hs__streak">🔥 <span>0 Days</span></div>
      </header>

      <div className="hs__body">

        {/* Left sidebar */}
        <aside className="hs__side">
          <div className="hs__mascot-wrap">
            <button className="hs__mascot-btn" onClick={onBack} title="Home">
              <AvatarIcon idx={avatarIdx} size={72} />
            </button>
            <span className="hs__mascot-lbl">Home</span>
          </div>
          {allCatBtns.map(cat => (
            <button key={cat.id} className="hs__cat-btn hs__cat-btn--dim" disabled title={cat.label} style={cat.color ? { background: cat.color } : {}}>
              {cat.img
                ? <img src={cat.img} alt={cat.label} style={{ width: 50, height: 50, objectFit: 'contain' }} />
                : <PlaceholderIcon />}
            </button>
          ))}
          <div className="hs__side-spacer" />
          <button className="hs__cat-btn hs__add-btn hs__cat-btn--dim" disabled>+</button>
        </aside>

        {/* Main */}
        <main className="hs__main ac__main">
          {/* Set name input */}
          <div className="ac__setname-wrap">
            <span className="ac__setname-ico">✏️</span>
              <input
              className="ac__setname-input"
              value={setName}
              onChange={e => { setSetNameState(e.target.value); setError(null) }}
              placeholder="Set Name"
            />
          </div>

          {/* Word card */}
          <div className="ac__card">
            {words.map(w => (
              editingId === w.id ? (
                <div key={w.id} className="ac__row ac__row--edit">
                  <input
                    ref={editDeRef}
                    className="ac__edit-inp"
                    value={editDe}
                    onChange={e => setEditDe(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Deutsch..."
                  />
                  <input
                    className="ac__edit-inp"
                    value={editEn}
                    onChange={e => setEditEn(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="English..."
                  />
                  <button className="ac__icon-btn ac__icon-btn--ok" onClick={confirmEdit}>✓</button>
                  <button className="ac__icon-btn" onClick={cancelEdit}>✕</button>
                </div>
              ) : (
                <div key={w.id} className="ac__row">
                  <span className="ac__cell-de">{w.de}</span>
                  <span className="ac__cell-en">{w.en}</span>
                  <span className="ac__chip">{displayName}</span>
                  <button className="ac__icon-btn" onClick={() => startEdit(w)}><PencilIcon /></button>
                  <button className="ac__icon-btn ac__icon-btn--del" onClick={() => deleteWord(w.id)}><TrashIcon /></button>
                </div>
              )
            ))}

            {/* Row with + button */}
            {!editingId && (
              <div className="ac__row ac__row--ph">
                <button className="ac__plus-btn" onClick={addWord}>+</button>
              </div>
            )}

            {/* Placeholder rows */}
            {Array.from({ length: emptyCount }).map((_, i) => (
              <div key={'ph' + i} className="ac__row ac__row--ph" />
            ))}
            {/* Error message */}
            {error && <p className="ac__error">{error}</p>}
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="hs__side hs__side--r">
          {ACTION_BTNS.map(({ id, label, img, color }) => (
            <button key={id} className="hs__action-btn hs__action-btn--dim" style={{ background: color }} disabled title={label}>
              <img src={img} alt={label} style={{ width: 60, height: 60, objectFit: 'contain' }} />
            </button>
          ))}
          <div className="hs__side-spacer" />
          <button className="ac__save-btn" onClick={handleSave} disabled={saving} title="Save">
            {saving ? '…' : '✓'}
          </button>
        </aside>

      </div>
    </div>
  )
}
