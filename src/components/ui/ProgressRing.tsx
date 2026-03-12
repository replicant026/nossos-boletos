'use client'

interface Props {
  paid: number
  total: number
}

function getRingColor(paid: number, total: number): string {
  if (total === 0) return '#94a3b8'
  const pct = paid / total
  if (pct < 0.33) return '#dc2626'
  if (pct < 0.66) return '#d97706'
  return '#16a34a'
}

export default function ProgressRing({ paid, total }: Props) {
  const SIZE = 120
  const STROKE = 10
  const RADIUS = (SIZE - STROKE) / 2
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS

  const pct = total === 0 ? 0 : Math.min(paid / total, 1)
  const dashOffset = CIRCUMFERENCE * (1 - pct)
  const color = getRingColor(paid, total)

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
      role="img"
      aria-label={`${paid} de ${total} contas pagas`}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.4s ease' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold text-surface-800 leading-tight">
          {paid}/{total}
        </span>
        <span className="text-xs text-surface-400 leading-tight mt-0.5">pagas</span>
      </div>
    </div>
  )
}
