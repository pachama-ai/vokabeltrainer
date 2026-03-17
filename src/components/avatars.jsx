// Avatar placeholder SVGs — 5 distinct animal characters (line art, currentColor)
// Replace SVG paths with real artwork when available.

export const AVATAR_COUNT = 5

export function getAvatarIdx() {
  return Math.min(Math.max(0, parseInt(localStorage.getItem('vocab_avatar') ?? '0', 10)), AVATAR_COUNT - 1)
}

// ── Avatar 0: Chef / Knowse character ────────────────────────────────────────
function Av0({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* chef hat puff */}
      <ellipse cx="32" cy="16" rx="11" ry="9" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08"/>
      {/* hat brim */}
      <rect x="21" y="22" width="22" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08"/>
      {/* head */}
      <ellipse cx="32" cy="40" rx="14" ry="13" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.06"/>
      {/* eyes */}
      <circle cx="27" cy="38" r="2" fill="currentColor"/>
      <circle cx="37" cy="38" r="2" fill="currentColor"/>
      {/* smile */}
      <path d="M27 44 Q32 48.5 37 44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* collar */}
      <path d="M22 51 Q32 56 42 51" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// ── Avatar 1: Elephant ────────────────────────────────────────────────────────
function Av1({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* left ear */}
      <ellipse cx="13" cy="30" rx="8" ry="12" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.07"/>
      {/* right ear */}
      <ellipse cx="51" cy="30" rx="8" ry="12" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.07"/>
      {/* head */}
      <circle cx="32" cy="29" r="16" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.06"/>
      {/* trunk */}
      <path d="M29 43 Q27 52 31 56 Q35 53 33 43" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* eyes */}
      <circle cx="26" cy="26" r="2" fill="currentColor"/>
      <circle cx="38" cy="26" r="2" fill="currentColor"/>
      {/* smile */}
      <path d="M27 35 Q32 39 37 35" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      {/* bow on ear */}
      <path d="M7 22 L10 25 L7 28" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 22 L10 25 L13 28" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="10" cy="25" r="1.2" fill="currentColor" opacity="0.6"/>
    </svg>
  )
}

// ── Avatar 2: Raccoon ─────────────────────────────────────────────────────────
function Av2({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* ears */}
      <ellipse cx="19" cy="13" rx="7" ry="9" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.10"/>
      <ellipse cx="45" cy="13" rx="7" ry="9" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.10"/>
      {/* head */}
      <circle cx="32" cy="34" r="18" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.04"/>
      {/* eye mask patches */}
      <ellipse cx="24" cy="32" rx="7" ry="5.5" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.1"/>
      <ellipse cx="40" cy="32" rx="7" ry="5.5" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.1"/>
      {/* stripe between */}
      <rect x="28" y="29" width="8" height="2.5" rx="1" fill="currentColor" fillOpacity="0.15"/>
      {/* eyes */}
      <circle cx="24" cy="32" r="2.2" fill="currentColor"/>
      <circle cx="40" cy="32" r="2.2" fill="currentColor"/>
      {/* nose */}
      <ellipse cx="32" cy="41" rx="2.5" ry="1.8" fill="currentColor" opacity="0.55"/>
      {/* smile */}
      <path d="M26 46 Q32 50 38 46" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// ── Avatar 3: Bee ─────────────────────────────────────────────────────────────
function Av3({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* antennae */}
      <line x1="27" y1="14" x2="21" y2="5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="21" cy="4" r="2.2" fill="currentColor"/>
      <line x1="37" y1="14" x2="43" y2="5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="43" cy="4" r="2.2" fill="currentColor"/>
      {/* head */}
      <circle cx="32" cy="28" r="14" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.07"/>
      {/* eyes */}
      <circle cx="26" cy="26" r="2" fill="currentColor"/>
      <circle cx="38" cy="26" r="2" fill="currentColor"/>
      {/* smile */}
      <path d="M26 34 Q32 38 38 34" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      {/* body */}
      <ellipse cx="32" cy="51" rx="11" ry="8" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.07"/>
      {/* stripes */}
      <path d="M21 49 Q32 46 43 49" stroke="currentColor" strokeWidth="1.1" opacity="0.45" fill="none"/>
      <path d="M21 54 Q32 57 43 54" stroke="currentColor" strokeWidth="1.1" opacity="0.45" fill="none"/>
    </svg>
  )
}

// ── Avatar 4: Bunny ───────────────────────────────────────────────────────────
function Av4({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* left ear */}
      <ellipse cx="22" cy="13" rx="5.5" ry="13" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.07"/>
      {/* right ear */}
      <ellipse cx="42" cy="13" rx="5.5" ry="13" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.07"/>
      {/* head */}
      <circle cx="32" cy="36" r="16" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.06"/>
      {/* eyes */}
      <circle cx="26" cy="33" r="2" fill="currentColor"/>
      <circle cx="38" cy="33" r="2" fill="currentColor"/>
      {/* nose */}
      <ellipse cx="32" cy="41" rx="2" ry="1.5" fill="currentColor" opacity="0.6"/>
      {/* smile */}
      <path d="M27 45 Q32 49 37 45" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      {/* bow tie */}
      <path d="M26 53 L29 56 L26 59" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M38 53 L35 56 L38 59" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="32" cy="56" r="1.5" fill="currentColor" opacity="0.7"/>
    </svg>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
const AV_LIST = [Av0, Av1, Av2, Av3, Av4]

export function AvatarIcon({ idx = 0, size = 56 }) {
  const Av = AV_LIST[Math.min(Math.max(0, idx), AV_LIST.length - 1)]
  return <Av size={size} />
}
