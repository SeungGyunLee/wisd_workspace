import { useState, useEffect } from 'react'
import AuthScreen from './components/auth/AuthScreen'
import ProjectsScreen from './components/projects/ProjectsScreen'
import ProjectScreen from './components/project/ProjectScreen'
import Toast from './components/common/Toast'
import { INIT_USERS, INIT_PROJECTS } from './data/sampleData'
import { api } from './utils/api'

export default function App() {
  // 화면 전환 상태
  const [screen, setScreen] = useState('auth')
  const [authMode, setAuthMode] = useState('login')

  // 유저/프로젝트 상태
  // 나중에 API 연동하면 여기서 fetch 해서 채우면 됨
  const [users, setUsers] = useState(INIT_USERS)
  const [currentUser, setCurrentUser] = useState(null)
  const [projects, setProjects] = useState(INIT_PROJECTS)
  const [currentProject, setCurrentProject] = useState(null)
  const [projectHistory, setProjectHistory] = useState([])
  const [activeView, setActiveView] = useState('dashboard')
  const [toast, setToast] = useState(null)

  useEffect(() => {
  const token = localStorage.getItem('token')
  if (token) {
    api('GET', '/me')
      .then((user) => {
        setCurrentUser(user)
        setScreen('projects')
      })
      .catch(() => {
        localStorage.removeItem('token')
      })
  }
}, [])

  // 프로젝트 이동 시 이전 프로젝트를 히스토리에 쌓음
  const navigateToProject = (proj) => {
    if (currentProject && currentProject.id !== proj.id) {
      setProjectHistory((h) => [...h, currentProject])
    }
    setCurrentProject(proj)
    setActiveView('dashboard')
    setScreen('project')
  }

  // 이전 프로젝트로 돌아가기
  const goBackProject = () => {
    if (!projectHistory.length) return
    const prev = projectHistory[projectHistory.length - 1]
    setProjectHistory((h) => h.slice(0, -1))
    setCurrentProject(prev)
    setActiveView('dashboard')
    setToast(`"${prev.name}"으로 돌아왔습니다`)
  }

  // 프로젝트 업데이트 - 현재 프로젝트랑 히스토리에도 반영
  const updateProject = (proj) => {
    setProjects((ps) => ps.map((p) => p.id === proj.id ? proj : p))
    setCurrentProject(proj)
    setProjectHistory((h) => h.map((p) => p.id === proj.id ? proj : p))
  }

  const doLogout = () => {
    setCurrentUser(null)
    setCurrentProject(null)
    setProjectHistory([])
    setScreen('auth')
  }

  // 내 프로젝트만 필터링
  const myProjects = projects.filter(
    (p) => currentUser && (p.members.includes(currentUser.id) || p.ownerId === currentUser.id)
  )

  if (screen === 'auth') {
    return (
      <AuthScreen
        users={users}
        setUsers={setUsers}
        setCurrentUser={setCurrentUser}
        setScreen={setScreen}
        authMode={authMode}
        setAuthMode={setAuthMode}
      />
    )
  }

  if (screen === 'projects') {
    return (
      <ProjectsScreen
        user={currentUser}
        projects={myProjects}
        setProjects={setProjects}
        navigateToProject={navigateToProject}
        setScreen={setScreen}
        doLogout={doLogout}
      />
    )
  }

  return (
    <>
      <ProjectScreen
        user={currentUser}
        project={currentProject}
        projects={myProjects}
        activeView={activeView}
        setActiveView={setActiveView}
        updateProject={updateProject}
        projectHistory={projectHistory}
        goBackProject={goBackProject}
        navigateToProject={navigateToProject}
        setScreen={setScreen}
        showToast={setToast}
        users={users}
        doLogout={doLogout}
        setCurrentUser={setCurrentUser}
      />
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  )
}
