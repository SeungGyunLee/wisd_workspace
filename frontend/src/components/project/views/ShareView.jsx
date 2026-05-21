import { useState, useRef, useEffect } from 'react'
import { uid, fmtTime, getAvatarColor, getInitials } from '../../../utils/helpers'
import { api, apiForm } from '../../../utils/api'

export default function ShareView({ project, updateProject, user, users, notify }) {
  
  useEffect(() => {
    api('GET', `/api/projects/${project.id}/posts`)
      .then((posts) => updateProject({ ...project, posts }))
      .catch(() => notify('게시물을 불러오지 못했습니다'))
  }, [project.id])
  
  const [filter, setFilter] = useState('all')
  const [memberFilter, setMemberFilter] = useState(null)
  const [catFilter, setCatFilter] = useState(null)
  const [draft, setDraft] = useState('')
  const [draftFiles, setDraftFiles] = useState([])
  const [showComments, setShowComments] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const fileInputRef = useRef(null)

  const getName = (id) => users.find((u) => u.id === id)?.name || id

  // 파일 추가 - 이미지면 미리보기, 아니면 첨부 칩으로
  // 나중에 POST /api/projects/:id/posts 로 교체 (multipart/form-data)
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach((file) => {
      const isImg = file.type.startsWith('image/')
      const reader = new FileReader()
      reader.onload = (ev) => setDraftFiles((prev) => [...prev, { id: uid(), src: ev.target.result, name: file.name, size: file.size, isImg, type: file.type }])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removeFile = (fid) => setDraftFiles((prev) => prev.filter((f) => f.id !== fid))

  const submitPost = async () => {
    if (!draft.trim() && draftFiles.length === 0) return
    try {
      const formData = new FormData()
      formData.append('content', draft)

      // 파일 전부 기다렸다가 한 번에 보내야 함
      await Promise.all(
        draftFiles.map(async (f) => {
          const res = await fetch(f.src)
          const blob = await res.blob()
          formData.append('files', blob, f.name)
        })
      )

      await apiForm(`/api/projects/${project.id}/posts`, formData)

      // 게시 후 목록 다시 불러오기
      const posts = await api('GET', `/api/projects/${project.id}/posts`)
      updateProject({ ...project, posts })
      setDraft('')
      setDraftFiles([])
      notify('게시물이 등록됐어요')
    } catch (e) {
      notify('게시물 등록에 실패했습니다')
    }
  }

  const toggleLike = async (pid) => {
    try {
      const result = await api('POST', `/api/posts/${pid}/like`)
      updateProject({
        ...project,
        posts: project.posts.map((p) => {
          if (p.id !== pid) return p
          return { ...p, likes: result.liked
            ? [...p.likes, user.id]
            : p.likes.filter((id) => id !== user.id)
          }
        }),
      })
    } catch (e) {
      notify('오류가 발생했습니다')
    }
  }

  const addComment = async (pid) => {
    const txt = (commentDrafts[pid] || '').trim()
    if (!txt) return
    try {
      const cmt = await api('POST', `/api/posts/${pid}/comments`, { content: txt })
      updateProject({ ...project, posts: project.posts.map((p) => p.id === pid ? { ...p, comments: [...p.comments, cmt] } : p) })
      setCommentDrafts((v) => ({ ...v, [pid]: '' }))
    } catch (e) {
      notify('댓글 등록에 실패했습니다')
    }
  }
  
  const filtered = project.posts.filter((p) => {
    if (filter === 'member' && memberFilter && p.authorId !== memberFilter) return false
    if (filter === 'category' && catFilter && p.categoryTag !== catFilter) return false
    return true
  })

  return (
    <div>
      <div className="view-title">중간 공유</div>
      <div className="view-sub">팀원들과 작업 현황을 공유하세요</div>
      <div className="share-wrap">

        {/* 글 작성창 */}
        <div className="share-composer">
          <div className="composer-header">
            <div className="composer-avatar" style={{ background: getAvatarColor(user.name) }}>{getInitials(user.name)}</div>
            <div className="composer-name">{user.name}</div>
          </div>
          <textarea className="composer-textarea" placeholder="무슨 작업을 하셨나요? 팀원들에게 공유해보세요..." value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} />

          {/* 첨부 파일 미리보기 */}
          {draftFiles.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0 2px' }}>
              {draftFiles.map((f) => (
                <div key={f.id} style={{ position: 'relative' }}>
                  {f.isImg ? (
                    <div style={{ position: 'relative', width: 72, height: 72 }}>
                      <img src={f.src} alt={f.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--border)' }} />
                      <button onClick={() => removeFile(f.id)} style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#e05c5c', color: 'white', border: 'none', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--dark)', maxWidth: 160 }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--dg)" strokeWidth="1.5"><path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V6L9 1z" /><path d="M9 1v5h5" /></svg>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.name}</span>
                      <button onClick={() => removeFile(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, padding: 0, flexShrink: 0 }}>✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="composer-footer">
            <input ref={fileInputRef} type="file" accept="*/*" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
            <button
              onClick={() => fileInputRef.current.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', transition: '.15s', fontFamily: 'inherit' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1v9m0-9L5 4m3-3l3 3" /><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" /></svg>
              파일 추가
            </button>
            <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>
              {draftFiles.length > 0 && `📎 ${draftFiles.length}개 · `}{draft.length}/500
            </span>
            <button className="btn-confirm" style={{ padding: '7px 18px', fontSize: 12, borderRadius: 7 }} onClick={submitPost}>게시하기</button>
          </div>
        </div>

        {/* 필터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="filter-label">필터:</span>
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => { setFilter('all'); setMemberFilter(null); setCatFilter(null) }}>전체</button>
          <button className={`filter-btn ${filter === 'member' ? 'active' : ''}`} onClick={() => { setFilter('member'); setCatFilter(null) }}>팀원별</button>
          <button className={`filter-btn ${filter === 'category' ? 'active' : ''}`} onClick={() => { setFilter('category'); setMemberFilter(null) }}>카테고리별</button>
          {filter === 'member' && (
            <div className="share-member-filters">
              {project.members.map((mid) => (
                <button key={mid} className={`member-filter-btn ${memberFilter === mid ? 'active' : ''}`} onClick={() => setMemberFilter(memberFilter === mid ? null : mid)}>{getName(mid)}</button>
              ))}
            </div>
          )}
          {filter === 'category' && (
            <div className="share-member-filters">
              {project.categories.map((cat) => (
                <button key={cat.id} className={`member-filter-btn ${catFilter === cat.id ? 'active' : ''}`} onClick={() => setCatFilter(catFilter === cat.id ? null : cat.id)}>{cat.name}</button>
              ))}
              {project.categories.length === 0 && <span style={{ fontSize: 11, color: 'var(--muted)' }}>카테고리가 없습니다</span>}
            </div>
          )}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state"><div className="empty-icon">💬</div><div className="empty-title">아직 게시물이 없습니다</div><div className="empty-sub">첫 번째 게시물을 작성해보세요</div></div>
        )}

        {/* 게시물 목록 */}
        {filtered.map((post) => {
          const aName = getName(post.authorId)
          const liked = post.likes.includes(user.id)
          const showing = showComments[post.id]
          return (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-avatar" style={{ background: getAvatarColor(aName) }}>{getInitials(aName)}</div>
                <div className="post-meta">
                  <div className="post-author">{aName}</div>
                  <div className="post-time">{fmtTime(post.timestamp)}</div>
                </div>
              </div>
              {post.content && <div className="post-content">{post.content}</div>}

              {/* 첨부 파일/이미지 */}
              {post.images && post.images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: post.images.filter((f) => f.isImg).length === 1 ? '1fr' : '1fr 1fr', gap: 6, marginBottom: 12 }}>
                  {post.images.filter((f) => f.isImg).map((img) => (
                    <img key={img.id} src={`${import.meta.env.VITE_API_URL}${img.src}`} alt={img.name} style={{ width: '100%', aspectRatio: post.images.filter((f) => f.isImg).length === 1 ? '16/9' : '1', objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }} onClick={() => window.open(`${import.meta.env.VITE_API_URL}${img.src}`, '_blank')} />
                  ))}
                  {post.images.filter((f) => !f.isImg).map((f) => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--dark)' }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--dg)" strokeWidth="1.5"><path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V6L9 1z" /><path d="M9 1v5h5" /></svg>
                      {f.name}
                    </div>
                  ))}
                </div>
              )}

              <div className="post-actions">
                <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={() => toggleLike(post.id)}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill={liked ? 'var(--dg)' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M8 13s-6-3.5-6-7.5A3.5 3.5 0 018 3.5a3.5 3.5 0 016 2c0 4-6 7.5-6 7.5z" /></svg>
                  좋아요 {post.likes.length > 0 && post.likes.length}
                </button>
                <button className="post-action-btn" onClick={() => setShowComments((v) => ({ ...v, [post.id]: !v[post.id] }))}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 10a2 2 0 01-2 2H5l-3 3V4a2 2 0 012-2h8a2 2 0 012 2v6z" /></svg>
                  댓글 {post.comments.length > 0 && post.comments.length}
                </button>
              </div>

              {showing && (
                <div className="post-comments">
                  {post.comments.map((cmt) => (
                    <div key={cmt.id} className="post-comment">
                      <div className="comment-avatar">{getInitials(getName(cmt.authorId))}</div>
                      <div className="comment-bubble">
                        <span className="comment-author">{getName(cmt.authorId)}</span>
                        {cmt.content}
                      </div>
                    </div>
                  ))}
                  <div className="comment-input-row">
                    <div className="comment-avatar" style={{ background: getAvatarColor(user.name) }}>{getInitials(user.name)}</div>
                    <input className="comment-input" placeholder="댓글 달기..." value={commentDrafts[post.id] || ''} onChange={(e) => setCommentDrafts((v) => ({ ...v, [post.id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addComment(post.id)} />
                    <button className="btn-comment" onClick={() => addComment(post.id)}>등록</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
