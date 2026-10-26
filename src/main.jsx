import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AdminApp from './admin/AdminApp.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {window.location.pathname.replace(/\/$/, '') === '/admin' ? <AdminApp /> : <App />}
  </React.StrictMode>
)