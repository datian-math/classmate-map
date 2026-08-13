import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { createStudent } from '../lib/students'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signUp, user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('请填写姓名')
      return
    }
    if (password !== confirmPassword) {
      setError('两次密码不一致')
      return
    }
    if (password.length < 6) {
      setError('密码至少6位')
      return
    }

    setLoading(true)

    // 1. 创建账号
    const signUpResult = await signUp(email, password)
    if (signUpResult?.error) {
      setError(signUpResult.error.message)
      setLoading(false)
      return
    }

    // 2. 创建学生记录（待审核，管理员后台可见）
    const userId = signUpResult?.data?.user?.id || user?.id
    let studentOk = false
    if (userId) {
      const result = await createStudent({
        name: name.trim(),
        university: '',
        major: '',
        province: '',
        city: '',
        user_id: userId,
        status: 'pending',
      })
      studentOk = !!result
    }

    if (studentOk) {
      navigate('/')
    } else {
      // 账号已建但记录未建成功，提示稍后完善
      setError('账号创建成功，但资料保存失败，请稍后重试或联系管理员')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">注册</h1>
      <p className="text-center text-gray-500 mb-8">
        填写姓名和邮箱即可注册，管理员审核通过后即可使用
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="你的真实姓名"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="至少6位"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">确认密码 *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="再次输入密码"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50"
        >
          {loading ? '注册中...' : '注册'}
        </button>
        <p className="text-center text-sm text-gray-500">
          已有账号？<Link to="/login" className="text-orange-500 hover:underline">立即登录</Link>
        </p>
      </form>
    </div>
  )
}
