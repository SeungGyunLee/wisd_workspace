import { useState, useEffect } from 'react'
import { io } from 'socket.io-client' // 실시간 라디오 수신기
import AuthScreen from './components/auth/AuthScreen'
import ProjectsScreen from './components/projects/ProjectsScreen'
import ProjectScreen from './components/project/ProjectScreen'
import Toast from './components/common/Toast'
import { INIT_USERS, INIT_PROJECTS } from './data/sampleData'
import { api, connectSocket } from './utils/api' // API 통신 도우미

export default function App() {
  // 화면 전환 상태
  const [screen, setScreen] = useState('auth')
  const [authMode, setAuthMode] = useState('login')

  // 유저/프로젝트 상태
  const [users, setUsers] = useState(INIT_USERS)
  const [currentUser, setCurrentUser] = useState(null)
  
  // 빈 배열로 시작해서 백엔드 진짜 데이터를 담을 준비!
  const [projects, setProjects] = useState([]) 
  const [currentProject, setCurrentProject] = useState(null)
  const [projectHistory, setProjectHistory] = useState([])
  const [activeView, setActiveView] = useState('dashboard')
  const [toast, setToast] = useState(null)

  // ----------------------------------------------------
  //  1. 화면 켤 때 자동 로그인 검증
  // ----------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api('GET', '/api/auth/me')
        .then((user) => {
          setCurrentUser(user)
          setScreen('projects')
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
    }
  }, [])

  // ----------------------------------------------------
  //  2. 진짜 프로젝트 데이터 불러오기 & 실시간 통신
  // ----------------------------------------------------
  useEffect(() => {
    const fetchRealProjects = async () => {
      try {
        const data = await api('GET', '/api/projects');
            if (data) {
                    const formattedProjects = data.map(p => ({
                    id: p.id,
                    name: p.name,
                    ownerId: p.ownerId || p.owner_id,
                    members: p.members || [],
                    categories: [],
                    posts: [],
                    createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
                      }));
                      setProjects(formattedProjects);
                    }
      } catch (error) {
        console.error('백엔드에서 프로젝트를 가져오는데 실패했습니다:', error);
      }
    };

    fetchRealProjects();
    
    // 백엔드 라디오(웹소켓) 연결
    const socket = io('http://152.67.199.142:3000'); 

    // 업데이트 소리가 들리면 리스트 새로고침!
    socket.on('task_updated', () => {
      console.log('🔄 실시간 업데이트 감지! 화면을 새로 불러옵니다.');
      fetchRealProjects(); 
    });

    // 화면 꺼지거나 로그아웃하면 라디오 끄기
    return () => {
      socket.disconnect();
    };
  }, [currentUser]); // 센스 한 스푼: currentUser가 셋팅(로그인)된 이후에 실행되도록 의존성 배열에 추가!

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
    localStorage.removeItem('token') // 토큰 로직에 맞춰 로그아웃 시 토큰 삭제 추가
  }

  // 내 프로젝트만 필터링
  const myProjects = projects.filter(
    (p) => currentUser && (p.members.includes(currentUser.id) || p.ownerId === currentUser.id)
  )

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
