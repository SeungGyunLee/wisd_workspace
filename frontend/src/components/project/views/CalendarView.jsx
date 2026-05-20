import { useState } from 'react'
import { uid, todayStr } from '../../../utils/helpers'

export default function CalendarView({ project, updateProject, notify }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selDate, setSelDate] = useState(todayStr())
  const [newTask, setNewTask] = useState('')

  const allTasks = project.categories.flatMap((c) => c.tasks)
  const tasksByDate = {}
  allTasks.forEach((t) => {
    if (t.dueDate) {
      if (!tasksByDate[t.dueDate]) tasksByDate[t.dueDate] = []
      tasksByDate[t.dueDate].push(t)
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

// 캘린더에서 바로 태스크 추가 (백엔드 연동)
  const addCalTask = async () => {
    if (!newTask.trim()) return;
    
    // 작성자님의 원래 센스있는 방어 코드 유지! (카테고리 없으면 튕겨내기)
    if (!project.categories.length) { 
      notify('먼저 계획리스트에서 카테고리를 만들어주세요'); 
      return; 
    }

    // 첫 번째 카테고리의 이름을 타겟으로 잡습니다.
    const targetCategoryName = project.categories[0].name;

    try {
      // 1. 백엔드로 "이 날짜(selDate)에 일정 좀 추가해줘!" 라고 POST 쏘기
      const response = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: project.id,       // 현재 열려있는 프로젝트 방 번호
          category: targetCategoryName, // 첫 번째 카테고리 이름
          title: newTask.trim(),        // 입력한 일정 내용
          start_date: selDate,          // 캘린더에서 선택한 날짜
          end_date: selDate             // 캘린더에서 선택한 날짜
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // 2. 백엔드에서 생성해준 진짜 번호(taskId)를 달아서 포스트잇 만들기 (500 에러 방지!)
        const task = { 
          id: data.taskId, 
          title: newTask.trim(), 
          done: false, 
          dueDate: selDate, 
          pinned: false 
        };

        // 3. 프론트엔드 화면 업데이트 (첫 번째 카테고리에 쏙 밀어넣기)
        updateProject({
          ...project,
          categories: project.categories.map((c, i) => i === 0 ? { ...c, tasks: [...c.tasks, task] } : c),
        });
        
        setNewTask(''); // 입력칸 비우기
        notify('캘린더에 일정이 추가되었습니다! 📅');
      } else {
        alert('일정 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('서버 통신 에러:', error);
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
