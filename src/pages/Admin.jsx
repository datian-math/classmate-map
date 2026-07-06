import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { Navigate } from 'react-router-dom'
import { fetchAllStudents, approveStudent, rejectStudent, deleteStudent } from '../lib/students'
import { provinceNameMap } from '../lib/provinceMap'

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, approved, rejected

  useEffect(() => {
    if (isAdmin) {
      loadStudents()
    }
  }, [isAdmin])

  async function loadStudents() {
    setLoading(true)
    const data = await fetchAllStudents()
    setStudents(data)
    setLoading(false)
  }

  async function handleApprove(id) {
    await approveStudent(id)
    loadStudents()
  }

  async function handleReject(id) {
    await rejectStudent(id)
    loadStudents()
  }

  async function handleDelete(id) {
    if (window.confirm('确定删除该同学信息？')) {
      await deleteStudent(id)
      loadStudents()
    }
  }

  if (authLoading) return <div className="text-center py-12 text-gray-400">加载中...</div>
  if (!isAdmin) return <Navigate to="/" replace />

  const filtered = filter === 'all'
    ? students
    : students.filter((s) => s.status === filter)

  const pendingCount = students.filter((s) => s.status === 'pending').length

  const statusLabel = {
    pending: { text: '待审核', class: 'bg-yellow-100 text-yellow-700' },
    approved: { text: '已通过', class: 'bg-green-100 text-green-700' },
    rejected: { text: '已拒绝', class: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">管理后台</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: '全部' },
          { key: 'pending', label: `待审核${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { key: 'approved', label: '已通过' },
          { key: 'rejected', label: '已拒绝' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors
              ${filter === tab.key
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无数据</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-800">{s.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusLabel[s.status]?.class}`}>
                    {statusLabel[s.status]?.text}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {s.university} · {s.major} · {provinceNameMap[s.province] || s.province} · {s.city}
                </p>
                {s.phone && <p className="text-xs text-gray-400 mt-0.5">📱 {s.phone}</p>}
              </div>
              <div className="flex gap-2">
                {s.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(s.id)}
                      className="px-3 py-1 rounded-lg text-sm bg-green-500 text-white hover:bg-green-600 border-none cursor-pointer"
                    >
                      通过
                    </button>
                    <button
                      onClick={() => handleReject(s.id)}
                      className="px-3 py-1 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 border-none cursor-pointer"
                    >
                      拒绝
                    </button>
                  </>
                )}
                {s.status === 'rejected' && (
                  <button
                    onClick={() => handleApprove(s.id)}
                    className="px-3 py-1 rounded-lg text-sm bg-green-500 text-white hover:bg-green-600 border-none cursor-pointer"
                  >
                    通过
                  </button>
                )}
                {s.status === 'approved' && (
                  <button
                    onClick={() => handleReject(s.id)}
                    className="px-3 py-1 rounded-lg text-sm bg-yellow-500 text-white hover:bg-yellow-600 border-none cursor-pointer"
                  >
                    撤回
                  </button>
                )}
                <button
                  onClick={() => handleDelete(s.id)}
                  className="px-3 py-1 rounded-lg text-sm bg-gray-200 text-gray-600 hover:bg-gray-300 border-none cursor-pointer"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
