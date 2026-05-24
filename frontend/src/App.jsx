import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import AuthScreen from './components/auth/AuthScreen'
import ProjectsScreen from './components/projects/ProjectsScreen'
import ProjectScreen from './components/project/ProjectScreen'
import Toast from './components/common/Toast'
import { api } from './utils/api'

export default function App() {
  // 화면 전환 상태
  const [screen, setScreen] = useState('auth')
  const [authMode, setAuthMode] = useState('login')

  // 유저/프로젝트 상태
  const [currentUser, setCurrentUser] = useState(null)
  const [projects, setProjects] = useState([]) // 빈 배열로 시작, 백엔드에서 채움
  const [currentProject, setCurrentProject] = useState(null)
  const [projectHistory, setProjectHistory] = useState([])
  const [activeView, setActiveView] = useState('dashboard')
  const [toast, setToast] = useState(null)

  // ----------------------------------------------------
  // 1. 앱 시작 시 토큰 있으면 자동 로그인
  // ----------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api('GET', '/api/auth/me')
        .then((user) => {
          setCurrentUser(user)
          setScreen('projects')
        })
        .catch(() => localStorage.removeItem('token')) // 토큰 만료시 삭제
    }
  }, [])

  // ----------------------------------------------------
  // 2. 로그인 후 프로젝트 목록 불러오기 & 실시간 동기화
  // ----------------------------------------------------
  useEffect(() => {
    const fetchRealProjects = async () => {
      try {
        // 토큰 포함해서 내 프로젝트만 가져옴
        const data = await api('GET', '/api/projects')
        if (data) {
          setProjects(data.map(p => ({
            id: p.id,
            name: p.name,
            ownerId: p.ownerId || p.owner_id,
            members: p.members || [],
            categories: [],
            posts: [],
            createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
          })))
        }
      } catch (error) {
        console.error('프로젝트를 가져오는데 실패했습니다:', error)
      }
    }

    fetchRealProjects()

    // 웹소켓 연결 - 누군가 변경하면 프로젝트 목록 새로고침
    const socket = io('http://152.67.199.142:3000')
    socket.on('task_updated', fetchRealProjects)
    return () => socket.disconnect() // 화면 종료시 소켓 끊기
  }, [currentUser]) // currentUser 바뀔 때마다 실행 (로그인/로그아웃)

  // ----------------------------------------------------
  // 3. 프로젝트 이동 관련 함수
  // ----------------------------------------------------

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

  // 로그아웃 - 모든 상태 초기화 및 토큰 삭제
  const doLogout = () => {
    setCurrentUser(null)
    setCurrentProject(null)
    setProjectHistory([])
    setProjects([]) // 프로젝트 목록 초기화 (다른 계정 프로젝트 안 보이게)
    setScreen('auth')
    localStorage.removeItem('token')
  }

  // ----------------------------------------------------
  // 4. 화면 렌더링
  // ----------------------------------------------------

  // 로그인/회원가입 화면
  if (screen === 'auth') {
    return (
      <AuthScreen
        setCurrentUser={setCurrentUser}
        setScreen={setScreen}
        authMode={authMode}
        setAuthMode={setAuthMode}
      />
    )
  }

  // 프로젝트 목록 화면
  if (screen === 'projects') {
    return (
      <ProjectsScreen
        user={currentUser}
        projects={projects}
        setProjects={setProjects}
        navigateToProject={navigateToProject}
        setScreen={setScreen}
        doLogout={doLogout}
      />
    )
  }

  // 프로젝트 내부 화면
  return (
    <>
      <ProjectScreen
        user={currentUser}
        project={currentProject}
        projects={projects}
        activeView={activeView}
        setActiveView={setActiveView}
        updateProject={updateProject}
        projectHistory={projectHistory}
        goBackProject={goBackProject}
        navigateToProject={navigateToProject}
        setScreen={setScreen}
        showToast={setToast}
        users={[]}
        doLogout={doLogout}
        setCurrentUser={setCurrentUser}
        setProjects={setProjects}
      />
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  )
}
