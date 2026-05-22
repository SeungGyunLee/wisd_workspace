import { useState, useEffect } from 'react'
import { WisdLogo, WisdIcon } from '../common/Logo'
import { uid, fmtDate, getAvatarColor, getInitials, getProgress } from '../../utils/helpers'
import { api } from '../../utils/api' // api 도우미 사용

export default function ProjectsScreen({ user, projects, setProjects, navigateToProject, setScreen, doLogout }) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  // 1. 화면 켜질 때 프로젝트 목록 불러오기
  useEffect(() => {
    api('GET', '/api/projects')
      .then((data) => setProjects(data.map(p => ({
        ...p,
        members: [user.id],
        categories: [],
        posts: [],
        createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
      }))))
      .catch((err) => console.error('프로젝트를 불러오지 못했습니다.', err))
  }, [])
  
  // 2. 새 프로젝트 생성 (백엔드 연동)
  const createProject = async () => {
    if (!newName.trim()) return

    try {
      // api 도우미를 써서 POST 요청 (토큰 알아서 들어감!)
      const result = await api('POST', '/api/projects', { name: newName.trim() })
      
      // 생성 후 최신 목록 다시 불러오기
      const updatedProjects = await api('GET', '/api/projects')
      
      setProjects(updatedProjects.map(p => ({
        ...p,
        members: [user.id],
        categories: [],
        posts: [],
        createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
      })))
      
      const newProj = updatedProjects.find(p => p.id === result.id)
      setShowCreate(false)
      setNewName('')
      
      // 방금 만든 프로젝트로 바로 입장!
      if (newProj) {
        navigateToProject({ ...newProj, members: [user.id], categories: [], posts: [], createdAt: Date.now() })
      }
    } catch (e) {
      alert('프로젝트 생성에 실패했습니다')
      console.error(e)
    }
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div className="projects-logo">
          <WisdIcon size={36} />
          <WisdLogo size={22} />
        </div>
        <div className="user-chip">
          <div className="avatar" style={{ background: getAvatarColor(user.name) }}>
            {getInitials(user.name)}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{user.name}</span>
          <button className="btn-logout" onClick={doLogout}>로그아웃</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--dark)' }}>내 프로젝트</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>프로젝트를 선택하거나 새로 만들어보세요</div>
        </div>
      </div>

      <div className="projects-grid">
        {projects.map((proj) => (
          <div key={proj.id} className="project-card" onClick={() => navigateToProject(proj)}>
            <div className="project-card-name">{proj.name}</div>
            <div className="project-card-meta">{proj.members.length}명 · {fmtDate(proj.createdAt)}</div>
            <div className="project-card-progress">
              <div className="project-card-progress-bar" style={{ width: `${getProgress(proj)}%` }} />
            </div>
            <div className="project-card-pct">진행률 {getProgress(proj)}%</div>
          </div>
        ))}
        
        <div className="create-card" onClick={() => setShowCreate(true)}>
          <div className="create-icon">+</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>새 프로젝트 만들기</div>
        </div>
      </div>

      {showCreate && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <h3>새 프로젝트 만들기</h3>
            <div className="form-group">
              <label className="form-label">프로젝트 이름</label>
              <input
                className="form-input"
                placeholder="프로젝트 이름을 입력하세요"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createProject()}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowCreate(false)}>취소</button>
              <button className="btn-confirm" onClick={createProject}>생성</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}