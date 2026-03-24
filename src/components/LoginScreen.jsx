import { useState } from 'react'
import { login, register, requestPasswordReset } from '../api/vocabApi'
import { AvatarIcon, getAvatarIdx } from './avatars'
import './LoginScreen.css'

export default function LoginScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [view, setView] = useState('auth')  // 'auth' | 'forgot'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState(() => localStorage.getItem('vocab_saved_email') ?? '')
  const [password, setPassword] = useState(() => localStorage.getItem('vocab_saved_pw') ?? '')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('vocab_saved_email'))
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [avatarIdx] = useState(getAvatarIdx)

  function switchMode(newMode) {
    setMode(newMode)
    setError('')
    setInfo('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirm(false)
  }

  async function handleLoginSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password, rememberMe)
      if (rememberMe) {
        localStorage.setItem('vocab_saved_email', email)
        localStorage.setItem('vocab_saved_pw', password)
      } else {
        localStorage.removeItem('vocab_saved_email')
        localStorage.removeItem('vocab_saved_pw')
      }
      onLoginSuccess({ user_id: data.user_id, email: data.email })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (/\s/.test(password)) {
      setError('Password cannot contain spaces.')
      return
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      setError('Password must include lower and upper case characters.')
      return
    }
    if (!/[0-9!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>/?]/.test(password)) {
      setError('Password must include at least 1 number or symbol.')
      return
    }
    setLoading(true)
    try {
      const data = await register(username, email, password, false)
      onLoginSuccess({ user_id: data.user_id, email: data.email })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const data = await requestPasswordReset(email)
      setInfo(data.message ?? 'If an account with this email exists, a reset password has been sent.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── SVG-Icons ──────────────────────────────────────────────
  const IconUser = (
    <svg viewBox="0 0 24 24" role="presentation">
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
  const IconMail = (
    <svg viewBox="0 0 24 24" role="presentation">
      <path d="M3 6h18v12H3z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 7l8 7 8-7" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
  const IconLock = (
    <svg viewBox="0 0 24 24" role="presentation">
      <rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
  const EyeIcon = ({ open }) => open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="mascot-frame" aria-hidden="true">
          <AvatarIcon idx={avatarIdx} size={62} />
        </div>

        {/* ── LOGIN ── */}
        {view === 'auth' && mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="login-form" noValidate>
            <label className="login-field">
              <span className="field-icon" aria-hidden="true">{IconMail}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Mail" required autoComplete="email" />
            </label>

            <label className="login-field">
              <span className="field-icon" aria-hidden="true">{IconLock}</span>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort" required minLength={6} autoComplete="current-password" />
              <button type="button" className="login-eye-btn" tabIndex={-1} onClick={() => setShowPassword(v => !v)}>
                <EyeIcon open={showPassword} />
              </button>
            </label>

            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Remember me</span>
              </label>
              <button type="button" className="forgot-password"
                onClick={() => { setView('forgot'); setError(''); setInfo('') }}>
                Forgot Password?
              </button>
            </div>

            {error && <p className="login-error">{error}</p>}
            {info  && <p className="login-info">{info}</p>}

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? 'PLEASE WAIT\u2026' : 'LOGIN'}
            </button>

            <button type="button" className="register-switch" onClick={() => switchMode('register')}>
              Don't have an account? <span>REGISTER</span>
            </button>
          </form>
        )}

        {/* ── REGISTER ── */}
        {view === 'auth' && mode === 'register' && (
          <>
            <p className="flow-title">SIGN UP</p>
            <form onSubmit={handleRegisterSubmit} className="login-form login-form--register" noValidate>
              <label className="login-field">
                <span className="field-icon" aria-hidden="true">{IconUser}</span>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username" autoComplete="username" />
              </label>

              <label className="login-field">
                <span className="field-icon" aria-hidden="true">{IconMail}</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-Mail" required autoComplete="email" />
              </label>

              <label className="login-field">
                <span className="field-icon" aria-hidden="true">{IconLock}</span>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" required minLength={6} autoComplete="new-password" />
                <button type="button" className="login-eye-btn" tabIndex={-1} onClick={() => setShowPassword(v => !v)}>
                  <EyeIcon open={showPassword} />
                </button>
              </label>

              {password.length > 0 && (
                <div className="pw-rules">
                  {[
                    { ok: password.length >= 8,                                            text: 'At least 8 characters' },
                    { ok: /[a-z]/.test(password) && /[A-Z]/.test(password),               text: 'Upper & lowercase letters' },
                    { ok: /[0-9!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>/?]/.test(password),             text: 'At least 1 number or symbol' },
                    { ok: !/\\s/.test(password),                                            text: 'No spaces' },
                  ].map(({ ok, text }) => (
                    <div key={text} className={`pw-rule${ok ? ' pw-rule--ok' : ''}`}>
                      <span className="pw-rule-dot" aria-hidden="true">{ok ? '✓' : '·'}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              )}

              <label className="login-field">
                <span className="field-icon" aria-hidden="true">{IconLock}</span>
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password" required minLength={6} autoComplete="new-password" />
                <button type="button" className="login-eye-btn" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}>
                  <EyeIcon open={showConfirm} />
                </button>
              </label>

              {error && <p className="login-error">{error}</p>}

              <button type="submit" disabled={loading} className="login-submit login-submit-small">
                {loading ? 'PLEASE WAIT\u2026' : 'CREATE ACCOUNT'}
              </button>

              <button type="button" className="register-switch" onClick={() => switchMode('login')}>
                Already have an account? <span>LOGIN</span>
              </button>
            </form>
          </>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="login-form" noValidate>
            <p className="flow-title">FORGOT PASSWORD</p>
            <label className="login-field">
              <span className="field-icon" aria-hidden="true">{IconMail}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" required autoComplete="email" />
            </label>

            {error && <p className="login-error">{error}</p>}
            {info  && <p className="login-info">{info}</p>}

            <button type="submit" disabled={loading} className="login-submit login-submit-small">
              {loading ? 'PLEASE WAIT\u2026' : 'SEND RESET LINK'}
            </button>
          </form>
        )}

        {view !== 'auth' && (
          <button type="button" className="register-switch"
            onClick={() => { setView('auth'); setError(''); setInfo('') }}>
            <span>BACK TO LOGIN</span>
          </button>
        )}
      </div>
    </div>
  )
}
