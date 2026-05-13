// 대시보드랑 진행도에서 쓰는 도넛 차트

export default function DonutChart({ pct, size = 110 }) {
  const r = 40
  const c = 2 * Math.PI * r
  const fill = c * (pct / 100)

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#d6ede0" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="url(#dg)"
        strokeWidth="9"
        strokeDasharray={`${fill} ${c - fill}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray .6s' }}
      />
      <defs>
        <linearGradient id="dg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3d743d" />
          <stop offset="100%" stopColor="#a5d9c0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
