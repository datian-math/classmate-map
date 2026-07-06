import { supabase } from './supabase'

/**
 * Fetch all approved students
 */
export async function fetchApprovedStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('status', 'approved')

  if (error) {
    console.error('Failed to fetch students:', error)
    return []
  }
  return data || []
}

/**
 * Fetch students by province
 */
export async function fetchStudentsByProvince(province) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('province', province)
    .eq('status', 'approved')

  if (error) {
    console.error('Failed to fetch students by province:', error)
    return []
  }
  return data || []
}

/**
 * Fetch a single student by ID
 */
export async function fetchStudent(id) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Failed to fetch student:', error)
    return null
  }
  return data
}

/**
 * Create a new student record
 */
export async function createStudent(studentData) {
  const { data, error } = await supabase
    .from('students')
    .insert(studentData)
    .select()
    .single()

  if (error) {
    console.error('Failed to create student:', error)
    return null
  }
  return data
}

/**
 * Update a student record
 */
export async function updateStudent(id, updates) {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update student:', error)
    return null
  }
  return data
}

/**
 * Delete a student record (admin only)
 */
export async function deleteStudent(id) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete student:', error)
    return false
  }
  return true
}

/**
 * Fetch pending students (admin only)
 */
export async function fetchPendingStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('status', 'pending')

  if (error) {
    console.error('Failed to fetch pending students:', error)
    return []
  }
  return data || []
}

/**
 * Fetch all students (admin only)
 */
export async function fetchAllStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch all students:', error)
    return []
  }
  return data || []
}

/**
 * Approve a student (admin only)
 */
export async function approveStudent(id) {
  return updateStudent(id, { status: 'approved' })
}

/**
 * Reject a student (admin only)
 */
export async function rejectStudent(id) {
  return updateStudent(id, { status: 'rejected' })
}
