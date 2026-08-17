import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { createStudent, updateStudent } from '../lib/students'
import { provinceCodes, provinceNameMap } from '../lib/provinceMap'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [university, setUniversity] = useState('')
  const [major, setMajor] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [classNum, setClassNum] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingId, setExistingId] = useState(null) // 已有记录时更新而不是新建

  const { signUp, user } = useAuth()
  const navigate = useNavigate()

  // 已登录用户：查找是否已有记录，有则填好已有值
  useEffect(() => {
    if (!user) return
    async function loadExisting() {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        setExistingId(data.id)
        setName(data.name || '')
        setUniversity(data.university || '')
        setMajor(data.major || '')
        setProvince(data.province || '')
        setCity(data.city || '')
        setClassNum(data.class_num || '')
      }
    }
    loadExisting()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('请填写姓名'); return }
    if (!province) { setError('请选择省份'); return }
    if (!city.trim()) { setError('请填写城市'); return }

    setLoading(true)

    let userId = user?.id

    // 未登录：先创建账号
    if (!userId) {
      if (password !== confirmPassword) { setError('两次密码不一致'); setLoading(false); return }
      if (password.length < 6) { setError('密码至少6位'); setLoading(false); return }
      const signUpResult = await signUp(email, password)
      if (signUpResult?.error) { setError(signUpResult.error.message); setLoading(false); return }
      userId = signUpResult?.data?.user?.id || null
    }

    const profileData = {
      name: name.trim(),
      university: university.trim() || null,
      major: major.trim() || null,
      province,
      city: city.trim(),
      class_num: classNum.trim() || null,
      user_id: userId,
      status: 'pending',
    }

    let ok = false
    if (userId) {
      if (existingId) {
        // 已有记录：更新（不重复创建）
        const result = await updateStudent(existingId, profileData)
        ok = !!result
      } else {
        const result = await createStudent(profileData)
        ok = !!result
      }
    }

    if (ok) {
      navigate('/')
    } else {
      setError(userId ? '资料保存失败，请稍后重试或联系管理员' : '账号创建成功，但资料保存失败，请稍后重试或联系管理员')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">{user ? '完善资料' : '注册'}</h1>
      <p className="text-center text-gray-500 mb-8">
        {user ? '请完善你的同学信息，提交后等待管理员审核' : '填写资料即可注册，管理员审核通过后即可使用'}
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
        {!user && (
          <>
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
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">大学名称</label>
          <input
            type="text"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="如：武汉大学"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">专业</label>
          <input
            type="text"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">省份 *</label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">选择省份</option>
              {provinceCodes.map((code) => (
                <option key={code} value={code}>{provinceNameMap[code]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">城市 *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="如：武汉"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">高中班级</label>
          <input
            type="text"
            value={classNum}
            onChange={(e) => setClassNum(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="如：3班"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50"
        >
          {loading ? '提交中...' : (user ? '提交资料' : '注册')}
        </button>
        {!user && (
          <p className="text-center text-sm text-gray-500">
            已有账号？<Link to="/login" className="text-orange-500 hover:underline">立即登录</Link>
          </p>
        )}
      </form>
    </div>
  )
}
