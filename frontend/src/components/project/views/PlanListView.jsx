import { useState, useEffect } from 'react'
import { uid } from '../../../utils/helpers'
import { api, connectSocket } from '../../../utils/api'

export default function PlanListView({ project, updateProject, notify }) {
  const [newCatName, setNewCatName] = useState('')
  const [showAddCat, setShowAddCat] = useState(false)
  const [editCatId, setEditCatId] = useState(null)
  const [editCatName, setEditCatName] = useState('')
  const [addInputs, setAddInputs] = useState({})
  const [addDates, setAddDates] = useState({})
  const [editTaskId, setEditTaskId] = useState(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDate, setEditTaskDate] = useState('')

  useEffect(() => {
    api('GET', `/api/projects/${project.id}/tasks`)
      .then((data) => updateProject({ ...project, categories: data }))
      .catch(() => {})
  }, [project.id])

  useEffect(() => {
    const socket = connectSocket(() => {
      api('GET', `/api/projects/${project.id}/tasks`)
        .then((data) => updateProject({ ...project, categories: data }))
    })
    return () => socket?.disconnect()
  }, [project.id])


  // 카테고리 추가
  const addCat = async () => {
    if (!newCatName.trim()) return
    try {
      await api('POST', '/api/tasks', {
        project_id: project.id,
        category: newCatName.trim(),
        title: '임시',
        start_date: null,
        end_date: null,
      })
      const data = await api('GET', `/api/projects/${project.id}/tasks`)
      updateProject({ ...project, categories: data })
      setNewCatName(''); setShowAddCat(false)
    } catch (e) {
      notify('카테고리 생성에 실패했습니다')
    }
  }


  const delCat = (id) => {
    updateProject({ ...project, categories: project.categories.filter((c) => c.id !== id) })
    notify('카테고리가 삭제되었습니다')
  }

  const saveCat = async (id) => {
    if (!editCatName.trim()) return
    const cat = project.categories.find(c => c.id === id)
    try {
      await api('PUT', `/api/projects/${project.id}/categories`, {
        oldName: cat.name,
        newName: editCatName.trim(),
      })
      const data = await api('GET', `/api/projects/${project.id}/tasks`)
      updateProject({ ...project, categories: data })
      setEditCatId(null)
    } catch (e) {
      notify('카테고리 수정에 실패했습니다')
    }
  }

  // 태스크 추가
  const addTask = async (catId) => {
    const title = (addInputs[catId] || '').trim()
    if (!title) return
    const cat = project.categories.find(c => c.id === catId)
    try {
      await api('POST', '/api/tasks', {
        project_id: project.id,
        category: cat.name,
        title,
        start_date: addDates[catId] || null,
        end_date: addDates[catId] || null,
      })
      const data = await api('GET', `/api/projects/${project.id}/tasks`)
      updateProject({ ...project, categories: data })
      setAddInputs((v) => ({ ...v, [catId]: '' }))
      setAddDates((v) => ({ ...v, [catId]: '' }))
    } catch (e) {
      notify('할 일 추가에 실패했습니다')
    }
  }

  const toggleTask = async (catId, taskId) => {
    const cat = project.categories.find(c => c.id === catId)
    const task = cat.tasks.find(t => t.id === taskId)
    try {
      await api('PUT', `/api/tasks/${taskId}`, {
        category: cat.name,
        title: task.title,
        status: task.done ? 'TODO' : 'DONE',
        start_date: task.dueDate || null,
        end_date: task.dueDate || null,
      })
      const data = await api('GET', `/api/projects/${project.id}/tasks`)
      updateProject({ ...project, categories: data })
    } catch (e) {
      notify('상태 변경에 실패했습니다')
    }
  }

  const togglePin = (catId, taskId) =>
    updateProject({ ...project, categories: project.categories.map((c) => c.id === catId ? { ...c, tasks: c.tasks.map((t) => t.id === taskId ? { ...t, pinned: !t.pinned } : t) } : c) })

  const delTask = async (catId, taskId) => {
    try {
      await api('DELETE', `/api/tasks/${taskId}`)
      const data = await api('GET', `/api/projects/${project.id}/tasks`)
      updateProject({ ...project, categories: data })
    } catch (e) {
      notify('할 일 삭제에 실패했습니다')
    }
  }

  const startEditTask = (task) => { setEditTaskId(task.id); setEditTaskTitle(task.title); setEditTaskDate(task.dueDate || '') }

  // 태스크 수정
  const saveTask = async (catId) => {
    if (!editTaskTitle.trim()) return
    const cat = project.categories.find(c => c.id === catId)
    try {
      await api('PUT', `/api/tasks/${editTaskId}`, {
        category: cat.name,
        title: editTaskTitle.trim(),
        status: 'TODO',
        start_date: editTaskDate || null,
        end_date: editTaskDate || null,
      })
      const data = await api('GET', `/api/projects/${project.id}/tasks`)
      updateProject({ ...project, categories: data })
      setEditTaskId(null)
      notify('할 일이 수정되었습니다')
    } catch (e) {
      notify('할 일 수정에 실패했습니다')
    }
  }

  return (
    <div>
      <div className="view-title">계획리스트</div>
      <div className="view-sub">카테고리별 작업 관리 · 📌 버튼으로 대시보드에 고정</div>
      <div className="plan-list-wrap">
        {project.categories.length === 0 && !showAddCat && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">아직 카테고리가 없습니다</div>
            <div className="empty-sub">아래 버튼으로 카테고리를 만들어보세요</div>
          </div>
        )}

        {project.categories.map((cat) => {
          const done = cat.tasks.filter((t) => t.done).length
          const total = cat.tasks.length
          const pct = total ? Math.round((done / total) * 100) : 0

          return (
            <div key={cat.id} className="category-card">
              <div className="category-header">
                {editCatId === cat.id ? (
                  <div style={{ display: 'flex', gap: 7, flex: 1, marginRight: 7 }}>
                    <input className="form-input" style={{ padding: '5px 10px', fontSize: 12 }} value={editCatName} onChange={(e) => setEditCatName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveCat(cat.id)} autoFocus />
                    <button className="btn-confirm" style={{ padding: '5px 13px', fontSize: 11 }} onClick={() => saveCat(cat.id)}>저장</button>
                    <button className="btn-cancel" style={{ padding: '5px 11px', fontSize: 11 }} onClick={() => setEditCatId(null)}>취소</button>
                  </div>
                ) : (
                  <div className="category-name">
                    {cat.name}
                    <span className="category-badge">{done}/{total}</span>
                  </div>
                )}
                {editCatId !== cat.id && (
                  <div className="category-actions">
                    <button className="cat-btn cat-btn-edit" onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name) }}>수정</button>
                    <button className="cat-btn cat-btn-del" onClick={() => delCat(cat.id)}>삭제</button>
                  </div>
                )}
              </div>

              {total > 0 && (
                <div className="cat-progress">
                  <div className="cat-progress-bar" style={{ width: `${pct}%` }} />
                </div>
              )}

              <div className="tasks-list">
                {cat.tasks.map((task) => (
                  <div key={task.id}>
                    {editTaskId === task.id ? (
                      // 태스크 수정 모드
                      <div style={{ display: 'flex', gap: 7, padding: '6px 8px', background: 'var(--hover)', borderRadius: 8, alignItems: 'center' }}>
                        <input
                          style={{ flex: 1, padding: '5px 9px', borderRadius: 7, border: '1.5px solid var(--mg)', fontSize: 12, background: 'var(--white)', outline: 'none' }}
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveTask(cat.id)}
                          autoFocus
                        />
                        <input
                          type="date"
                          style={{ padding: '5px 7px', borderRadius: 7, border: '1.5px solid var(--border)', fontSize: 11, background: 'var(--bg)', color: 'var(--muted)', cursor: 'pointer' }}
                          value={editTaskDate}
                          onChange={(e) => setEditTaskDate(e.target.value)}
                        />
                        <button style={{ padding: '5px 11px', borderRadius: 7, background: 'var(--dg)', color: 'white', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }} onClick={() => saveTask(cat.id)}>저장</button>
                        <button style={{ padding: '5px 9px', borderRadius: 7, background: 'transparent', color: 'var(--muted)', fontSize: 11, border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setEditTaskId(null)}>취소</button>
                      </div>
                    ) : (
                      <div className="task-item">
                        <div className={`task-check ${task.done ? 'done' : ''}`} onClick={() => toggleTask(cat.id, task.id)}>
                          {task.done && (
                            <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className={`task-title ${task.done ? 'done' : ''}`}>{task.title}</span>
                        {task.dueDate && <span className="task-date">{task.dueDate}</span>}
                        <button
                          style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 7px', borderRadius: 5, background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', transition: '.15s', fontFamily: 'inherit' }}
                          onClick={() => startEditTask(task)}
                        >수정</button>
                        <button className={`task-pin-btn ${task.pinned ? 'pinned' : ''}`} onClick={() => togglePin(cat.id, task.id)} title={task.pinned ? '고정 해제' : '대시보드에 고정'}>📌</button>
                        <button className="task-del" onClick={() => delTask(cat.id, task.id)}>✕</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="add-task-row">
                <input className="add-task-input" placeholder="새 할 일 추가..." value={addInputs[cat.id] || ''} onChange={(e) => setAddInputs((v) => ({ ...v, [cat.id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addTask(cat.id)} />
                <input type="date" className="add-task-date" value={addDates[cat.id] || ''} onChange={(e) => setAddDates((v) => ({ ...v, [cat.id]: e.target.value }))} />
                <button className="btn-add-task" onClick={() => addTask(cat.id)}>추가</button>
              </div>
            </div>
          )
        })}

        {showAddCat ? (
          <div style={{ background: 'var(--white)', borderRadius: 14, border: '1.5px solid var(--border)', padding: 16 }}>
            <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>새 카테고리 이름</div>
            <div style={{ display: 'flex', gap: 7 }}>
              <input className="form-input" placeholder="예: 기획, 개발, 디자인..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCat()} autoFocus />
              <button className="btn-confirm" style={{ padding: '0 16px', fontSize: 12 }} onClick={addCat}>추가</button>
              <button className="btn-cancel" style={{ padding: '0 12px', fontSize: 12 }} onClick={() => setShowAddCat(false)}>취소</button>
            </div>
          </div>
        ) : (
          <button className="add-category-btn" onClick={() => setShowAddCat(true)}>
            <span style={{ fontSize: 18, color: 'var(--mg)' }}>+</span>카테고리 추가
          </button>
        )}
      </div>
    </div>
  )
}
