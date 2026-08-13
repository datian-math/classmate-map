import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cabuhfcsepwumrjnjdas.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9LGzmTqbss5AOAH1c04wZg_HdVgfd7D'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 已配置硬编码 Supabase 凭据，始终使用真实数据（不再使用 mock 虚拟人物）
export const isSupabaseConfigured = true
