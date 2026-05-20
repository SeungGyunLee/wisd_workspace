const BASE = import.meta.env.VITE_API_URL

const getToken = () => localStorage.getItem('token')

export const api = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

// 파일 업로드용
export const apiForm = async (path, formData) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

// 웹소켓 연결 - 다른 유저가 할 일 변경하면 자동으로 알려줌
export const connectSocket = (onTaskUpdated) => {
  const { io } = require('socket.io-client')
  const socket = io(import.meta.env.VITE_API_URL)
  socket.on('task_updated', onTaskUpdated)
  return socket
}
