import { useState } from 'react'
import Sidebar from './Sidebar'
import DashboardView from './views/DashboardView'
import PlanListView from './views/PlanListView'
import CalendarView from './views/CalendarView'
import ProgressView from './views/ProgressView'
import ShareView from './views/ShareView'
import TeamView from './views/TeamView'
import NavigateView from './views/NavigateView'

export default function ProjectScreen({
  user, project, projects, activeView, setActiveView,
  updateProject, projectHistory, goBackProject, navigateToProject,
  setScreen, showToast, users, doLogout, setCurrentUser,
}) {
  const [showClose, setShowClose] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        project={project}
        activeView={activeView}
        setActiveView={setActiveView}
        doLogout={doLogout}
        setCurrentUser={setCurrentUser}
        showToast={showToast}
        onCloseProject={() => setShowClose(true)}
      />

      <div className="main-content">
        {activeView === 'dashboard' && <DashboardView project={project} setActiveView={setActiveView} updateProject={updateProject} />}
        {activeView === 'progress' && <ProgressView project={project} />}
        {activeView === 'planlist' && <PlanListView project={project} updateProject={updateProject} notify={showToast} />}
        {activeView === 'calendar' && <CalendarView project={project} updateProject={updateProject} notify={showToast} />}
        {activeView === 'share' && <ShareView project={project} updateProject={updateProject} user={user} users={users} notify={showToast} />}
        {activeView === 'team' && <TeamView project={project} updateProject={updateProject} user={user} users={users} notify={showToast} />}
        {activeView === 'navigate' && <NavigateView project={project} projects={projects} projectHistory={projectHistory} goBackProject={goBackProject} navigateToProject={navigateToProject} setScreen={setScreen} />}
      </div>

      {/* 프로젝트 마감 모달 */}
      {showClose && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setShowClose(false)}>
          <div className="modal" style={{ width: 400 }}>
            <h3>프로젝트 마감</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
              마감 방법을 선택해주세요. 보관은 나중에 다시 확인할 수 있고, 삭제는 복구가 불가능합니다.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {/* 보관하기 */}
              <button
                style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--hover)', border: '1.5px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: '.2s' }}
                onClick={() => { setShowClose(false); showToast('프로젝트가 보관되었습니다'); setScreen('projects') }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 3 }}>📦 보관하기</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>프로젝트를 보관합니다. 보관된 프로젝트는 목록에서 다시 열 수 있습니다.</div>
              </button>
              {/* 영구 삭제 */}
              <button
                style={{ padding: '14px 16px', borderRadius: 12, background: '#fff5f5', border: '1.5px solid #fcc', cursor: 'pointer', textAlign: 'left', transition: '.2s' }}
                onClick={() => { setShowClose(false); showToast('프로젝트가 삭제되었습니다'); setScreen('projects') }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e05c5c', marginBottom: 3 }}>🗑 영구 삭제</div>
                <div style={{ fontSize: 12, color: '#c08080' }}>프로젝트를 완전히 삭제합니다. 이 작업은 되돌릴 수 없습니다.</div>
              </button>
            </div>
            <button className="btn-cancel" style={{ width: '100%' }} onClick={() => setShowClose(false)}>취소</button>
          </div>
        </div>
      )}
    </div>
  )
}
