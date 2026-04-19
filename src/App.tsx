import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RootLayout } from './components/layout/RootLayout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { RegisterStepTwo } from './pages/RegisterStepTwo'
import { RegisterStepThree } from './pages/RegisterStepThree'
import { CreateListing } from './pages/CreateListing'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <RootLayout>
            <Home />
          </RootLayout>
        } />
        <Route path="/create-listing" element={
          <RootLayout>
            <CreateListing />
          </RootLayout>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/step-2" element={<RegisterStepTwo />} />
        <Route path="/register/step-3" element={<RegisterStepThree />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
