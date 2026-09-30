import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Province from './pages/Province'
import StudentProfile from './pages/StudentProfile'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import QrConfirm from './pages/QrConfirm'

// 手机扫码进来的确认页走 hash 路由（#/qr?t=…）：
// GitHub Pages 是静态托管、没有 404 兜底，把 token 放普通路径上扫码会 404。
// QrConfirm 直接调 supabase，不依赖 AuthProvider，放最外层即可。
const isQrRoute =
  typeof window !== 'undefined' && window.location.hash.startsWith('#/qr')

function App() {
  if (isQrRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <QrConfirm />
      </div>
    )
  }

  return (
    <AuthProvider>
      <BrowserRouter basename="/classmate-map">
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/province/:code" element={<Province />} />
              <Route path="/student/:id" element={<StudentProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
