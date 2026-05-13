// 프로젝트 이동 뷰
// 이전 프로젝트로 돌아가기 + 다른 프로젝트 선택 기능

export default function NavigateView({ project, projects, projectHistory, goBackProject, navigateToProject, setScreen }) {
  const hasPrev = projectHistory.length > 0
  const prevProj = hasPrev ? projectHistory[projectHistory.length - 1] : null

  return (
    <div>
      <div className="view-title">프로젝트 이동</div>
      <div className="view-sub">다른 프로젝트로 이동하거나 이전 프로젝트로 돌아가세요</div>

      {/* 이전 프로젝트로 돌아가기 버튼 - 히스토리 있을 때만 보임 */}
      {hasPrev && (
        <button className="btn-back" onClick={goBackProject}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 3L5 8L10 13" /></svg>
          "{prevProj.name}"으로 돌아가기
        </button>
      )}

      <div className="nav-wrap">
        {projects.map((proj) => (
          <div key={proj.id} className={`nav-card ${proj.id === project.id ? 'current' : ''}`} onClick={() => proj.id !== project.id && navigateToProject(proj)}>
            <div className="nav-card-icon">{proj.id === project.id ? '★' : '☆'}</div>
            <div className="nav-card-info">
              <div className="nav-card-name">{proj.name}</div>
              <div className="nav-card-meta">{proj.members.length}명 · 카테고리 {proj.categories.length}개</div>
            </div>
            {proj.id === project.id && <span className="nav-card-badge">현재 프로젝트</span>}
          </div>
        ))}

        {/* 프로젝트 목록으로 가는 카드 */}
        <div className="nav-card" style={{ borderStyle: 'dashed', borderColor: 'var(--lg)' }} onClick={() => setScreen('projects')}>
          <div className="nav-card-icon">+</div>
          <div className="nav-card-info">
            <div className="nav-card-name">프로젝트 목록으로 이동</div>
            <div className="nav-card-meta">모든 프로젝트 보기 / 새 프로젝트 생성</div>
          </div>
        </div>
      </div>
    </div>
  )
}
