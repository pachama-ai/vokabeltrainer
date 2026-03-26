import { useState, useEffect, useRef } from 'react'
import { AvatarIcon, getAvatarIdx } from './avatars'
import { getManageWords, updateWord, deleteWord, createCategory } from '../api/vocabApi'
import './CategoryScreen.css'

const BUILTIN_CATS = [
  { id: 'grundwortschatz',        label: 'Basic',      color: 'rgba(68, 196, 186, 0.72)'  },
  { id: 'aufbauwortschatz',       label: 'Advanced',   color: 'rgba(138, 162, 96, 0.68)'  },
  { id: 'unregelmaessige_verben', label: 'Irregulars', color: 'rgba(200, 148, 72, 0.72)'  },
]

const CAT_SIDEBAR_COLORS = {
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
const PencilIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
)
const ChevronDownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

const ACTION_BTNS = [
  { id: 'learn',  label: 'Learn',  img: '/learn.png',  color: '#5b9ec9' },
  { id: 'test',   label: 'Test',   img: '/test.png',   color: '#c0826e' },
  { id: 'manage', label: 'Manage', img: '/manage.png', color: '#4ca87a' },
]

const PAGE_SIZE = 20

function getCatBadge(category) {
  const b = BUILTIN_CATS.find(c => c.id === category)
  if (b) return { label: b.label, color: b.color }
  return { label: category, color: 'rgba(130, 148, 204, 0.52)' }
}

export default function VocabManagerScreen({ onBack, onSettings, customCats = [], initialCategory = 'all' }) {
  const [avatarIdx]  = useState(getAvatarIdx)
  const [filter, setFilter]     = useState(initialCategory)
  const [search, setSearch]     = useState('')
  const [words, setWords]       = useState([])
  const [hasMore, setHasMore]   = useState(false)
  const [offset, setOffset]     = useState(0)
  const [loading, setLoading]   = useState(false)

  // Edit existing word
  const [editingId, setEditingId]         = useState(null)
  const [editWord, setEditWord]           = useState('')
  const [editTranslation, setEditTrans]   = useState('')

  // Add new word
  const [addingWord, setAddingWord]       = useState(false)
  const [newWord, setNewWord]             = useState('')
  const [newTranslation, setNewTrans]     = useState('')

  const editWordRef = useRef(null)
  const newWordRef  = useRef(null)

  // Reload whenever filter or search changes
  useEffect(() => {
    load(true)
  }, [filter, search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (editingId)  editWordRef.current?.focus() }, [editingId])
  useEffect(() => { if (addingWord) newWordRef.current?.focus()  }, [addingWord])

  async function load(reset = false) {
    const off = reset ? 0 : offset
    setLoading(true)
    try {
      const res = await getManageWords(filter, search, off, PAGE_SIZE)
      if (reset) {
        setWords(res.words)
        setOffset(PAGE_SIZE)
      } else {
        setWords(prev => [...prev, ...res.words])
        setOffset(prev => prev + PAGE_SIZE)
      }
      setHasMore(res.has_more)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // ── Edit ──────────────────────────────────────────────────────
  function startEdit(w) {
    setEditingId(w.id)
    setEditWord(w.word)
    setEditTrans(w.translation)
  }

  async function confirmEdit() {
    if (!editWord.trim() || !editTranslation.trim()) { setEditingId(null); return }
    try {
      await updateWord(editingId, editWord.trim(), editTranslation.trim())
      setWords(prev => prev.map(w =>
        w.id === editingId ? { ...w, word: editWord.trim(), translation: editTranslation.trim() } : w
      ))
    } catch { alert('Fehler beim Speichern') }
    setEditingId(null)
  }

  function cancelEdit() { setEditingId(null) }

  // ── Delete ────────────────────────────────────────────────────
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  async function confirmDelete() {
    try {
      await deleteWord(deleteConfirmId)
      setWords(prev => prev.filter(w => w.id !== deleteConfirmId))
    } catch { alert('Fehler beim Löschen') }
    setDeleteConfirmId(null)
  }

  // ── Add new ───────────────────────────────────────────────────
  async function confirmAdd() {
    if (!newWord.trim() || !newTranslation.trim()) { cancelAdd(); return }
    const cat = (filter === 'all') ? BUILTIN_CATS[0].id : filter
    try {
      await createCategory(cat, [{ de: newWord.trim(), en: newTranslation.trim() }])
      setNewWord(''); setNewTrans(''); setAddingWord(false)
      load(true)
    } catch { alert('Fehler beim Hinzufügen') }
  }

  function cancelAdd() { setAddingWord(false); setNewWord(''); setNewTrans('') }

  function onEditKey(e)  { if (e.key === 'Enter') confirmEdit();  if (e.key === 'Escape') cancelEdit() }
  function onAddKey(e)   { if (e.key === 'Enter') confirmAdd();   if (e.key === 'Escape') cancelAdd()  }

  // ── Derived data ──────────────────────────────────────────────
  const filterTabs = [
    { id: 'all', label: 'All' },
    ...BUILTIN_CATS.map(c => ({ id: c.id, label: c.label })),
    ...customCats.map(id => ({ id, label: id })),
  ]
  const sidebarCats = [
    ...BUILTIN_CATS,
    ...customCats.map(id => ({ id, label: id })),
  ]

  return (
    <div className="hs">
      {/* ── Header ── */}
      <header className="hs__header">
        <h1 className="hs__title">Vocabulary Manager</h1>
        <div className="hs__streak">🔥 <span>0 Days</span></div>
      </header>

      <div className="hs__body">

        {/* ── Left sidebar ── */}
        <aside className="hs__side">
          <div className="hs__mascot-wrap">
            <button className="hs__mascot-btn" onClick={onBack} title="Back to Home">
              <AvatarIcon idx={avatarIdx} size={36} />
            </button>
            <span className="hs__mascot-lbl">Home</span>
          </div>
          {sidebarCats.map(cat => (
            <button
              key={cat.id}
              className="hs__cat-btn"
              style={{ opacity: 0.55, cursor: 'default', background: CAT_SIDEBAR_COLORS[cat.id] ?? DEFAULT_CAT_COLOR }}
              disabled
              title={cat.label}
            >
              <PlaceholderIcon />
            </button>
          ))}
          <div className="hs__side-spacer" />
          <button className="hs__cat-btn hs__add-btn" title="Add category" style={{ opacity: 0.45, cursor: 'default' }} disabled>+</button>
        </aside>

        {/* ── Main ── */}
        <main className="hs__main vm__main">

          {/* Search + filter bar */}
          <div className="vm__topbar">
            <input
              className="vm__search"
              value={search}
              onChange={e => { setSearch(e.target.value); setOffset(0) }}
              placeholder="Search..."
              autoComplete="off"
            />
            <nav className="vm__filters">
              {filterTabs.map(t => (
                <button
                  key={t.id}
                  className={`vm__filter-tab${filter === t.id ? ' vm__filter-tab--on' : ''}`}
                  onClick={() => { setFilter(t.id); setOffset(0) }}
                >{t.label}</button>
              ))}
            </nav>
          </div>
          <div className="vm__divider" />

          {/* Word card */}
          <div className="vm__card">
            {/* Scrollable rows */}
            <div className="vm__scroll">
              {loading && words.length === 0 && (
                <div className="vm__placeholder">Loading…</div>
              )}
              {!loading && words.length === 0 && (
                <div className="vm__placeholder">No vocabulary found.</div>
              )}

              {words.map(w => (
                editingId === w.id ? (
                  <div key={w.id} className="vm__row vm__row--edit">
                    <input
                      ref={editWordRef}
                      className="vm__edit-inp"
                      value={editWord}
                      onChange={e => setEditWord(e.target.value)}
                      onKeyDown={onEditKey}
                      placeholder="Deutsch…"
                    />
                    <input
                      className="vm__edit-inp"
                      value={editTranslation}
                      onChange={e => setEditTrans(e.target.value)}
                      onKeyDown={onEditKey}
                      placeholder="English…"
                    />
                    <button className="vm__icon-btn vm__icon-btn--ok" onClick={confirmEdit}>✓</button>
                    <button className="vm__icon-btn" onClick={cancelEdit}>✕</button>
                  </div>
                ) : (
                  <div key={w.id} className="vm__row">
                    <span className="vm__cell-de">{w.word}</span>
                    <span className="vm__cell-en">{w.translation}</span>
                    {(() => {
                      const b = getCatBadge(w.category)
                      return <span className="vm__badge" style={{ background: b.color }}>{b.label}</span>
                    })()}
                    <button className="vm__icon-btn" onClick={() => startEdit(w)} title="Edit"><PencilIcon /></button>
                    <button className="vm__icon-btn vm__icon-btn--del" onClick={() => setDeleteConfirmId(w.id)} title="Delete"><TrashIcon /></button>
                  </div>
                )
              ))}

              {/* Add-new row */}
              {addingWord && (
                <div className="vm__row vm__row--edit">
                  <input
                    ref={newWordRef}
                    className="vm__edit-inp"
                    value={newWord}
                    onChange={e => setNewWord(e.target.value)}
                    onKeyDown={onAddKey}
                    placeholder="Deutsch…"
                  />
                  <input
                    className="vm__edit-inp"
                    value={newTranslation}
                    onChange={e => setNewTrans(e.target.value)}
                    onKeyDown={onAddKey}
                    placeholder="English…"
                  />
                  <button className="vm__icon-btn vm__icon-btn--ok" onClick={confirmAdd}>✓</button>
                  <button className="vm__icon-btn" onClick={cancelAdd}>✕</button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="vm__footer">
              <button
                className="vm__footer-btn"
                onClick={() => load(false)}
                disabled={!hasMore || loading}
                title="Load more"
              >
                <ChevronDownIcon />
              </button>
              <button
                className="vm__footer-btn vm__footer-btn--add"
                onClick={() => setAddingWord(true)}
                disabled={addingWord || filter === 'all'}
                title={filter === 'all' ? 'Select a category first' : 'Add word'}
              >+</button>
            </div>
          </div>
        </main>

        {/* ── Right sidebar ── */}
        <aside className="hs__side hs__side--r">
          {ACTION_BTNS.map(({ id, label, img, color }) => (
            id === 'manage' ? (
              <button key={id} className="hs__action-btn vm__action-active" title={label} style={{ background: color }}>
                <img src={img} alt={label} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                <span className="hs__action-lbl">{label}</span>
              </button>
            ) : (
              <button key={id} className="hs__action-btn hs__action-btn--dim" disabled title={label} style={{ background: color }}>
                <img src={img} alt={label} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                <span className="hs__action-lbl">{label}</span>
              </button>
            )
          ))}
        </aside>

      </div>

      {/* ── Delete confirmation modal ── */}
      {deleteConfirmId && (() => {
        const w = words.find(x => x.id === deleteConfirmId)
        return (
          <div className="vm__modal-overlay" onClick={() => setDeleteConfirmId(null)}>
            <div className="vm__modal" onClick={e => e.stopPropagation()}>
              <p className="vm__modal-text">
                Delete <strong>{w?.word}</strong>?
              </p>
              <div className="vm__modal-btns">
                <button className="vm__modal-btn vm__modal-btn--cancel" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                <button className="vm__modal-btn vm__modal-btn--del" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
