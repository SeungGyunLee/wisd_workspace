import { useState } from 'react'
import { WisdLogo, WisdIcon } from '../common/Logo'
import { uid } from '../../utils/helpers'

export default function AuthScreen({ users, setUsers, setCurrentUser, setScreen, authMode, setAuthMode }) {
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [idStatus, setIdStatus] = useState(null)
  const [err, setErr] = useState('')

  // 아이디 중복 확인
  // 나중에 GET /api/auth/check?id= 로 교체
  const checkId = () => {
    if (!id) { setIdStatus(null); return }
    setIdStatus(users.some((u) => u.id === id) ? 'taken' : 'ok')
  }

  const doRegister = () => {
    if (!id || !name || !pw) { setErr('모든 항목을 입력해주세요'); return }
    if (idStatus === 'taken') { setErr('이미 사용 중인 아이디입니다'); return }
    if (pw !== pw2) { setErr('비밀번호가 일치하지 않습니다'); return }
    // 나중에 POST /api/auth/signup 로 교체
    const user = { id, name, password: pw }
    setUsers((u) => [...u, user])
    setCurrentUser(user)
    setScreen('projects')
  }

  const doLogin = () => {
    if (!id || !pw) { setErr('아이디와 비밀번호를 입력해주세요'); return }
    // 나중에 POST /api/auth/login 으로 교체
    const user = users.find((u) => u.id === id && u.password === pw)
    if (!user) { setErr('아이디 또는 비밀번호가 올바르지 않습니다'); return }
    setCurrentUser(user)
    setScreen('projects')
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <WisdIcon size={40} />
          <WisdLogo size={26} />
        </div>
        <div className="auth-title">{authMode === 'login' ? '로그인' : '회원가입'}</div>
        <div className="auth-sub">
          {authMode === 'login' ? '계속하려면 로그인하세요' : '팀 프로젝트를 시작해보세요'}
        </div>

        {authMode === 'register' && (
          <div className="form-group">
            <label className="form-label">닉네임</label>
            <input className="form-input" placeholder="표시될 이름" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">아이디</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className={`form-input ${idStatus === 'taken' ? 'error' : ''}`}
              style={{ flex: 1 }}
              placeholder="아이디 입력"
              value={id}
              onChange={(e) => { setId(e.target.value); setIdStatus(null) }}
              onBlur={authMode === 'register' ? checkId : undefined}
            />
            {authMode === 'register' && (
              <button className="btn-confirm" style={{ flex: '0 0 auto', padding: '0 13px', fontSize: 12 }} onClick={checkId}>
                중복확인
              </button>
            )}
          </div>
          {idStatus === 'taken' && <div className="form-hint err">⊗ 이미 사용 중인 아이디입니다</div>}
          {idStatus === 'ok' && <div className="form-hint ok">✓ 사용 가능한 아이디입니다</div>}
        </div>

        <div className="form-group">
          <label className="form-label">비밀번호</label>
          <input
            className="form-input"
            type="password"
            placeholder="비밀번호 입력"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && authMode === 'login' && doLogin()}
          />
        </div>

        {authMode === 'register' && (
          <div className="form-group">
            <label className="form-label">비밀번호 확인</label>
            <input
              className={`form-input ${pw2 && pw !== pw2 ? 'error' : ''}`}
              type="password"
              placeholder="비밀번호 재입력"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
            {pw2 && pw !== pw2 && <div className="form-hint err">비밀번호가 일치하지 않습니다</div>}
          </div>
        )}

        {err && (
          <div style={{ color: '#e05c5c', fontSize: 12, marginBottom: 12, padding: '8px 11px', background: '#fff0f0', borderRadius: 8 }}>
            {err}
          </div>
        )}

        <button className="btn-primary" onClick={authMode === 'login' ? doLogin : doRegister}>
          {authMode === 'login' ? '로그인' : '가입하기'}
        </button>

        <div className="auth-switch">
          {authMode === 'login' ? (
            <>계정이 없으신가요? <a onClick={() => { setAuthMode('register'); setErr('') }}>회원가입</a></>
          ) : (
            <>이미 계정이 있으신가요? <a onClick={() => { setAuthMode('login'); setErr('') }}>로그인</a></>
          )}
        </div>
      </div>
    </div>
  )
}
