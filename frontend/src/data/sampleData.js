// 테스트용 초기 데이터
// 나중에 백엔드 API 연동하면 여기 싹 지워도 됨

export const INIT_USERS = [
  { id: 'demo', name: '데모', password: 'demo' },
]

export const INIT_PROJECTS = [
  {
    id: 'p1',
    name: '팀 프로젝트 A',
    ownerId: 'demo',
    members: ['demo'],
    categories: [
      {
        id: 'c1',
        name: '기획',
        tasks: [
          { id: 't1', title: '요구사항 분석', done: true, dueDate: '2025-01-10', pinned: true },
          { id: 't2', title: '와이어프레임 작성', done: false, dueDate: '2025-01-15', pinned: true },
        ],
      },
      {
        id: 'c2',
        name: '개발',
        tasks: [
          { id: 't3', title: 'API 설계', done: false, dueDate: '2025-01-20', pinned: false },
        ],
      },
    ],
    posts: [
      {
        id: 'post1',
        authorId: 'demo',
        content: '오늘 요구사항 분석 완료했습니다! 다음 주 와이어프레임 작업 시작할게요.',
        images: [],
        categoryTag: null,
        timestamp: Date.now() - 86400000,
        likes: ['demo'],
        comments: [
          {
            id: 'cmt1',
            authorId: 'demo',
            content: '좋아요! 기대됩니다',
            timestamp: Date.now() - 82000000,
          },
        ],
      },
    ],
    createdAt: Date.now() - 7 * 86400000,
  },
]
