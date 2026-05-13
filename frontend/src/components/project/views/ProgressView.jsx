import DonutChart from '../../common/DonutChart'
import { getProgress } from '../../../utils/helpers'

export default function ProgressView({ project }) {
  const allTasks = project.categories.flatMap((c) => c.tasks)
  const pct = getProgress(project)
  const maxTasks = Math.max(...project.categories.map((c) => c.tasks.length), 1)

  if (!project.categories.length) {
    return (
      <div>
        <div className="view-title">진행도</div>
        <div className="view-sub">프로젝트 진행 현황을 한눈에 파악하세요</div>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">카테고리를 먼저 만들어보세요</div>
          <div className="empty-sub">계획리스트에서 카테고리와 할 일을 추가하면 여기서 확인할 수 있어요</div>
        </div>
      </div>
    )
  }

  const svgW = Math.max(400, project.categories.length * 80 + 60)
  const svgH = 180

  return (
    <div>
      <div className="view-title">진행도</div>
      <div className="view-sub">프로젝트 진행 현황을 한눈에 파악하세요</div>
      <div className="progress-wrap">
        <div className="progress-overall">
          <div style={{ position: 'relative' }}>
            <DonutChart pct={pct} size={130} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)' }}>{pct}%</span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>전체 완료</span>
            </div>
          </div>

          <div className="progress-stats">
            <div className="progress-stat-row"><span className="progress-stat-label">전체 태스크</span><span className="progress-stat-val">{allTasks.length}개</span></div>
            <div className="progress-stat-row"><span className="progress-stat-label">완료</span><span className="progress-stat-val" style={{ color: 'var(--dg)' }}>{allTasks.filter((t) => t.done).length}개</span></div>
            <div className="progress-stat-row"><span className="progress-stat-label">미완료</span><span className="progress-stat-val" style={{ color: '#e05c5c' }}>{allTasks.filter((t) => !t.done).length}개</span></div>
            <div className="progress-stat-row"><span className="progress-stat-label">카테고리</span><span className="progress-stat-val">{project.categories.length}개</span></div>
          </div>

          {/* 카테고리별 막대 차트 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <svg width="100%" viewBox={`0 0 ${svgW} ${svgH + 36}`} style={{ minWidth: 200 }}>
              <defs>
                <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5fa95f" />
                  <stop offset="100%" stopColor="#a5d9c0" />
                </linearGradient>
              </defs>
              {project.categories.map((cat, i) => {
                const total = cat.tasks.length
                const done = cat.tasks.filter((t) => t.done).length
                const barW = 36; const x = 30 + i * (barW + 44)
                const tH = total ? Math.round((total / maxTasks) * (svgH - 16)) : 0
                const dH = total ? Math.round((done / maxTasks) * (svgH - 16)) : 0
                return (
                  <g key={cat.id}>
                    {total > 0 && <rect x={x} y={svgH - tH} width={barW} height={tH} rx="4" fill="#e0ede5" />}
                    {dH > 0 && <rect x={x} y={svgH - dH} width={barW} height={dH} rx="4" fill="url(#bg2)" />}
                    <text x={x + barW / 2} y={svgH + 16} textAnchor="middle" fontSize="10" fill="#5a7a62">
                      {cat.name.length > 5 ? cat.name.slice(0, 5) + '…' : cat.name}
                    </text>
                    {total > 0 && (
                      <text x={x + barW / 2} y={svgH - tH - 5} textAnchor="middle" fontSize="10" fill="var(--dg)" fontWeight="700">
                        {Math.round((done / total) * 100)}%
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        {/* 카테고리별 카드 */}
        <div className="progress-cats">
          {project.categories.map((cat) => {
            const total = cat.tasks.length
            const done = cat.tasks.filter((t) => t.done).length
            const p2 = total ? Math.round((done / total) * 100) : 0
            return (
              <div key={cat.id} className="progress-cat-card">
                <div className="progress-cat-name">{cat.name}</div>
                <div className="progress-cat-count">{done}/{total}개 완료</div>
                <div className="prog-bar"><div className="prog-bar-fill" style={{ width: `${p2}%` }} /></div>
                <div className="prog-pct">{p2}%</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
