import React from 'react'
import ReactDOM from 'react-dom/client'
import emailjs from '@emailjs/browser'
import App from './App'

const ejsKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
if (ejsKey && ejsKey !== 'PENDIENTE') emailjs.init(ejsKey)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
