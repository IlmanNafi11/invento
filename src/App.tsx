import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import AuthInitializer from './components/common/AuthInitializer'
import { useTokenRefresh } from './hooks/useTokenRefresh'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Modul = lazy(() => import('./pages/Modul'))
const Project = lazy(() => import('./pages/Project'))
const User = lazy(() => import('./pages/User'))
const Role = lazy(() => import('./pages/Role'))
const Forbidden = lazy(() => import('./pages/Forbidden'))

function App() {
  useTokenRefresh();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthInitializer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="modul" element={
            <ProtectedRoute requiredPermission={{ resource: 'modul', action: 'read' }}>
              <Modul />
            </ProtectedRoute>
          } />
          <Route path="project" element={
            <ProtectedRoute requiredPermission={{ resource: 'Project', action: 'read' }}>
              <Project />
            </ProtectedRoute>
          } />
          <Route path="user" element={
            <ProtectedRoute requiredPermission={{ resource: 'user', action: 'read' }}>
              <User />
            </ProtectedRoute>
          } />
          <Route path="role" element={
            <ProtectedRoute requiredPermissions={[
              { resource: 'Role', action: 'read' },
              { resource: 'Permission', action: 'read' }
            ]}>
              <Role />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
