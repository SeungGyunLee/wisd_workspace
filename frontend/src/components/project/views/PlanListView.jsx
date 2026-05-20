import { useState } from 'react'
import { uid } from '../../../utils/helpers'

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

  // 카테고리 추가
  // 나중에 POST /api/projects/:id/categories 로 교체
  const addCat = () => {
    if (!newCatName.trim()) return
    const cat = { id: uid(), name: newCatName.trim(), tasks: [] }
    updateProject({ ...project, categories: [...project.categories, cat] })
    setNewCatName(''); setShowAddCat(false)
  }

  // 카테고리 삭제 (백엔드 연동)
  const delCat = async (id) => {
    // 1. 실수로 누를 수 있으니 한 번 물어보기
    if (!window.confirm('이 카테고리와 안에 있는 모든 할 일이 삭제됩니다. 계속하시겠습니까?')) return;

    // 2. 삭제할 카테고리 정보 찾기
    const categoryToDelete = project.categories.find(c => c.id === id);
    if (!categoryToDelete) return;

    try {
      // 3. 카테고리 안에 있는 모든 할 일(Task)들을 DB에서 하나씩 찢어버리기(DELETE)
      for (const task of categoryToDelete.tasks) {
        // 우리가 아까 만든 할 일 삭제 API를 여기서 재활용합니다!
        await fetch(`http://localhost:3000/api/tasks/${task.id}`, {
          method: 'DELETE',
        });
      }

      // 4. DB에서 다 지워졌으면, 프론트엔드 화면에서도 카테고리 날려버리기
      updateProject({ 
        ...project, 
        categories: project.categories.filter((c) => c.id !== id) 
      });
      notify('카테고리와 할 일들이 완벽하게 삭제되었습니다! 🗑️');
      
    } catch (error) {
      console.error('카테고리 삭제 중 에러 발생:', error);
      alert('카테고리 삭제에 실패했습니다.');
    }
  }

  // 카테고리 수정 (백엔드 연동 )
  const saveCat = async (catId) => {
    if (!editCatName.trim()) return

    // 1. 프론트엔드 화면에서 옛날 카테고리 이름 찾기 (백엔드한테 알려주기 위해)
    const oldCatName = project.categories.find(c => c.id === catId)?.name || "";

    try {
      // 2. 백엔드로 옛날 이름 -> 새 이름으로 바꿔달라고 요청 쏘기!
      const response = await fetch(`http://localhost:3000/api/projects/${project.id}/categories`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldName: oldCatName, 
          newName: editCatName.trim()
        }),
      });

      if (response.ok) {
        // 3. 성공하면 프론트 화면(UI)도 새 이름으로 바꿔주기
        updateProject({
          ...project,
          categories: project.categories.map((c) => c.id === catId ? { ...c, name: editCatName.trim() } : c),
        })
        setEditCatId(null)
        notify('카테고리 이름이 변경되었습니다!')
      } else {
        alert('카테고리 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('서버 통신 에러:', error);
    }
  }

  // 태스크 추가 (백엔드 연동)
  const addTask = async (catId) => {
    const title = (addInputs[catId] || '').trim()
    if (!title) return

    // 1. 프론트엔드 화면에서 현재 카테고리 이름 찾기
    const categoryName = project.categories.find(c => c.id === catId)?.name || "기본";
    const dueDate = addDates[catId] || '';

    try {
      // 2. 백엔드(MySQL)로 데이터 쏘기! (아까 테스트했던 그 형식 그대로입니다)
      const response = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: project.id,
          category: categoryName,
          title: title,
          start_date: dueDate || null, // 프론트 화면엔 날짜가 1개뿐이라 일단 똑같이 넣습니다
          end_date: dueDate || null // 날짜가 비어있으면 null
        }),
      });

      if (response.ok) {
        // 3. 성공하면 백엔드에서 생성된 진짜 Task ID를 받아옵니다 (id가 반환된다고 가정)
        const data = await response.json();
        
        // 4. 화면(UI)에 반영하기
        const task = { 
          id: data.taskId, // 백엔드가 준 진짜 번호 장착!
          title, 
          done: false, 
          dueDate, 
          pinned: false 
        }
        
        updateProject({
          ...project,
          categories: project.categories.map((c) => 
            c.id === catId ? { ...c, tasks: [...c.tasks, task] } : c
          ),
        })
        
        // 입력창 비우기
        setAddInputs((v) => ({ ...v, [catId]: '' }))
        setAddDates((v) => ({ ...v, [catId]: '' }))
        notify('할 일이 성공적으로 추가되었습니다! 🎉')
      } else {
        alert('할 일 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('서버 에러:', error);
    }
  }

  // 할 일 완료 상태 변경 (백엔드 연동)
  const toggleTask = async (catId, taskId) => {
    // 1. 현재 클릭한 할 일(Task)과 카테고리(Category)의 정보 찾기
    const category = project.categories.find(c => c.id === catId);
    const task = category.tasks.find(t => t.id === taskId);
    if (!category || !task) return;

    // 2. 바뀔 상태 결정 (지금 체크되어 있으면 해제(TODO), 안 되어있으면 완료(DONE))
    const newStatus = task.done ? 'TODO' : 'DONE';

    try {
      // 3. 백엔드로 "이 할 일 상태 좀 바꿔줘!" 라고 요청(PUT) 쏘기
      const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: category.name,
          title: task.title,
          status: newStatus, // 핵심! 'DONE' 또는 'TODO'를 보냅니다.
          start_date: task.dueDate || null,
          end_date: task.dueDate || null
        }),
      });

      if (response.ok) {
        // 4. 백엔드(DB) 업데이트 성공 시, 프론트엔드 화면의 체크박스도 바꿔주기!
        updateProject({
          ...project,
          categories: project.categories.map((c) => c.id === catId
            ? { ...c, tasks: c.tasks.map((t) => t.id === taskId ? { ...t, done: !t.done } : t) }
            : c),
        });
      } else {
        console.error('할 일 상태 변경 실패');
      }
    } catch (error) {
      console.error('서버 통신 에러:', error);
    }
  }

  const togglePin = (catId, taskId) =>
    updateProject({ ...project, categories: project.categories.map((c) => c.id === catId ? { ...c, tasks: c.tasks.map((t) => t.id === taskId ? { ...t, pinned: !t.pinned } : t) } : c) })

  // 할 일(포스트잇 1개) 삭제 (백엔드 연동)
  const delTask = async (catId, taskId) => {
    if (!window.confirm('정말로 이 할 일을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        updateProject({
          ...project,
          categories: project.categories.map((c) => c.id === catId
            ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }
            : c),
        });
        notify('할 일이 영구적으로 삭제되었습니다! 🗑️');
      } else {
        alert('할 일 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('서버 통신 에러:', error);
    }
  }

  const startEditTask = (task) => { setEditTaskId(task.id); setEditTaskTitle(task.title); setEditTaskDate(task.dueDate || '') }

  // 할 일 수정 (백엔드 연동)
  const saveTask = async (catId) => {
    if (!editTaskTitle.trim()) return

    // 1. 현재 카테고리와 기존 할 일 정보 찾기
    const category = project.categories.find(c => c.id === catId);
    const task = category?.tasks.find(t => t.id === editTaskId);
    
    // 2. 500 에러 방지용! 기존 완료 상태(status) 그대로 유지해서 보내주기
    const currentStatus = task?.done ? 'DONE' : 'TODO'; 
    const categoryName = category?.name || "미분류";

    try {
      const response = await fetch(`http://localhost:3000/api/tasks/${editTaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: categoryName,
          title: editTaskTitle.trim(),
          status: currentStatus,
          start_date: editTaskDate || null,
          end_date: editTaskDate || null
        }),
      });

      if (response.ok) {
        updateProject({
          ...project,
          categories: project.categories.map((c) => c.id === catId
            ? { ...c, tasks: c.tasks.map((t) => t.id === editTaskId ? { ...t, title: editTaskTitle.trim(), dueDate: editTaskDate } : t) }
            : c),
        })
        setEditTaskId(null)
        notify('할 일이 성공적으로 수정되었습니다! ✏️')
      } else {
        alert('할 일 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('서버 통신 에러:', error);
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
