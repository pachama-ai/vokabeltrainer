import { useState } from 'react'
import { login, register } from '../api/vocabApi'

// Props:
//   onLoginSuccess: (user) => void

export default function LoginScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = mode === 'login'
        ? await login(email, password)
        : await register(email, password)
      onLoginSuccess({ user_id: data.user_id, email: data.email })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full">
        <h1 className="text-3xl font-bold mb-2 text-center">Vokabeltrainer</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">
          {mode === 'login' ? 'Einloggen um weiterzumachen' : 'Neuen Account erstellen'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-3 rounded-xl bg-slate-700 border-2 border-slate-600 focus:border-blue-500 outline-none transition-colors"
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="px-4 py-3 rounded-xl bg-slate-700 border-2 border-slate-600 focus:border-blue-500 outline-none transition-colors"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Bitte warten...' : mode === 'login' ? 'Einloggen' : 'Registrieren'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          className="w-full mt-4 text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          {mode === 'login'
            ? 'Noch kein Account? Jetzt registrieren'
            : 'Schon registriert? Einloggen'}
        </button>
      </div>
    </div>
  )
}
