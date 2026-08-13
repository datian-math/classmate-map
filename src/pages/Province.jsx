import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from '../components/Breadcrumb'
import ProvinceMap from '../components/ProvinceMap'
import { fetchStudentsByProvince } from '../lib/students'
import { getProvinceName } from '../lib/provinceMap'
import { mockStudents } from '../lib/mockData'

import { isSupabaseConfigured } from '../lib/supabase'

export default function Province() {
  const { code } = useParams()
  const [students, setStudents] = useState([])

  const provinceName = getProvinceName(code) || code

  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchStudentsByProvince(code).then(setStudents)
    } else {
      setStudents(mockStudents.filter((s) => s.province === code))
    }
  }, [code])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumb items={[
        { label: '首页', to: '/' },
        { label: `${provinceName}省` },
      ]} />
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {provinceName} · 蹭饭地图
      </h1>
      <div className="bg-white rounded-xl shadow-sm p-4">
        <ProvinceMap provinceCode={code} students={students} />
      </div>
    </div>
  )
}
