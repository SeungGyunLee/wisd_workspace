import { useState, useEffect } from 'react' // useEffect 추가!
import { todayStr } from '../../../utils/helpers' // uid는 백엔드에서 생성하므로 제거해도 무방합니다
import { api, connectSocket } from '../../../utils/api' // api 도우미와 웹소켓 연결 도우미 추가!
export default function CalendarView({ project, updateProject, notify }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selDate, setSelDate] = useState(todayStr())
  const [newTask, setNewTask] = useState('')

  // ----------------------------------------------------
  // 실시간 새로고침 (웹소켓) - 캘린더 화면에서도 실시간 작동!
  // ----------------------------------------------------
  useEffect(() => {
    const socket = connectSocket(() => {
      console.log('🔄 캘린더 화면: 누군가 일정을 변경했습니다!');
      
      // DB 저장 시간을 벌어주기 위해 0.1초 딜레이 추가
      setTimeout(() => {
        api('GET', `/api/projects/${project.id}/tasks`)
          .then((data) => updateProject({ ...project, categories: data }))
          .catch(() => {})
      }, 100);
      
    })
    return () => socket?.disconnect()
  }, [project.id])

  // 기존 캘린더 날짜/태스크 계산 로직
  const allTasks = project.categories.flatMap((c) => c.tasks)
  const tasksByDate = {}
  allTasks.forEach((t) => {
    if (t.dueDate) {
      const dateOnly = t.dueDate.substring(0, 10); 
      
      if (!tasksByDate[dateOnly]) tasksByDate[dateOnly] = []
      tasksByDate[dateOnly].push(t)
    }
  })

  const prevM = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1) }
  const nextM = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1) }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dipsInPrev = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: dipsInPrev - i, cur: false })
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, cur: true })
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - firstDay - daysInMonth + 1, cur: false })

  const td = todayStr()
  const DAY = ['일', '월', '화', '수', '목', '금', '토']
  const selTasks = tasksByDate[selDate] || []

  // ----------------------------------------------------
  // 캘린더 태스크 추가 (백엔드 api 연동!)
  // ----------------------------------------------------
  const addCalTask = async () => {
    if (!newTask.trim()) return
    if (!project.categories.length) { notify('먼저 계획리스트에서 카테고리를 만들어주세요'); return }

    // 첫 번째 카테고리를 타겟으로 잡기
    const targetCategoryName = project.categories[0].name;

    try {
      // 1. api 도우미로 백엔드에 POST 전송 (토큰 자동 포함!)
      await api('POST', '/api/tasks', {
        project_id: project.id,
        category: targetCategoryName,
        title: newTask.trim(),
        start_date: selDate, // 캘린더에서 선택한 날짜
        end_date: selDate
      });

      // 2. 추가 성공 시, 최신 할 일 목록 다시 불러오기
      const data = await api('GET', `/api/projects/${project.id}/tasks`);
      updateProject({ ...project, categories: data });

      setNewTask('');
      notify('캘린더에 일정이 추가되었습니다! 📅');
    } catch (e) {
      notify('일정 추가에 실패했습니다.');
    }
  }

  return (
    <div>
      <div className="view-title">캘린더</div>
      <div className="view-sub">날짜별 일정을 확인하고 관리하세요</div>
      <div className="calendar-wrap">
        <div className="cal-header">
          <div className="cal-month">{year}년 {month + 1}월</div>
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevM}>‹</button>
            <button className="cal-nav-btn" onClick={nextM}>›</button>
          </div>
        </div>

        <div className="cal-days-header">
          {DAY.map((d) => (
            <div key={d} className="cal-day-label" style={{ color: d === '일' ? '#e05c5c' : d === '토' ? 'var(--dg)' : undefined }}>{d}</div>
          ))}
        </div>

        <div className="cal-grid">
          {cells.map((cell, i) => {
            const ds = cell.cur ? `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}` : ''
            const ts = ds ? tasksByDate[ds] || [] : []
            return (
              <div key={i} className={`cal-cell ${!cell.cur ? 'other-month' : ''} ${ds === td ? 'today' : ''} ${ds === selDate ? 'selected' : ''}`} onClick={() => cell.cur && setSelDate(ds)}>
                <span className="cal-date">{cell.day}</span>
                {ts.length > 0 && (
                  <div className="cal-dots">
                    {ts.slice(0, 3).map((t, j) => <div key={j} className={`cal-dot ${t.done ? 'done' : ''}`} />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="cal-detail">
          <div className="cal-detail-date">{selDate} 일정 ({selTasks.length}개)</div>
          <div className="cal-task-list">
            {selTasks.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)', padding: '6px 0' }}>이 날의 일정이 없습니다</div>}
            {selTasks.map((t) => (
              <div key={t.id} className="cal-task">
                <div style={{ width: 13, height: 13, borderRadius: 3, background: t.done ? 'var(--dg)' : 'transparent', border: `2px solid ${t.done ? 'var(--dg)' : 'var(--border)'}`, flexShrink: 0 }} />
                <span style={{ color: t.done ? 'var(--muted)' : 'var(--dark)', textDecoration: t.done ? 'line-through' : '' }}>{t.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)', background: 'var(--hover)', padding: '1px 7px', borderRadius: 8 }}>
                  {project.categories.find((c) => c.tasks.some((tk) => tk.id === t.id))?.name}
                </span>
              </div>
            ))}
          </div>
          <div className="add-cal-task-row">
            <input className="add-cal-task-input" placeholder="새 일정 추가..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCalTask()} />
            <button className="btn-add-task" onClick={addCalTask}>추가</button>
          </div>
        </div>
      </div>
    </div>
  )
}