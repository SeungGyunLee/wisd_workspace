import { useState, useEffect } from 'react'
import { getAvatarColor, getInitials } from '../../../utils/helpers'
import { api } from '../../../utils/api'

export default function TeamView({ project, updateProject, user, notify }) {
  const [inviteId, setInviteId] = useState('')
  const [members, setMembers] = useState([])

  // 팀원 목록 불러오기
  useEffect(() => {
    api('GET', `/api/projects/${project.id}/members`)
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [project.id])

  const getName = (id) => members.find((m) => m.id === id)?.name || id

  // 팀원 초대
  const invite = async () => {
    if (!inviteId.trim()) return
    try {
      const data = await api('POST', `/api/projects/${project.id}/members`, { inviteId: inviteId.trim() })
      setMembers((prev) => [...prev, data.user])
      updateProject({ ...project, members: [...project.members, data.user.id] })
      setInviteId('')
      notify(`${data.user.name}님을 초대했습니다`)
    } catch (e) {
      notify(e?.error || '초대에 실패했습니다')
    }
  }

  // 팀원 내보내기
  const kick = async (mid) => {
    try {
      await api('DELETE', `/api/projects/${project.id}/members/${mid}`)
      setMembers((prev) => prev.filter((m) => m.id !== mid))
      updateProject({ ...project, members: project.members.filter((id) => id !== mid) })
      notify('팀원이 제외되었습니다')
    } catch (e) {
      notify(e?.error || '내보내기에 실패했습니다')
    }
  }

  return (
    <div>
      <div className="view-title">팀 관리</div>
      <div className="view-sub">팀원을 초대하거나 관리하세요</div>
      <div className="team-wrap">
        <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>팀원 초대</div>
        <div className="team-invite-form">
          <input className="form-input" style={{ flex: 1 }} placeholder="초대할 아이디(이메일) 입력" value={inviteId} onChange={(e) => setInviteId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && invite()} />
          <button className="btn-confirm" style={{ padding: '0 18px', fontSize: 12 }} onClick={invite}>초대하기</button>
        </div>
        <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>현재 팀원 ({members.length}명)</div>
        <div className="team-member-list">
          {members.map((m) => (
            <div key={m.id} className="team-member-item">
              <div className="member-avatar" style={{ background: getAvatarColor(m.name) }}>{getInitials(m.name)}</div>
              <span className="member-name">{m.name}</span>
              <span className="member-role">{m.id === project.ownerId ? '소유자' : '팀원'}</span>
              {user.id === project.ownerId && m.id !== project.ownerId && (
                <button className="btn-kick" onClick={() => kick(m.id)}>내보내기</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
