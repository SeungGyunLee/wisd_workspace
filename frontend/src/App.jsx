import { useState, useEffect } from 'react'
import { io } from 'socket.io-client' //1. 상단에 라디오 수신기 불러오기
import AuthScreen from './components/auth/AuthScreen'
import ProjectsScreen from './components/projects/ProjectsScreen'
import ProjectScreen from './components/project/ProjectScreen'
import Toast from './components/common/Toast'
import { INIT_USERS, INIT_PROJECTS } from './data/sampleData'

export default function App() {
  // 화면 전환 상태
  const [screen, setScreen] = useState('auth')
  const [authMode, setAuthMode] = useState('login')

  // 유저/프로젝트 상태
  const [users, setUsers] = useState(INIT_USERS)
  const [currentUser, setCurrentUser] = useState(null)

  // 1. 초기값은 텅 빈 배열([])로 시작합니다.
  const [projects, setProjects] = useState([]) 

  // 2. 화면이 켜지자마자 백엔드에서 진짜 프로젝트 목록을 가져오는 마법의 코드!
  useEffect(() => {
    const fetchRealProjects = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/projects');
        if (response.ok) {
          const data = await response.json();
          
          // 백엔드 데이터(MySQL)를 프론트엔드 입맛에 맞게 변환 (번역기 역할)
          const formattedProjects = data.map(p => ({
            id: p.id,
            name: p.name,
            ownerId: currentUser ? currentUser.id : 'demo', // 임시 유저
            members: [currentUser ? currentUser.id : 'demo'], // 임시 유저
            categories: [], // 카테고리(할 일)는 나중에 상세 페이지 들어가면 불러올 겁니다!
            posts: [],
            createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
          }));
          
          // 진짜 데이터로 프론트엔드 화면 채우기!
          setProjects(formattedProjects);
        }
      } catch (error) {
        console.error('백엔드에서 프로젝트를 가져오는데 실패했습니다:', error);
      }
    };

    fetchRealProjects();
    
    // ----------------------------------------------------
    //  2. 여기서부터 소켓(실시간) 연결 코드 추가!
    // ----------------------------------------------------

    const socket = io('http://localhost:3000'); // 백엔드 주소로 연결

    // 백엔드에서 'task_updated' 라고 소리치면 듣고 행동할 내용
    socket.on('task_updated', () => {
      console.log('🔄 실시간 업데이트 감지! 화면을 새로 불러옵니다.');
      fetchRealProjects(); // 몰래 뒤에서 최신 데이터 다시 싹 불러오기!
    });

    // 화면이 꺼지면 라디오도 끕니다
    return () => {
      socket.disconnect();
    };

  }, []); // 끝에 있는 빈 대괄호[]는 "처음 켜질 때 딱 한 번만 실행해!" 라는 뜻입니다.
  const [currentProject, setCurrentProject] = useState(null)
  const [projectHistory, setProjectHistory] = useState([])
  const [activeView, setActiveView] = useState('dashboard')
  const [toast, setToast] = useState(null)

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
