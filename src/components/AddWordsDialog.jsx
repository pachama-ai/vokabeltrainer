import { useState } from 'react'
import './LearningScreen.css'

const CATEGORY_LABELS = {
  grundwortschatz:        'Basic Vocabulary',
  aufbauwortschatz:       'Advanced Vocabulary',
  unregelmaessige_verben: 'Irregular Verbs',
}

export default function AddWordsDialog({ category, availableCount, onConfirm, onBack }) {
  const [count, setCount] = useState(Math.min(20, availableCount))
  const actual = Math.min(count, availableCount)

  return (
    <div className="ls">
      <header className="ls__header">
        <button className="ls__back-btn" onClick={onBack}>‹</button>
        <h1 className="ls__title">{CATEGORY_LABELS[category] ?? category}</h1>
        <div className="ls__streak-ph" />
      </header>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{
          background: 'rgba(190, 208, 224, 0.34)',
          borderRadius: '24px',
          padding: '36px 40px',
          maxWidth: '440px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(235,242,248,0.60)', marginBottom: '6px' }}>
              No active words
            </p>
            <p style={{ fontSize: '1rem', fontWeight: 500, color: 'rgba(235,242,248,0.82)' }}>
              How many words do you want to add to your learning deck?
            </p>
          </div>

          {availableCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', borderRadius: '14px', background: 'rgba(120,200,150,0.18)' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(140,220,170,0.95)' }}>All words already added!</p>
              <p style={{ fontSize: '0.82rem', color: 'rgba(140,220,170,0.70)', marginTop: '4px' }}>Great job 🎉</p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '4rem', fontWeight: 700, color: 'rgba(235,246,255,0.90)' }}>{actual}</span>
                <span style={{ fontSize: '1rem', color: 'rgba(235,242,248,0.55)', marginLeft: '8px' }}>words</span>
              </div>
              <input
                type="range"
                min={5}
                max={Math.min(50, availableCount)}
                step={5}
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#84c97e' }}
              />
              <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'rgba(235,242,248,0.55)' }}>
                <span style={{ color: 'rgba(235,246,255,0.88)', fontWeight: 700 }}>{availableCount}</span> words remaining in pool
              </p>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onBack} style={{
              flex: 1, padding: '12px', borderRadius: '14px', border: 'none',
              background: 'rgba(142,154,196,0.28)', color: 'rgba(235,242,248,0.80)',
              fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
            }}>Back</button>
            {availableCount > 0 && (
              <button onClick={() => onConfirm(actual)} style={{
                flex: 1, padding: '12px', borderRadius: '14px', border: 'none',
                background: 'rgba(100,200,160,0.48)', color: 'rgba(255,255,255,0.95)',
                fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
              }}>Start</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
