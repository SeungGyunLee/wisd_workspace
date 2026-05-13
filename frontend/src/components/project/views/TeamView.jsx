import { useState } from 'react'
import { getAvatarColor, getInitials } from '../../../utils/helpers'

export default function TeamView({ project, updateProject, user, users, notify }) {
  const [inviteId, setInviteId] = useState('')

  const getName = (id) => users.find((u) => u.id === id)?.name || id

  // 팀원 초대
  // 나중에 POST /api/projects/:id/members 로 교체
  const invite = () => {
    const t = users.find((u) => u.id === inviteId.trim())
    if (!t) { notify('존재하지 않는 아이디입니다'); return }
    if (project.members.includes(t.id)) { notify('이미 팀원입니다'); return }
    updateProject({ ...project, members: [...project.members, t.id] })
    setInviteId('')
    notify(`${t.name}님을 초대했습니다`)
  }

  // 팀원 내보내기
  // 나중에 DELETE /api/projects/:id/members/:userId 로 교체
  const kick = (mid) => {
    if (mid === user.id) { notify('자신은 내보낼 수 없습니다'); return }
    if (mid === project.ownerId) { notify('프로젝트 소유자는 내보낼 수 없습니다'); return }
    updateProject({ ...project, members: project.members.filter((id) => id !== mid) })
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
