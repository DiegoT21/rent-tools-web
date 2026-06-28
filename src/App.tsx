import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RootLayout } from './components/layout/RootLayout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { CreateListing } from './pages/CreateListing'
import { UserProfile } from './pages/UserProfile'
import { ToolDetails } from './pages/ToolDetails'
import { ContractDetails } from './pages/ContractDetails'
import { Checkout } from './pages/Checkout'
import { DeliveryProtocol } from './pages/DeliveryProtocol'

<<<<<<< Updated upstream
const RegisterStepTwo = lazy(() =>
  import('./pages/RegisterStepTwo').then((m) => ({ default: m.RegisterStepTwo }))
)
const RegisterStepThree = lazy(() =>
  import('./pages/RegisterStepThree').then((m) => ({ default: m.RegisterStepThree }))
)

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center text-slate-500 font-medium">
      Cargando...
    </div>
  )
}
=======
>>>>>>> Stashed changes

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
        <Route path="/tools/:uuid" element={
          <RootLayout>
            <ToolDetails />
          </RootLayout>
        } />
        <Route path="/rentals/contracts/:uuid" element={
          <RootLayout>
            <ContractDetails />
          </RootLayout>
        } />
        <Route path="/profile" element={
          <RootLayout>
            <UserProfile />
          </RootLayout>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/step-2" element={
          <Suspense fallback={<PageLoader />}>
            <RegisterStepTwo />
          </Suspense>
        } />
        <Route path="/register/step-3" element={
          <Suspense fallback={<PageLoader />}>
            <RegisterStepThree />
          </Suspense>
        } />
        <Route path="/checkout" element={
          <RootLayout>
            <Checkout />
          </RootLayout>
        } />
        <Route path="/delivery" element={
          <RootLayout>
            <DeliveryProtocol />
          </RootLayout>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
