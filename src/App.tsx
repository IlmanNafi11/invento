import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppLayout from './components/layout/AppLayout'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Pencatatan = lazy(() => import('./pages/Pencatatan'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="recording" element={<Pencatatan />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
