import { useEffect } from 'react'

// 2.2초 후에 자동으로 사라지는 토스트 알림
export default function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return <div className="toast">{msg}</div>
}
