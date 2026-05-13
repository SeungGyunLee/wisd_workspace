import { useState } from 'react'
import { WisdLogo, WisdIcon } from '../common/Logo'
import { uid, fmtDate, getAvatarColor, getInitials, getProgress } from '../../utils/helpers'

export default function ProjectsScreen({ user, projects, setProjects, navigateToProject, setScreen, doLogout }) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  // 프로젝트 생성
  // 나중에 POST /api/projects 로 교체
  const createProject = () => {
    if (!newName.trim()) return
    const proj = {
      id: uid(),
      name: newName.trim(),
      ownerId: user.id,
      members: [user.id],
      categories: [],
      posts: [],
      createdAt: Date.now(),
    }
    setProjects((ps) => [...ps, proj])
    setShowCreate(false)
    setNewName('')
    navigateToProject(proj)
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
