import { useState } from 'react'
import { login, register, requestPasswordReset } from '../api/vocabApi'
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

  function switchMode(newMode) {
    setMode(newMode)
    setError('')
    setInfo('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
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

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="mascot-frame" aria-hidden="true">
          <div className="mascot-placeholder" />
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
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort" required minLength={6} autoComplete="current-password" />
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
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" required minLength={6} autoComplete="new-password" />
              </label>

              <label className="login-field">
                <span className="field-icon" aria-hidden="true">{IconLock}</span>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password" required minLength={6} autoComplete="new-password" />
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
