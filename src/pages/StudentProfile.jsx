import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from '../components/Breadcrumb'
import { fetchStudent } from '../lib/students'
import { fetchPosts, createPost, deletePost } from '../lib/posts'
import { useAuth } from '../lib/auth'
import { mockStudents } from '../lib/mockData'

const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL

export default function StudentProfile() {
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [posts, setPosts] = useState([])
  const [newContent, setNewContent] = useState('')
  const [newPhoto, setNewPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const fileInputRef = useRef(null)
  const { user } = useAuth()

  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchStudent(id).then(setStudent)
    } else {
      const found = mockStudents.find((s) => s.id === id)
      setStudent(found || null)
    }
    fetchPosts(id).then(setPosts)
  }, [id])

  function handlePhotoSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setNewPhoto(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  function removePhoto() {
    setNewPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!newContent.trim() && !newPhoto) return
    setSubmitting(true)

    const authorName = user ? '同学' : '访客'

    const post = await createPost({
      studentId: id,
      authorName,
      content: newContent.trim(),
      photoFile: newPhoto,
    })

    if (post) {
      setPosts([post, ...posts])
      setNewContent('')
      setNewPhoto(null)
      setPhotoPreview(null)
      setShowForm(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    setSubmitting(false)
  }

  async function handleDelete(postId) {
    if (!window.confirm('确定删除这条留言？')) return
    const ok = await deletePost(postId)
    if (ok) {
      setPosts(posts.filter((p) => p.id !== postId))
    }
  }

  if (!student) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-400">
        同学信息不存在
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumb items={[
        { label: '首页', to: '/' },
        { label: student.province, to: `/province/${student.province}` },
        { label: student.name },
      ]} />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-8 py-10 text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-3xl shadow-md">
            {student.name[0]}
          </div>
          <h1 className="text-2xl font-bold text-white">{student.name}</h1>
          <p className="text-orange-100 mt-1">{student.university} · {student.major}</p>
        </div>

        {/* Info cards */}
        <div className="p-8 space-y-6">
          {/* Contact */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              联系方式
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {student.phone && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">手机</p>
                  <p className="text-gray-800 font-medium">{student.phone}</p>
                </div>
              )}
              {student.wechat && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">微信</p>
                  <p className="text-gray-800 font-medium">{student.wechat}</p>
                </div>
              )}
              {student.qq && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">QQ</p>
                  <p className="text-gray-800 font-medium">{student.qq}</p>
                </div>
              )}
            </div>
          </div>

          {/* Academic */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              学业信息
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">入学年份</p>
                <p className="text-gray-800 font-medium">{student.enroll_year}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">高中班级</p>
                <p className="text-gray-800 font-medium">{student.class_num}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">所在城市</p>
                <p className="text-gray-800 font-medium">{student.city}</p>
              </div>
            </div>
          </div>

          {/* Signature message */}
          {student.message && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                个性留言
              </h3>
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                <p className="text-gray-700 italic">"{student.message}"</p>
              </div>
            </div>
          )}

          {/* Guestbook / Message Board */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                留言板
              </h3>
              <button
                onClick={() => setShowForm(!showForm)}
                className="text-sm text-orange-500 hover:text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border-none cursor-pointer"
              >
                {showForm ? '收起' : '写留言'}
              </button>
            </div>

            {/* New post form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="说点什么吧..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />

                {/* Photo upload */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  {photoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={photoPreview}
                        alt="预览"
                        className="h-24 rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center border-none cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-gray-500 bg-white border border-dashed border-gray-300 rounded-lg px-4 py-2 hover:border-orange-400 hover:text-orange-500 cursor-pointer"
                    >
                      + 上传照片
                    </button>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || (!newContent.trim() && !newPhoto)}
                    className="bg-orange-500 text-white px-5 py-1.5 rounded-lg hover:bg-orange-600 text-sm font-medium disabled:opacity-50 border-none cursor-pointer"
                  >
                    {submitting ? '发送中...' : '发送'}
                  </button>
                </div>
              </form>
            )}

            {/* Posts list */}
            {posts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">还没有留言，来抢个沙发吧</p>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-orange-200 rounded-full flex items-center justify-center text-xs font-bold text-orange-700">
                          {post.author_name[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{post.author_name}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(post.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-xs text-gray-300 hover:text-red-400 bg-transparent border-none cursor-pointer"
                      >
                        删除
                      </button>
                    </div>
                    {post.content && (
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{post.content}</p>
                    )}
                    {post.photo_url && (
                      <img
                        src={post.photo_url}
                        alt="照片"
                        className="mt-2 max-h-60 rounded-lg border border-gray-200"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
