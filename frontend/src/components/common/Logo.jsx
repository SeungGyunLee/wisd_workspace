// 로고 컴포넌트
// light prop 넣으면 사이드바처럼 어두운 배경에서도 잘 보임

export function WisdLogo({ size = 22, light = false }) {
  const col = light ? 'rgba(255,255,255,0.92)' : '#303030'
  return (
    <svg width={size * 2.5} height={size} viewBox="0 0 60 22" style={{ display: 'block' }}>
      <text
        x="0"
        y="18"
        fontFamily="-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="22"
        fontWeight="800"
        letterSpacing="-1"
        fill={col}
      >
        Wisd
      </text>
    </svg>
  )
}

export function WisdIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30">
      <rect width="30" height="30" rx="8" fill="#3d743d" />
      <text
        x="14"
        y="23"
        fontFamily="-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="19"
        fontWeight="900"
        fill="white"
        textAnchor="middle"
        letterSpacing="-1"
      >
        W
      </text>
    </svg>
  )
}
