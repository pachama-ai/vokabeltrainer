import { useState } from 'react'

// Props:
//   category:      string
//   availableCount: Anzahl Wörter noch im Pool (Stufe 0)
//   onConfirm:     (count) => void
//   onBack:        () => void

const CATEGORY_LABELS = {
  grundwortschatz: 'Grundwortschatz',
  aufbauwortschatz: 'Aufbauwortschatz',
  unregelmaessige_verben: 'Unregelmäßige Verben',
}

export default function AddWordsDialog({ category, availableCount, onConfirm, onBack }) {
  const [count, setCount] = useState(20)

  const actual = Math.min(count, availableCount)

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-1">{CATEGORY_LABELS[category]}</h2>
        <p className="text-slate-400 mb-6 text-sm">
          Keine aktiven Vokabeln. Wie viele möchtest du hinzufügen?
        </p>

        {availableCount === 0 ? (
          <div className="bg-green-900 rounded-xl p-4 text-center mb-6">
            <p className="text-green-300 font-semibold">Alle Wörter wurden bereits hinzugefügt!</p>
            <p className="text-green-400 text-sm mt-1">Super gemacht 🎉</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <span className="text-5xl font-bold text-white">{actual}</span>
              <span className="text-slate-400 ml-2">Vokabeln</span>
            </div>

            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full mb-2 accent-emerald-400"
            />
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>5</span>
              <span>50</span>
            </div>

            <p className="text-slate-400 text-sm text-center mb-6">
              Noch <span className="text-white font-semibold">{availableCount}</span> Wörter im Pool verfügbar
            </p>
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors text-sm"
          >
            Zurück
          </button>
          {availableCount > 0 && (
            <button
              onClick={() => onConfirm(actual)}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors font-semibold"
            >
              Starten
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
