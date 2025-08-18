import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router' 
import Home from './pages/Home'
import EditoPage from './pages/EditoPage'
import { Toaster } from 'react-hot-toast'

function App() {

  return (
    <>
    <div>
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            theme: {
              primary: '#4ade80',
            }
          }
        }}
      />
    </div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor/:id" element={<EditoPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
