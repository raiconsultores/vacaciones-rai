import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'

export default function Login() {
  const { login } = useAuth()
  const [users, setUsers]     = useState([])
  const [selId, setSelId]     = useState('')
  const [pass, setPass]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, nombre, email, activo')
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => { if (data) setUsers(data) })
  }, [])

  async function handleLogin() {
    setError('')
    if (!selId) { setError('Selecciona tu nombre.'); return }
    if (!pass)  { setError('Escribe tu contraseña.'); return }
    const user = users.find(u => u.id === selId)
    if (!user?.email) { setError('Usuario no encontrado.'); return }
    setLoading(true)
    try {
      await login(user.email, pass)
    } catch {
      setError('Contraseña incorrecta. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <img src={logo} alt="RAI Consultores" className="login-logo" />
      <div className="brand-title">Portal de Vacaciones</div>
      <div className="brand-sub">y Permisos</div>
      <div className="lh2">Ingresa a tu cuenta</div>
      <div className="lf">
        <label>Tu nombre</label>
        <select className="fi" value={selId} onChange={e => setSelId(e.target.value)}>
          <option value="">-- Seleccionar --</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </div>
      <div className="lf">
        <label>Contraseña</label>
        <input type="password" className="fi" placeholder="••••••••"
          value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key==='Enter' && handleLogin()} />
      </div>
      <button className="btn-login" onClick={handleLogin} disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
      {error && <div className="lerr">{error}</div>}
    </div>
  )
}
