import { useState } from 'react'
import { getAvatarColor, getInitials } from '../../../utils/helpers'
import { api } from '../../../utils/api'

export default function TeamView({ project, updateProject, user, users, notify }) {
  const [inviteId, setInviteId] = useState('')

  const getName = (id) => {
    const found = project.memberDetails?.find((u) => u.id === id)
    return found?.name || id
  }

  // 팀원 초대
  const invite = async () => {
    if (!inviteId.trim()) return
    try {
      const data = await api('POST', `/api/projects/${project.id}/members`, { inviteId: inviteId.trim() })
      updateProject({ ...project, members: [...project.members, data.user.id], memberDetails: [...(project.memberDetails || []), data.user] })
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
          <input className="form-input" style={{ flex: 1 }} placeholder="초대할 아이디 입력" value={inviteId} onChange={(e) => setInviteId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && invite()} />
          <button className="btn-confirm" style={{ padding: '0 18px', fontSize: 12 }} onClick={invite}>초대하기</button>
        </div>
        <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>현재 팀원 ({project.members.length}명)</div>
        <div className="team-member-list">
          {project.members.map((mid) => (
            <div key={mid} className="team-member-item">
              <div className="member-avatar" style={{ background: getAvatarColor(getName(mid)) }}>{getInitials(getName(mid))}</div>
              <span className="member-name">{getName(mid)}</span>
              <span className="member-role">{mid === project.ownerId ? '소유자' : '팀원'}</span>
              {user.id === project.ownerId && mid !== project.ownerId && (
                <button className="btn-kick" onClick={() => kick(mid)}>내보내기</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
