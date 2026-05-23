import { useState } from 'react'
import { WisdLogo, WisdIcon } from '../common/Logo'
import { ICONS } from '../../assets/icons'
import { getAvatarColor, getInitials } from '../../utils/helpers'
import { api } from '../../utils/api'

// 메뉴 목록
const NAV = [
  { id: 'dashboard', text: '대시보드' },
  { id: 'progress', text: '진행도' },
  { id: 'planlist', text: '계획리스트' },
  { id: 'calendar', text: '캘린더' },
  { id: 'share', text: '중간 공유' },
]

const MGMT = [
  { id: 'team', text: '팀 관리' },
  { id: 'navigate', icon: '⇄', text: '프로젝트 이동' },
]

export default function Sidebar({
  user, project, activeView, setActiveView,
  doLogout, setCurrentUser, showToast, onCloseProject,
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><WisdIcon size={30} /></div>
        <WisdLogo size={17} light />
      </div>

      {/* 현재 프로젝트 표시 */}
      <div className="sidebar-project" onClick={() => setActiveView('dashboard')}>
        <div className="sidebar-project-label">현재 프로젝트</div>
        <div className="sidebar-project-name">{project.name}</div>
      </div>

      {/* 유저 정보 + 닉네임 수정 */}
      <div className="sidebar-user">
        <div className="sidebar-user-row">
          <div className="sidebar-avatar" style={{ background: getAvatarColor(user.name) }}>
            {getInitials(user.name)}
          </div>
          <span className="sidebar-user-name">{user.name}</span>
        </div>
        <div className="sidebar-user-actions">
          <span className="sidebar-user-btn" onClick={() => showToast('탈퇴 처리됩니다')}>탈퇴하기</span>
        </div>
        
      {/* 네비게이션 메뉴 */}
      <div className="sidebar-nav">
        {NAV.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="nav-item-icon">
              {ICONS[item.id] ? (
                <img
                  src={ICONS[item.id].src}
                  width={ICONS[item.id].w}
                  height={ICONS[item.id].h}
                  style={{ display: 'block', flexShrink: 0, opacity: 0.8 }}
                  alt=""
                />
              ) : item.icon}
            </span>
            <span className="nav-item-text">{item.text}</span>
          </div>
        ))}

        <div className="nav-divider" />
        <div className="nav-section-label">관리</div>

        {MGMT.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="nav-item-icon">
              {ICONS[item.id] ? (
                <img
                  src={ICONS[item.id].src}
                  width={ICONS[item.id].w}
                  height={ICONS[item.id].h}
                  style={{ display: 'block', flexShrink: 0, opacity: 0.8 }}
                  alt=""
                />
              ) : item.icon}
            </span>
            <span className="nav-item-text">{item.text}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="btn-logout-sidebar" onClick={doLogout}>로그아웃</button>
        <button className="btn-close-project" onClick={onCloseProject}>프로젝트 마감</button>
      </div>
    </div>
  )
}
