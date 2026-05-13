// 아바타 색상 팔레트 - 이름 첫 글자 기준으로 색 배정
export const AVATAR_COLORS = [
  '#3d743d', '#5fa95f', '#2a6a8a',
  '#8a5a2a', '#6a2a8a', '#8a2a2a',
]

export const getAvatarColor = (name) =>
  AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length]

export const getInitials = (name) =>
  (name || '?').substring(0, 2).toUpperCase()

// 날짜 포맷 - 2025.1.1 이런 식으로
export const fmtDate = (d) => {
  const dt = new Date(d)
  return `${dt.getFullYear()}.${dt.getMonth() + 1}.${dt.getDate()}`
}

// 시간 포맷 - 방금, N분 전, N시간 전
export const fmtTime = (ts) => {
  const diff = new Date() - new Date(ts)
  if (diff < 60000) return '방금'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`
  return fmtDate(ts)
}

// 랜덤 id 생성
export const uid = () => Math.random().toString(36).slice(2, 9)

// 오늘 날짜를 YYYY-MM-DD 형식으로
export const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 전체 태스크 기준으로 완료율 계산
export const getProgress = (project) => {
  const tasks = project.categories.flatMap((c) => c.tasks)
  if (!tasks.length) return 0
  return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100)
}
