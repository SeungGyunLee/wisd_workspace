import { useState } from 'react'
import { WisdLogo, WisdIcon } from '../common/Logo'
import { uid, fmtDate, getAvatarColor, getInitials, getProgress } from '../../utils/helpers'

export default function ProjectsScreen({ user, projects, setProjects, navigateToProject, setScreen, doLogout }) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  // 프로젝트 생성 (백엔드 연동 버전)
  const createProject = async () => {
    if (!newName.trim()) return

    try {
      // 1. 우리 서버(포트 3000)로 새 프로젝트 만들어달라고 요청(POST) 쏘기!
      const response = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName.trim(),
          description: "프론트엔드 화면에서 만든 프로젝트입니다!" // 우리 DB에는 description이 필수니까 임시로 넣어줍니다.
        }),
      });

      if (response.ok) {
        // 2. 서버가 성공했다고 응답하면, DB에서 새로 발급해준 '진짜 ID(projectId)'를 받아옵니다.
        const data = await response.json(); 
        
        // 3. 프론트엔드 화면(UI)에 반영할 데이터 만들기 (가짜 id 대신 진짜 DB id 사용!)
        const proj = {
          id: data.id, // 여기가 핵심! MySQL이 만들어준 진짜 번호가 꽂힙니다.
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
      } else {
        alert('프로젝트 생성에 실패했습니다 (서버 에러)');
      }
    } catch (error) {
      console.error('서버 통신 에러:', error);
      alert('서버와 연결이 끊어졌습니다. 백엔드 서버가 켜져 있는지 확인하세요!');
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