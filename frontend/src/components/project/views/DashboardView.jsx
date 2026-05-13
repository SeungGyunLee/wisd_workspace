import { useState } from 'react'
import DonutChart from '../../common/DonutChart'
import { getProgress, todayStr, AVATAR_COLORS, getInitials } from '../../../utils/helpers'

// 대시보드에서 보여주는 미니 캘린더
function MiniCalendar({ project }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const allTasks = project.categories.flatMap((c) => c.tasks)
  const taskDates = new Set(allTasks.map((t) => t.dueDate).filter(Boolean))

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, cur: false })
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, cur: true })
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - firstDay - daysInMonth + 1, cur: false })

  const td = todayStr()
  const DAY = ['일', '월', '화', '수', '목', '금', '토']

  const prevM = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1) }
  const nextM = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1) }

  return (
    <div className="dash-cal-card">
      <div className="dash-cal-title">
        <span style={{ fontSize: 13, fontWeight: 700 }}>{year}년 {month + 1}월</span>
        <div className="dash-cal-nav">
          <button className="dash-cal-nav-btn" onClick={prevM}>‹</button>
          <button className="dash-cal-nav-btn" onClick={nextM}>›</button>
        </div>
      </div>
      <div className="mini-cal-grid">
        {DAY.map((d) => (
          <div key={d} className="mini-cal-label" style={{ color: d === '일' ? '#e05c5c' : d === '토' ? 'var(--dg)' : undefined }}>{d}</div>
        ))}
        {cells.map((cell, i) => {
          const ds = cell.cur ? `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}` : ''
          const hasTask = ds && taskDates.has(ds)
          const isToday = ds === td
          return (
            <div key={i} className={`mini-cal-cell ${!cell.cur ? 'other' : ''} ${isToday ? 'today' : ''} ${hasTask ? 'has-task' : ''}`}>
              {cell.day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 대시보드에서 보여주는 고정 할일 목록
function PinnedTasks({ project, updateProject }) {
  const pinned = project.categories.flatMap((c) =>
    c.tasks.filter((t) => t.pinned).map((t) => ({ ...t, catName: c.name, catId: c.id }))
  )

  const toggle = (catId, taskId) => {
    updateProject({
      ...project,
      categories: project.categories.map((c) =>
        c.id === catId ? { ...c, tasks: c.tasks.map((t) => t.id === taskId ? { ...t, done: !t.done } : t) } : c
      ),
    })
  }

  return (
    <div className="dash-pin-card">
      <div className="dash-pin-title">
        📌 고정된 할 일
        <span className="pin-badge">{pinned.length}개</span>
      </div>
      {pinned.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--muted)', padding: '10px 0', textAlign: 'center' }}>
          계획리스트에서 📌 버튼으로 고정하세요
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {pinned.map((t) => (
            <div key={t.id} className="pin-task-item">
              <div className={`pin-task-check ${t.done ? 'done' : ''}`} onClick={() => toggle(t.catId, t.id)}>
                {t.done && (
                  <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`pin-task-name ${t.done ? 'done' : ''}`}>{t.title}</span>
              <span className="pin-task-cat">{t.catName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardView({ project, setActiveView, updateProject }) {
  const tasks = project.categories.flatMap((c) => c.tasks)
  const pct = getProgress(project)

  return (
    <div>
      <div className="view-title">{project.name}</div>
      <div className="view-sub">프로젝트 전체 현황</div>

      {/* 전체 완성도 */}
      <div className="dash-top">
        <div className="donut-wrap">
          <DonutChart pct={pct} size={110} />
          <div className="donut-label">
            <span className="donut-pct">{pct}%</span>
            <span className="donut-sub">전체 완성도</span>
          </div>
        </div>
        <div className="dash-info">
          <h2>{pct < 30 ? '시작이 반!' : pct < 70 ? '순항 중이에요' : pct < 100 ? '거의 다 왔어요!' : '완성!'}</h2>
          <p style={{ marginBottom: 12 }}>
            {tasks.filter((t) => t.done).length} / {tasks.length}개 태스크 완료 · {project.categories.length}개 카테고리
          </p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {project.members.map((mid, i) => (
              <div key={mid} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--hover)', padding: '4px 10px', borderRadius: 18, fontSize: 11, color: 'var(--dark)', border: '1px solid var(--border)' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: 'white', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getInitials(mid)}
                </div>
                {mid}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 미니 캘린더 + 고정 할일 */}
      <div className="dash-mid">
        <MiniCalendar project={project} />
        <PinnedTasks project={project} updateProject={updateProject} />
      </div>

      {/* 바로가기 카드 */}
      <div className="dash-cards">
        {[
          { id: 'planlist', icon: '☑', label: '계획리스트', color: '#edf7ee', desc: `${tasks.length}개 태스크` },
          { id: 'calendar', icon: '📅', label: '캘린더', color: '#e8f4fa', desc: '일정 관리' },
          { id: 'progress', icon: '📊', label: '진행도', color: '#f5f0e8', desc: `${pct}% 달성` },
          { id: 'share', icon: '💬', label: '중간 공유', color: '#f0edf7', desc: `${project.posts.length}개 게시물` },
        ].map((card) => (
          <div key={card.id} className="dash-card" onClick={() => setActiveView(card.id)}>
            <div className="dash-card-icon" style={{ background: card.color }}>{card.icon}</div>
            <div className="dash-card-text">{card.label}</div>
            <div className="dash-card-meta">{card.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
