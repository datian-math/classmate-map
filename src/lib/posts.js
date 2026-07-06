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
export async function createPost({ studentId, authorName, content, photoFile }) {
  let photoUrl = null

  if (isSupabaseConfigured) {
    // Upload photo to Supabase Storage
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { data: user } = await supabase.auth.getUser()
      const filePath = `${user.user.id}/${fileName}`

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

    const { data: user } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('student_posts')
      .insert({
        student_id: studentId,
        author_id: user.user.id,
        author_name: authorName,
        content,
        photo_url: photoUrl,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create post:', error)
      return null
    }
    return data
  }

  // Local mode - convert photo to base64 data URL
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
