// Props:
//   allStats:          { grundwortschatz: {counts:[0..5], total}, aufbauwortschatz: {...}, ... }
//   totalMastered:     Gesamtzahl Stufe-5-Wörter
//   loading:           true während API-Anfrage läuft
//   onSelectCategory:  (category) => void
//   onLogout:          () => void

const CATEGORIES = [
  {
    id: 'grundwortschatz',
    label: 'Grundwortschatz',
    description: '200 wichtige Alltagswörter',
    color: 'bg-emerald-600',
    hoverColor: 'hover:bg-emerald-500',
    icon: '🏗️',
  },
  {
    id: 'aufbauwortschatz',
    label: 'Aufbauwortschatz',
    description: '170 fortgeschrittene Begriffe',
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-500',
    icon: '📚',
  },
  {
    id: 'unregelmaessige_verben',
    label: 'Unregelmäßige Verben',
    description: '130 wichtige Verben',
    color: 'bg-purple-600',
    hoverColor: 'hover:bg-purple-500',
    icon: '⚡',
  },
]

const STAGE_COLORS = ['bg-gray-600', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500']

export default function CategoryScreen({ allStats, totalMastered, loading, onSelectCategory, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-10 pt-6">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold mb-2">Vokabeltrainer</h1>
            <p className="text-slate-400">
              {totalMastered} Wörter gemeistert (Stufe 5)
            </p>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            Abmelden
          </button>
        </div>

        {/* Kategorien */}
        <div className="flex flex-col gap-4">
          {CATEGORIES.map((cat) => {
            const stats  = allStats?.[cat.id]
            const counts = stats?.counts ?? [0, 0, 0, 0, 0, 0]
            const total  = stats?.total ?? 0
            const active = counts[1] + counts[2] + counts[3] + counts[4]
            const done   = counts[5]
            const inPool = counts[0]

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                disabled={loading}
                className={`${cat.color} ${cat.hoverColor} rounded-2xl p-5 text-left transition-all duration-150 active:scale-95 disabled:opacity-60`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-2xl mr-3">{cat.icon}</span>
                    <span className="text-xl font-semibold">{cat.label}</span>
                  </div>
                  <span className="text-sm opacity-75">{total} Wörter</span>
                </div>

                <p className="text-sm opacity-80 mb-4">{cat.description}</p>

                {/* Fortschrittsbalken Stufen 0–5 */}
                <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                  {[0, 1, 2, 3, 4, 5].map((stage) => {
                    const pct = total > 0 ? (counts[stage] / total) * 100 : 0
                    return (
                      <div
                        key={stage}
                        className={`${STAGE_COLORS[stage]} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    )
                  })}
                </div>

                <div className="flex gap-4 mt-2 text-xs opacity-70">
                  <span>Aktiv: {active}</span>
                  <span>✓ Gemeistert: {done}</span>
                  <span>Pool: {inPool}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Legende */}
        <div className="flex gap-3 justify-center mt-8 flex-wrap">
          {['Pool', 'Stufe 1', 'Stufe 2', 'Stufe 3', 'Stufe 4', 'Gemeistert'].map((label, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-slate-400">
              <div className={`w-3 h-3 rounded-full ${STAGE_COLORS[i]}`} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
