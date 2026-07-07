import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from '../components/Breadcrumb'
import { fetchStudent } from '../lib/students'
import { fetchPosts, createPost, deletePost, fetchComments, createComment, fetchLikes, toggleLike } from '../lib/posts'
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
  const [newVideo, setNewVideo] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const { user } = useAuth()

  const isOwnPage = user && student?.user_id === user.id

  function startEditing() {
    setEditData({
      name: student.name || '',
      university: student.university || '',
      major: student.major || '',
      phone: student.phone || '',
      wechat: student.wechat || '',
      qq: student.qq || '',
      city: student.city || '',
      province: student.province || '',
      class_num: student.class_num || '',
      enroll_year: student.enroll_year || '',
      message: student.message || '',
    })
    setEditing(true)
  }

  async function saveEdit() {
    if (isSupabaseConfigured) {
      const { supabase } = await import('../lib/supabase')
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('students')
        .update(editData)
        .eq('user_id', authUser.id)
      if (error) { console.error('Update error:', error); return }
      setStudent({ ...student, ...editData })
    } else {
      setStudent({ ...student, ...editData })
    }
    setEditing(false)
  }

  function updateField(field, value) {
    setEditData({ ...editData, [field]: value })
  }

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

  function handleVideoSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setNewVideo(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  function removeVideo() {
    setNewVideo(null)
    setVideoPreview(null)
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!newContent.trim() && !newPhoto && !newVideo) return
    setSubmitting(true)

    const authorName = user ? '同学' : '访客'

    const post = await createPost({
      studentId: id,
      authorName,
      content: newContent.trim(),
      photoFile: newPhoto,
      videoFile: newVideo,
    })

    if (post) {
      setPosts([post, ...posts])
      setNewContent('')
      setNewPhoto(null)
      setPhotoPreview(null)
      setNewVideo(null)
      setVideoPreview(null)
      setShowForm(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (videoInputRef.current) videoInputRef.current.value = ''
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

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file || !isOwnPage) return
    setUploadingAvatar(true)

    if (isSupabaseConfigured) {
      const { supabase } = await import('../lib/supabase')
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const ext = file.name.split('.').pop()
      const filePath = `${authUser.id}/avatar.${ext}`

      // Delete old avatar if exists
      await supabase.storage.from('post-photos').remove([filePath])

      const { error: uploadError } = await supabase.storage
        .from('post-photos')
        .upload(filePath, file)

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('post-photos').getPublicUrl(filePath)
        // Add timestamp to bust cache
        const avatarUrl = urlData.publicUrl + '?t=' + Date.now()
        await supabase.from('students').update({ avatar_url: avatarUrl }).eq('user_id', authUser.id)
        setStudent({ ...student, avatar_url: avatarUrl })
      } else {
        console.error('Avatar upload error:', uploadError)
      }
    }

    setUploadingAvatar(false)
  }

  async function handleAvatarDelete() {
    if (!isOwnPage || !student.avatar_url) return
    if (!window.confirm('确定删除头像？')) return
    setUploadingAvatar(true)

    if (isSupabaseConfigured) {
      const { supabase } = await import('../lib/supabase')
      const { data: { user: authUser } } = await supabase.auth.getUser()

      // Remove from storage
      const oldPath = authUser.id + '/avatar.' + student.avatar_url.split('/avatar.')[1]?.split('?')[0]
      if (oldPath) await supabase.storage.from('post-photos').remove([oldPath])

      // Clear avatar_url in database
      await supabase.from('students').update({ avatar_url: null }).eq('user_id', authUser.id)
      setStudent({ ...student, avatar_url: null })
    }

    setUploadingAvatar(false)
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
          <div className="relative inline-block mx-auto mb-4 group">
            {/* Avatar circle */}
            <div
              className={`w-20 h-20 rounded-full shadow-md overflow-hidden ${isOwnPage ? 'cursor-pointer' : ''}`}
              onClick={() => isOwnPage && !student.avatar_url && avatarInputRef.current?.click()}
            >
              {student.avatar_url ? (
                <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center text-3xl">{student.name[0]}</div>
              )}
              {isOwnPage && !student.avatar_url && (
                <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs">{uploadingAvatar ? '上传中...' : '上传头像'}</span>
                </div>
              )}
            </div>
            {/* Delete X button (only when avatar exists) */}
            {isOwnPage && student.avatar_url && (
              <button
                onClick={(e) => { e.stopPropagation(); handleAvatarDelete() }}
                disabled={uploadingAvatar}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                ×
              </button>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <h1 className="text-2xl font-bold text-white">{student.name}</h1>
          <p className="text-orange-100 mt-1">{student.university} · {student.major}</p>
        </div>

        {/* Info cards */}
        <div className="p-8 space-y-6">
          {/* Edit button */}
          {isOwnPage && (
            <div className="flex justify-end">
              {!editing ? (
                <button onClick={startEditing} className="text-sm text-orange-500 hover:text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border-none cursor-pointer">
                  编辑信息
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="text-sm bg-orange-500 text-white px-4 py-1 rounded-lg border-none cursor-pointer hover:bg-orange-600">
                    保存
                  </button>
                  <button onClick={() => setEditing(false)} className="text-sm bg-gray-200 text-gray-600 px-4 py-1 rounded-lg border-none cursor-pointer hover:bg-gray-300">
                    取消
                  </button>
                </div>
              )}
            </div>
          )}

          {editing ? (
            /* Edit form */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">姓名</label>
                  <input value={editData.name} onChange={e => updateField('name', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">高中班级</label>
                  <input value={editData.class_num} onChange={e => updateField('class_num', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="如：3班" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">大学</label>
                  <input value={editData.university} onChange={e => updateField('university', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">专业</label>
                  <input value={editData.major} onChange={e => updateField('major', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">城市</label>
                  <input value={editData.city} onChange={e => updateField('city', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">入学年份</label>
                  <input type="number" value={editData.enroll_year} onChange={e => updateField('enroll_year', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">手机</label>
                  <input value={editData.phone} onChange={e => updateField('phone', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">微信</label>
                  <input value={editData.wechat} onChange={e => updateField('wechat', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">QQ</label>
                  <input value={editData.qq} onChange={e => updateField('qq', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">个性留言</label>
                <textarea value={editData.message} onChange={e => updateField('message', e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
            </div>
          ) : (
            /* Display mode */
            <>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">联系方式</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {student.phone && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">手机</p><p className="text-gray-800 font-medium">{student.phone}</p></div>}
                  {student.wechat && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">微信</p><p className="text-gray-800 font-medium">{student.wechat}</p></div>}
                  {student.qq && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">QQ</p><p className="text-gray-800 font-medium">{student.qq}</p></div>}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">学业信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">入学年份</p><p className="text-gray-800 font-medium">{student.enroll_year}</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">高中班级</p><p className="text-gray-800 font-medium">{student.class_num}</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">所在城市</p><p className="text-gray-800 font-medium">{student.city}</p></div>
                </div>
              </div>
              {student.message && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">个性留言</h3>
                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-4"><p className="text-gray-700 italic">"{student.message}"</p></div>
                </div>
              )}
            </>
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

                {/* Video upload */}
                <div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                  {videoPreview ? (
                    <div className="relative inline-block">
                      <video
                        src={videoPreview}
                        className="h-24 rounded-lg border border-gray-200"
                        muted
                      />
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center border-none cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="text-sm text-gray-500 bg-white border border-dashed border-gray-300 rounded-lg px-4 py-2 hover:border-orange-400 hover:text-orange-500 cursor-pointer"
                    >
                      + 上传视频
                    </button>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || (!newContent.trim() && !newPhoto && !newVideo)}
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
                  <PostCard key={post.id} post={post} onDelete={handleDelete} user={user} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PostCard({ post, onDelete, user }) {
  const [likes, setLikes] = useState([])
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchLikes(post.id).then(setLikes)
    fetchComments(post.id).then(setComments)
  }, [post.id])

  const myId = user?.id
  const hasLiked = myId ? likes.some((l) => l.user_id === myId) : false

  async function handleLike() {
    if (!myId) return
    const result = await toggleLike(post.id)
    if (result) {
      if (result.liked) {
        setLikes([...likes, { user_id: myId }])
      } else {
        setLikes(likes.filter((l) => l.user_id !== myId))
      }
    }
  }

  async function handleComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmitting(true)
    const comment = await createComment({
      postId: post.id,
      authorName: '同学',
      content: commentText.trim(),
    })
    if (comment) {
      setComments([...comments, comment])
      setCommentText('')
    }
    setSubmitting(false)
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
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
          onClick={() => onDelete(post.id)}
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
      {post.video_url && (
        <video
          src={post.video_url}
          controls
          className="mt-2 max-w-full max-h-72 rounded-lg border border-gray-200"
        >
          您的浏览器不支持视频播放
        </video>
      )}

      {/* Like and comment buttons */}
      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-xs border-none cursor-pointer bg-transparent ${
            hasLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
          }`}
        >
          {hasLiked ? '❤️' : '🤍'} {likes.length > 0 ? likes.length : '点赞'}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 border-none cursor-pointer bg-transparent"
        >
          💬 {comments.length > 0 ? `${comments.length}条评论` : '评论'}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          {comments.length > 0 && (
            <div className="space-y-2 mb-2">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[9px] font-bold text-blue-600 shrink-0 mt-0.5">
                    {c.author_name[0]}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-600">{c.author_name}</span>
                    <span className="text-xs text-gray-500 ml-1">{c.content}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {user && (
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写评论..."
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="text-xs text-orange-500 hover:text-orange-600 bg-transparent border-none cursor-pointer disabled:opacity-30"
              >
                发送
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
