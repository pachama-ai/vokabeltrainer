// Avatar images from /public/avatar1.png – avatar4.png

export const AVATAR_COUNT = 4

export function getAvatarIdx() {
  return Math.min(Math.max(0, parseInt(localStorage.getItem('vocab_avatar') ?? '0', 10)), AVATAR_COUNT - 1)
}

export function AvatarIcon({ idx = 0, size = 56 }) {
  const n = Math.min(Math.max(0, idx), AVATAR_COUNT - 1) + 1
  return (
    <img
      src={`/avatar${n}.png`}
      alt={`Avatar ${n}`}
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  )
}
