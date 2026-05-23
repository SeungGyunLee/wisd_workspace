import { useState, useRef, useEffect } from 'react'
import { uid, fmtTime, getAvatarColor, getInitials } from '../../../utils/helpers'
import { api, apiForm, connectSocket } from '../../../utils/api' // 👈 connectSocket 추가!

export default function ShareView({ project, updateProject, user, users, notify }) {
  
  // ----------------------------------------------------
  // 실시간 새로고침 (웹소켓) 
  // ----------------------------------------------------
  useEffect(() => {
    // 1. 게시물 불러오는 함수
    const fetchPosts = async () => {
      try {
        const posts = await api('GET', `/api/projects/${project.id}/posts`)
        updateProject({ ...project, posts })
      } catch (err) {
        console.error('게시물 로드 실패:', err)
      }
    }

    // 2. 화면 켤 때 최초 1회 로드
    fetchPosts()

    // 3. 누군가 글/댓글/좋아요를 남기면 (소켓 알림)
    const socket = connectSocket(() => {
      console.log('🔄 공유 화면: 새로운 활동이 감지되었습니다!');
      setTimeout(fetchPosts, 100); // 0.1초 딜레이 (DB 저장 시간 확보)
    })

    return () => socket?.disconnect()
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

  // 파일 추가
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

  // 게시물 등록
  const submitPost = async () => {
    if (!draft.trim() && draftFiles.length === 0) return
    try {
      const formData = new FormData()
      formData.append('content', draft)

      await Promise.all(
        draftFiles.map(async (f) => {
          const res = await fetch(f.src)
          const blob = await res.blob()
          formData.append('files', blob, f.name)
        })
      )

      await apiForm(`/api/projects/${project.id}/posts`, formData)

      // 게시 후 소켓이 알아서 갱신해주겠지만, 내가 쓴 글이니 즉시 로컬 갱신
      const posts = await api('GET', `/api/projects/${project.id}/posts`)
      updateProject({ ...project, posts })
      setDraft('')
      setDraftFiles([])
      notify('게시물이 등록됐어요')
    } catch (e) {
      console.error('게시물 등록 에러:', e) // F12 확인용
      notify('게시물 등록에 실패했습니다')
    }
  }

  // 좋아요
  const toggleLike = async (pid) => {
    try {
      await api('POST', `/api/posts/${pid}/like`)
      // 성공하면 다시 전체 로드 (소켓이 해줄 수도 있지만 즉각 반응을 위해)
      const posts = await api('GET', `/api/projects/${project.id}/posts`)
      updateProject({ ...project, posts })
    } catch (e) {
      notify('좋아요 처리에 실패했습니다')
    }
  }

  // 댓글
  const addComment = async (pid) => {
    const txt = (commentDrafts[pid] || '').trim()
    if (!txt) return
    try {
      await api('POST', `/api/posts/${pid}/comments`, { content: txt })
      const posts = await api('GET', `/api/projects/${project.id}/posts`)
      updateProject({ ...project, posts })
      setCommentDrafts((v) => ({ ...v, [pid]: '' }))
    } catch (e) {
      notify('댓글 등록에 실패했습니다')
    }
  }
  
  // 방어 코드: project.posts가 undefined일 경우 빈 배열로 처리
  const safePosts = project.posts || [];
  
  const filtered = safePosts.filter((p) => {
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
        </div>

        {filtered.length === 0 && (
          <div className="empty-state"><div className="empty-icon">💬</div><div className="empty-title">아직 게시물이 없습니다</div><div className="empty-sub">첫 번째 게시물을 작성해보세요</div></div>
        )}

        {/* 게시물 목록 */}
        {filtered.map((post) => {
          const aName = getName(post.authorId)
          const liked = post.likes?.includes(user.id) || false
          const showing = showComments[post.id]
          return (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-avatar" style={{ background: getAvatarColor(aName) }}>{getInitials(aName)}</div>
                <div className="post-meta">
                  <div className="post-author">{aName}</div>
                  <div className="post-time">{fmtTime(post.timestamp || Date.now())}</div>
                </div>
              </div>
              {post.content && <div className="post-content">{post.content}</div>}

              {/* 첨부 파일/이미지 */}
              {post.images && post.images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: post.images.filter((f) => f.isImg).length === 1 ? '1fr' : '1fr 1fr', gap: 6, marginBottom: 12 }}>
                  {post.images.filter((f) => f.isImg).map((img) => (
                    <img key={img.id} src={`${import.meta.env.VITE_API_URL}${img.src}`} alt={img.name} style={{ width: '100%', aspectRatio: post.images.filter((f) => f.isImg).length === 1 ? '16/9' : '1', objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }} onClick={() => window.open(`${import.meta.env.VITE_API_URL}${img.src}`, '_blank')} />
                  ))}
                </div>
              )}

              <div className="post-actions">
                <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={() => toggleLike(post.id)}>
                  좋아요 {post.likes?.length > 0 && post.likes.length}
                </button>
                <button className="post-action-btn" onClick={() => setShowComments((v) => ({ ...v, [post.id]: !v[post.id] }))}>
                  댓글 {post.comments?.length > 0 && post.comments.length}
                </button>
              </div>

              {showing && (
                <div className="post-comments">
                  {(post.comments || []).map((cmt) => (
                    <div key={cmt.id} className="post-comment">
                      <div className="comment-avatar">{getInitials(getName(cmt.authorId))}</div>
                      <div className="comment-bubble">
                        <span className="comment-author">{getName(cmt.authorId)}</span>
                        {cmt.content}
                      </div>
                    </div>
                  ))}
                  <div className="comment-input-row">
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