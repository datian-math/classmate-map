import { supabase } from './supabase'
import { mockPosts } from './mockData'

const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL

const STORAGE_KEY = 'classmate-map-posts'

function getLocalPosts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLocalPosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
}

/**
 * Fetch posts for a student
 */
export async function fetchPosts(studentId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('student_posts')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch posts:', error)
      return []
    }
    return data || []
  }

  // Local mode
  return getLocalPosts()
    .filter((p) => p.student_id === studentId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

/**
 * Create a new post
 */
export async function createPost({ studentId, authorName, content, photoFile, videoUrl }) {
  let photoUrl = null

  if (isSupabaseConfigured) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    // Upload photo
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const filePath = `${authUser.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('post-photos')
        .upload(filePath, photoFile)

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('post-photos')
          .getPublicUrl(filePath)
        photoUrl = urlData.publicUrl
      }
    }

    const { data, error } = await supabase
      .from('student_posts')
      .insert({
        student_id: studentId,
        author_id: authUser.id,
        author_name: authorName,
        content,
        photo_url: photoUrl,
        video_url: videoUrl,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create post:', error)
      return null
    }
    return data
  }

  // Local mode
  if (photoFile) {
    photoUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(photoFile)
    })
  }

  const post = {
    id: crypto.randomUUID(),
    student_id: studentId,
    author_name: authorName,
    content,
    photo_url: photoUrl,
    video_url: videoUrl,
    created_at: new Date().toISOString(),
  }

  const posts = getLocalPosts()
  posts.unshift(post)
  saveLocalPosts(posts)
  return post
}

/**
 * Delete a post
 */
export async function deletePost(postId) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('student_posts')
      .delete()
      .eq('id', postId)

    if (error) {
      console.error('Failed to delete post:', error)
      return false
    }
    return true
  }

  // Local mode
  const posts = getLocalPosts().filter((p) => p.id !== postId)
  saveLocalPosts(posts)
  return true
}

/**
 * Fetch latest posts (for home page sidebar)
 */
export async function fetchLatestPosts(limit = 20) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('student_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch latest posts:', error)
      return []
    }
    return data || []
  }

  // Local mode: merge mock posts with user-created posts
  const userPosts = getLocalPosts()
  const all = [...userPosts, ...mockPosts]
  // Deduplicate by id
  const seen = new Set()
  const unique = all.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
  return unique
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit)
}

// ===== Comments =====

export async function fetchComments(postId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) return []
    return data || []
  }

  const comments = JSON.parse(localStorage.getItem('classmate-map-comments') || '[]')
  return comments.filter((c) => c.post_id === postId)
}

export async function createComment({ postId, authorName, content }) {
  if (isSupabaseConfigured) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, author_id: authUser.id, author_name: authorName, content })
      .select()
      .single()

    if (error) { console.error('Comment error:', error); return null }
    return data
  }

  const comment = {
    id: crypto.randomUUID(),
    post_id: postId,
    author_name: authorName,
    content,
    created_at: new Date().toISOString(),
  }
  const comments = JSON.parse(localStorage.getItem('classmate-map-comments') || '[]')
  comments.push(comment)
  localStorage.setItem('classmate-map-comments', JSON.stringify(comments))
  return comment
}

// ===== Likes =====

export async function fetchLikes(postId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('post_id', postId)

    if (error) return []
    return data || []
  }

  const likes = JSON.parse(localStorage.getItem('classmate-map-likes') || '[]')
  return likes.filter((l) => l.post_id === postId)
}

export async function toggleLike(postId) {
  if (isSupabaseConfigured) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    // Check if already liked
    const { data: existing } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', authUser.id)
      .single()

    if (existing) {
      // Unlike
      await supabase.from('post_likes').delete().eq('id', existing.id)
      return { liked: false }
    } else {
      // Like
      await supabase.from('post_likes').insert({ post_id: postId, user_id: authUser.id })
      return { liked: true }
    }
  }

  // Local mode
  const likes = JSON.parse(localStorage.getItem('classmate-map-likes') || '[]')
  const idx = likes.findIndex((l) => l.post_id === postId && l.user_id === 'local')
  if (idx >= 0) {
    likes.splice(idx, 1)
    localStorage.setItem('classmate-map-likes', JSON.stringify(likes))
    return { liked: false }
  } else {
    likes.push({ id: crypto.randomUUID(), post_id: postId, user_id: 'local' })
    localStorage.setItem('classmate-map-likes', JSON.stringify(likes))
    return { liked: true }
  }
}
