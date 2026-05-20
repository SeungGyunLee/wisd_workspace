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

// 파일 업로드용 (중간 공유에서 사용)
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
