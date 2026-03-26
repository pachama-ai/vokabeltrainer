import { useState, useEffect } from 'react'
import { getProfile, updateProfile, changePassword, getSessions, revokeSession, logoutAll, deleteAccount } from '../api/vocabApi'
import { AvatarIcon, AVATAR_COUNT, getAvatarIdx } from './avatars'
import './SettingsScreen.css'

// ── Shared icon components ───────────────────────────────────────────────────

const PlaceholderIcon = () => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
    <ellipse cx="16" cy="13" rx="9" ry="8" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M10 20 Q8 28 16 28 Q24 28 22 20" stroke="currentColor" strokeWidth="1.8" fill="none"/>
    <circle cx="13" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
    <path d="M13 16 Q16 18.5 19 16" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
)

const GearIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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

const ST_ACTION_BTNS = [
  { id: 'learn',  label: 'Learn',  img: '/learn.png',  color: '#5b9ec9' },
  { id: 'test',   label: 'Test',   img: '/test.png',   color: '#c0826e' },
  { id: 'manage', label: 'Manage', img: '/manage.png', color: '#4ca87a' },
]

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
)

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const SmallXIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const FileTextIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

const BookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)

// ── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'personal', label: 'Profile Information' },
  { id: 'password', label: 'Password' },
  { id: 'avatar',   label: 'Avatar' },
  { id: 'security', label: 'Security' },
  { id: 'privacy',  label: 'Privacy Policy' },
  { id: 'imprint',  label: 'Imprint' },
]

const PROFILE_FIELDS = [
  { key: 'username', label: 'Username' },
  { key: 'name',     label: 'Name' },
  { key: 'address',  label: 'Address' },
  { key: 'language', label: 'Language' },
]

// ── Personal Details Tab ─────────────────────────────────────────────────────

function PersonalTab() {
  const [profile, setProfile]   = useState(null)
  const [form, setForm]         = useState({})
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState(null)

  useEffect(() => {
    getProfile()
      .then(p => { setProfile(p); setForm(p) })
      .catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    setMsg(null)
    try {
      await updateProfile({
        username: form.username ?? '',
        name:     form.name     ?? '',
        address:  form.address  ?? '',
        language: form.language ?? '',
      })
      setProfile({ ...profile, ...form })
      setEditing(false)
      setMsg({ ok: true, text: 'Saved.' })
      setTimeout(() => setMsg(null), 2500)
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setForm(profile)
    setEditing(false)
    setMsg(null)
  }

  return (
    <div className="st__tab-wrap">
      <div className="st__card">
        <div className="st__card-hd">
          <span className="st__card-ttl">Basic Personal Info</span>
          <div className="st__card-actions">
            {editing && (
              <button className="st__edit-btn st__edit-btn--cancel" onClick={handleCancel}>
                Cancel
              </button>
            )}
            <button
              className={`st__edit-btn${editing ? ' st__edit-btn--save' : ''}`}
              onClick={editing ? handleSave : () => setEditing(true)}
              disabled={saving}
            >
              {editing ? <SaveIcon /> : <PencilIcon />}
              <span>{saving ? 'Saving…' : editing ? 'Save' : 'Edit'}</span>
            </button>
          </div>
        </div>

        {PROFILE_FIELDS.map((field, i) => (
          <div key={field.key}>
            <div className="st__row">
              <span className="st__row-lbl">{field.label}</span>
              {editing ? (
                <input
                  className="st__input"
                  value={form[field.key] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  autoComplete="off"
                />
              ) : (
                <span className="st__row-val">{profile?.[field.key] || '—'}</span>
              )}
            </div>
            {i < PROFILE_FIELDS.length - 1 && <div className="st__divider" />}
          </div>
        ))}
      </div>

      <div className="st__msg-slot">
        {msg && (
          <p className={`st__msg${msg.ok ? ' st__msg--ok' : ' st__msg--err'}`}>{msg.text}</p>
        )}
      </div>
    </div>
  )
}

// ── Password Tab ─────────────────────────────────────────────────────────────

const PW_ROWS = [
  { key: 'current', label: 'Current Password', eye: true },
  { key: 'newPw',   label: 'New Password',     eye: false },
  { key: 'repeat',  label: 'Repeat Password',  eye: false },
]

function PasswordTab() {
  const [editing, setEditing]     = useState(false)
  const [showCurrent, setShowCurr]= useState(false)
  const [form, setForm]           = useState({ current: '', newPw: '', repeat: '' })
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState(null)

  const pwLen = parseInt(localStorage.getItem('vocab_pw_len') ?? '8', 10)
  const pwDots = '\u2022'.repeat(pwLen)

  function cancel() {
    setEditing(false)
    setForm({ current: '', newPw: '', repeat: '' })
    setShowCurr(false)
    setMsg(null)
  }

  async function handleSave() {
    if (form.newPw !== form.repeat) {
      setMsg({ ok: false, text: 'Passwords do not match.' }); return
    }
    if (form.newPw.length < 8) {
      setMsg({ ok: false, text: 'Password must be at least 8 characters long.' }); return
    }
    if (/\s/.test(form.newPw)) {
      setMsg({ ok: false, text: 'Password cannot contain spaces.' }); return
    }
    if (!/[a-z]/.test(form.newPw) || !/[A-Z]/.test(form.newPw)) {
      setMsg({ ok: false, text: 'Password must include lower and upper characters.' }); return
    }
    if (!/[0-9!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>/?]/.test(form.newPw)) {
      setMsg({ ok: false, text: 'Password must include at least 1 number or symbol.' }); return
    }
    setSaving(true)
    setMsg(null)
    try {
      await changePassword(form.current, form.newPw)
      setForm({ current: '', newPw: '', repeat: '' })
      setEditing(false)
      setShowCurr(false)
      setMsg({ ok: true, text: 'Password changed successfully.' })
      setTimeout(() => setMsg(null), 3000)
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="st__tab-wrap">
      <div className="st__card">
        <div className="st__card-hd">
          <span className="st__card-ttl">Password Settings</span>
          <div className="st__card-actions">
            {editing && (
              <button className="st__edit-btn st__edit-btn--cancel" onClick={cancel}>Cancel</button>
            )}
            <button
              className={`st__edit-btn${editing ? ' st__edit-btn--save' : ''}`}
              onClick={editing ? handleSave : () => setEditing(true)}
              disabled={saving}
            >
              {editing ? <SaveIcon /> : <PencilIcon />}
              <span>{saving ? 'Saving…' : editing ? 'Save' : 'Edit'}</span>
            </button>
          </div>
        </div>

        {PW_ROWS.map((row, i) => (
          <div key={row.key}>
            <div className="st__divider" />
            <div className="st__row">
              <span className="st__row-lbl">{row.label}</span>
              {editing ? (
                <div className="st__pw-field st__pw-field--edit">
                  <input
                    className="st__input st__input--pw"
                    type={row.key === 'current' && showCurrent ? 'text' : 'password'}
                    value={form[row.key]}
                    onChange={e => setForm(f => ({ ...f, [row.key]: e.target.value }))}
                    autoComplete={row.key === 'current' ? 'current-password' : 'new-password'}
                  />
                  {row.eye && (
                    <button className="st__eye-btn st__eye-btn--inside" type="button" tabIndex={-1} onClick={() => setShowCurr(v => !v)}>
                      <EyeIcon open={showCurrent} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="st__pw-field">
                  <span className="st__row-val">{row.key === 'current' ? pwDots : ''}</span>
                  {row.eye && (
                    <span className="st__eye-btn st__eye-btn--static">
                      <EyeIcon open={false} />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="st__divider" />
        <div className="st__pw-reqs">
          <p className="st__pw-reqs-ttl">Password must:</p>
          <ul className="st__pw-reqs-list">
            <li>include lower and upper characters</li>
            <li>include at least 1 number or symbol</li>
            <li>be at least 8 characters long</li>
            <li>match in both fields</li>
            <li>cannot contain spaces</li>
          </ul>
        </div>
      </div>

      <div className="st__msg-slot">
        {msg && (
          <p className={`st__msg${msg.ok ? ' st__msg--ok' : ' st__msg--err'}`}>{msg.text}</p>
        )}
      </div>
    </div>
  )
}

// ── Placeholder Tabs ─────────────────────────────────────────────────────────

// ── Placeholder Tabs ─────────────────────────────────────────────────────────────
// ── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab({ onLogout }) {
  const [sessions, setSessions]       = useState([])
  const [loadingSess, setLoadingSess] = useState(true)
  const [confirmRevoke, setConfirmRevoke] = useState(null) // { id, isCurrent }
  const [confirmDelete, setConfirmDel]    = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [msg, setMsg]                     = useState(null)

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    setLoadingSess(true)
    try {
      const data = await getSessions()
      setSessions(data.sessions ?? [])
    } catch {
      setSessions([])
    } finally {
      setLoadingSess(false)
    }
  }

  async function handleRevoke(id, isCurrent) {
    try {
      await revokeSession(id)
      if (isCurrent) { onLogout(); return }
      setSessions(s => s.filter(x => x.id !== id))
      setConfirmRevoke(null)
    } catch (err) {
      setMsg({ ok: false, text: err.message })
      setConfirmRevoke(null)
    }
  }

  async function handleLogoutAll() {
    try {
      await logoutAll()
      onLogout()
    } catch (err) {
      setConfirmLogout(false)
      setMsg({ ok: false, text: err.message })
    }
  }

  async function doDeleteAccount() {
    setDeleting(true)
    try {
      await deleteAccount()
      onLogout()
    } catch (err) {
      setMsg({ ok: false, text: err.message })
      setDeleting(false)
      setConfirmDel(false)
    }
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 5)  return 'Active now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return days === 1 ? '1 day ago' : `${days} days ago`
  }

  return (
    <div className="st__tab-wrap">
      <div className="st__card">
        <div className="st__card-hd">
          <span className="st__card-ttl">Security Settings</span>
        </div>

        {/* Active Sessions */}
        <div className="st__divider" />
        <div className="st__sec-row">
          <span className="st__row-lbl">Active Sessions</span>
          <div className="st__sessions-list">
            {loadingSess && <span className="st__session-time">Loading…</span>}
            {!loadingSess && sessions.length === 0 && (
              <span className="st__session-time">No active sessions. Sign in again to see devices.</span>
            )}
            {sessions.map(s => (
              <div key={s.id} className="st__session-item">
                <span className="st__session-name">{s.device_name}</span>
                <span className="st__session-time">
                  {timeAgo(s.last_active)}{s.is_current ? ' · Current' : ''}
                </span>
                <button
                  className="st__sec-action"
                  title="Revoke session"
                  onClick={() => { setConfirmRevoke({ id: s.id, isCurrent: s.is_current }); setConfirmDel(false); setConfirmLogout(false); setMsg(null) }}
                  type="button"
                >
                  <SmallXIcon />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Log out everywhere */}
        <div className="st__divider" />
        <div className="st__sec-row st__sec-row--center">
          <span className="st__row-lbl">Log out everywhere</span>
          <button
            className="st__sec-action st__sec-action--ok"
            title="Log out of all devices"
            onClick={() => { setConfirmLogout(true); setConfirmDel(false); setConfirmRevoke(null); setMsg(null) }}
            type="button"
          >
            <CheckIcon />
          </button>
        </div>

        {/* Delete Account */}
        <div className="st__divider" />
        <div className="st__sec-row st__sec-row--center">
          <div>
            <div className="st__sec-delete-lbl">Delete Account</div>
            <div className="st__sec-delete-sub">This action cannot be undone.</div>
          </div>
          <button
            className="st__sec-action st__sec-action--danger"
            title="Delete account"
            onClick={() => { setConfirmDel(true); setConfirmLogout(false); setConfirmRevoke(null); setMsg(null) }}
            type="button"
          >
            <SmallXIcon />
          </button>
        </div>
      </div>

      <div className="st__msg-slot">
        {confirmRevoke && !msg && (
          <div className="st__confirm-box">
            <p>{confirmRevoke.isCurrent ? 'This is your current session. You will be logged out.' : 'Revoke this session? That device will be signed out.'}</p>
            <div className="st__confirm-actions">
              <button className="st__edit-btn st__edit-btn--cancel" onClick={() => setConfirmRevoke(null)}>Cancel</button>
              <button className="st__edit-btn st__edit-btn--danger" onClick={() => handleRevoke(confirmRevoke.id, confirmRevoke.isCurrent)}>Revoke</button>
            </div>
          </div>
        )}
        {confirmLogout && !msg && (
          <div className="st__confirm-box">
            <p>Log out of all devices? You will be signed out everywhere.</p>
            <div className="st__confirm-actions">
              <button className="st__edit-btn st__edit-btn--cancel" onClick={() => setConfirmLogout(false)}>Cancel</button>
              <button className="st__edit-btn st__edit-btn--save" onClick={handleLogoutAll}>Log out everywhere</button>
            </div>
          </div>
        )}
        {confirmDelete && !msg && (
          <div className="st__confirm-box">
            <p>Are you sure? All data will be permanently deleted.</p>
            <div className="st__confirm-actions">
              <button className="st__edit-btn st__edit-btn--cancel" onClick={() => setConfirmDel(false)}>Cancel</button>
              <button className="st__edit-btn st__edit-btn--danger" onClick={doDeleteAccount} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        )}
        {msg && <p className={`st__msg${msg.ok ? ' st__msg--ok' : ' st__msg--err'}`}>{msg.text}</p>}
      </div>
    </div>
  )
}
// ── Avatar Tab ─────────────────────────────────────────────────────────────

function AvatarTab({ onAvatarChange }) {
  const [selected, setSelected] = useState(getAvatarIdx)
  const [pending, setPending]   = useState(getAvatarIdx)
  const [editing, setEditing]   = useState(false)

  function handleEdit() {
    setPending(selected)
    setEditing(true)
  }

  function handleCancel() {
    setPending(selected)
    setEditing(false)
  }

  function handleSave() {
    setSelected(pending)
    localStorage.setItem('vocab_avatar', String(pending))
    setEditing(false)
    onAvatarChange?.(pending)
  }

  return (
    <div className="st__tab-wrap">
      <div className="st__card">
        <div className="st__card-hd">
          <span className="st__card-ttl">Profile Picture</span>
          <div className="st__card-actions">
            {editing && (
              <button className="st__edit-btn st__edit-btn--cancel" onClick={handleCancel}>Cancel</button>
            )}
            <button
              className={`st__edit-btn${editing ? ' st__edit-btn--save' : ''}`}
              onClick={editing ? handleSave : handleEdit}
            >
              {editing ? <SaveIcon /> : <PencilIcon />}
              <span>{editing ? 'Save' : 'Edit'}</span>
            </button>
          </div>
        </div>
        <div className="st__divider" />
        <div className={`st__av-grid${editing ? ' st__av-grid--edit' : ''}`}>
          {Array.from({ length: AVATAR_COUNT }, (_, i) => (
            <button
              key={i}
              className={`st__av-item${(editing ? pending : selected) === i ? ' st__av-item--on' : ''}`}
              onClick={editing ? () => setPending(i) : undefined}
              disabled={!editing}
              type="button"
            >
              <AvatarIcon idx={i} size={82} />
            </button>
          ))}
        </div>
      </div>
      <div className="st__msg-slot" />
    </div>
  )
}

function PrivacyTab() {
  return (
    <div className="st__tab-wrap">
      <div className="st__card st__card--text">
        <p><strong>Last updated: March 13, 2026</strong></p>
        <p>We take the protection of your personal data seriously. We collect only the information you voluntarily provide (name, email, account details) to operate and improve our service.</p>
        <p><strong>Data &amp; Security</strong></p>
        <p>Your data is protected with appropriate technical and organizational measures. We do not share your personal data with third parties.</p>
        <p><strong>Your Rights</strong></p>
        <p>You have the right to access, correct, or delete your personal data at any time via the Security settings or by contacting us.</p>
        <p><strong>Contact</strong></p>
        <p><a className="st__link" href="mailto:selina.schneider@gmail.com">selina.schneider@gmail.com</a></p>
      </div>
      <div className="st__msg-slot" />
    </div>
  )
}

function ImprintTab() {
  return (
    <div className="st__tab-wrap">
      <div className="st__card st__card--imprint">
        <dl className="st__imprint-dl">
          <dt>Legal notice (§ 5 TMG)</dt>
          <dd>Xenia & Selina Schneider<br/>Forckestraße 24, 38855 Wernigerode<br/>Germany</dd>

          <dt>Contact</dt>
          <dd>Phone: +49 176 9217465<br/>E-Mail: selina.schneider@gmail.com</dd>

          <dt>Represented by</dt>
          <dd>Selina & Xenia</dd>


          <dt>Liability — Content</dt>
          <dd>Pages were created with greatest care. We cannot guarantee accuracy, completeness, or timeliness.</dd>

          <dt>Liability — Links</dt>
          <dd>External links are beyond our control. We assume no liability for third-party content.</dd>

          <dt>Copyright</dt>
          <dd>All content on these pages is subject to German copyright law.</dd>
        </dl>
      </div>
      <div className="st__msg-slot" />
    </div>
  )
}

function PlaceholderTab({ title }) {
  return (
    <div className="st__card">
      <div className="st__card-hd">
        <span className="st__card-ttl">{title}</span>
      </div>
      <p className="st__placeholder-msg">Coming soon.</p>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function SettingsScreen({ onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState('personal')
  const [avatarIdx, setAvatarIdx] = useState(getAvatarIdx)

  return (
    <div className="hs">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="hs__header">
        <div className="hs__arrow-ph" />
        <h1 className="hs__title">Account Settings</h1>
        <div className="hs__streak-ph" />
      </header>

      {/* ── Body: 3 columns ─────────────────────────────── */}
      <div className="hs__body">

        {/* Left sidebar */}
        <aside className="hs__side">
          <div className="hs__mascot-wrap">
            <button className="hs__mascot-btn" onClick={onBack} title="Home">
              <AvatarIcon idx={avatarIdx} size={36} />
            </button>
            <span className="hs__mascot-lbl">Home</span>
          </div>

          {/* Settings (active) */}
          <button
            className={`hs__cat-btn st__nav-btn${activeTab !== 'privacy' && activeTab !== 'imprint' ? ' st__nav-btn--on' : ''}`}
            style={{ background: '#8da0c0' }}
            title="Settings"
            onClick={() => setActiveTab('personal')}
          >
            <GearIcon />
          </button>

          {/* Privacy Policy */}
          <button
            className={`hs__cat-btn st__nav-btn${activeTab === 'privacy' ? ' st__nav-btn--on' : ''}`}
            style={{ background: '#5aab82' }}
            title="Privacy Policy"
            onClick={() => setActiveTab('privacy')}
          >
            <FileTextIcon />
          </button>

          {/* Imprint */}
          <button
            className={`hs__cat-btn st__nav-btn${activeTab === 'imprint' ? ' st__nav-btn--on' : ''}`}
            style={{ background: '#c4956a' }}
            title="Imprint"
            onClick={() => setActiveTab('imprint')}
          >
            <BookIcon />
          </button>

          <div className="st__side-spacer" />

          {/* Logout */}
          <button className="hs__cat-btn st__logout-btn" onClick={onLogout} title="Logout">
            <LogoutIcon />
          </button>
        </aside>

        {/* Main content */}
        <main className="hs__main st__main">

          {/* Tab nav – hidden on sidebar-only pages */}
          {activeTab !== 'privacy' && activeTab !== 'imprint' ? (
            <nav className="st__tabs">
              {TABS.filter(t => t.id !== 'privacy' && t.id !== 'imprint').map(t => (
                <button
                  key={t.id}
                  className={`st__tab${activeTab === t.id ? ' st__tab--on' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          ) : (
            <div className="st__sidebar-heading">
              {activeTab === 'privacy' ? 'Privacy Policy' : 'Imprint'}
            </div>
          )}

          {/* Tab content */}
          <div className="st__content">
            {activeTab === 'personal' && <PersonalTab />}
            {activeTab === 'password' && <PasswordTab />}
            {activeTab === 'avatar'   && <AvatarTab onAvatarChange={setAvatarIdx} />}
          {activeTab === 'security' && <SecurityTab onLogout={onLogout} />}
            {activeTab === 'privacy'  && <PrivacyTab />}
            {activeTab === 'imprint'  && <ImprintTab />}
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="hs__side hs__side--r">
          {ST_ACTION_BTNS.map(({ id, label, img, color }) => (
            <button key={id} className="hs__action-btn hs__action-btn--dim" disabled title={label} style={{ background: color }}>
              <img src={img} alt={label} style={{ width: 60, height: 60, objectFit: 'contain' }} />
            </button>
          ))}
        </aside>
      </div>
    </div>
  )
}
