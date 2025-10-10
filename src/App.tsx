import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/layout/Layout'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Modul = lazy(() => import('./pages/Modul'))
const Project = lazy(() => import('./pages/Project'))
const User = lazy(() => import('./pages/User'))
const Role = lazy(() => import('./pages/Role'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="modul" element={<Modul />} />
          <Route path="project" element={<Project />} />
          <Route path="user" element={<User />} />
          <Route path="role" element={<Role />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
