import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Subscriptions from './pages/Subscriptions'
import BurnRate from './pages/BurnRate'
import FamilyView from './pages/FamilyView'
import Login from './pages/Login'
import Register from './pages/Register'
import Layout from './components/Layout'

function App() {
  const isAuthenticated = localStorage.getItem('token')

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="burn-rate" element={<BurnRate />} />
          <Route path="family" element={<FamilyView />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
