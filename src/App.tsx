import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RootLayout } from './components/layout/RootLayout'
import { Home } from './pages/Home'
import { useAuthStore } from './store/authStore'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { RegisterStepTwo } from './pages/RegisterStepTwo'
import { RegisterStepThree } from './pages/RegisterStepThree'
import { CreateListing } from './pages/CreateListing'
import { UserProfile } from './pages/UserProfile'
import { ToolDetails } from './pages/ToolDetails'
import { ContractDetails } from './pages/ContractDetails'
import { Checkout } from './pages/Checkout'
import { CheckoutRental } from './pages/CheckoutRental'
import { DeliveryProtocol } from './pages/DeliveryProtocol'
import { AdminDashboard } from './pages/AdminDashboard'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { SessionBootstrap } from './components/auth/SessionBootstrap'
import { isAdminUser } from './lib/isAdmin'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { useFavoritesStore } from './store/favoritesStore'

function App() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = isAdminUser(user);

  React.useEffect(() => {
    if (user) {
      void useFavoritesStore.getState().loadIds();
    } else {
      useFavoritesStore.getState().reset();
    }
  }, [user]);


  return (
    <SessionBootstrap>
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
          <ProtectedRoute>
            <RootLayout>
              <UserProfile />
            </RootLayout>
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/step-2" element={<RegisterStepTwo />} />
        <Route path="/register/step-3" element={<RegisterStepThree />} />
        <Route path="/checkout/:uuid" element={
          <RootLayout>
            <Checkout />
          </RootLayout>
        } />
        <Route path="/checkout-rental/:uuid" element={
          <RootLayout>
            <CheckoutRental />
          </RootLayout>
        } />
        <Route path="/delivery" element={
          <RootLayout>
            <DeliveryProtocol />
          </RootLayout>
        } />
        {isAdmin && (
          <Route path="/admin" element={
            <RootLayout>
              <AdminDashboard />
            </RootLayout>
          } />
        )}
        <Route path="/my-rentals" element={
          <ProtectedRoute>
            <Navigate to="/profile?tab=alquileres" replace />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
    </SessionBootstrap>
  )
}

export default App
