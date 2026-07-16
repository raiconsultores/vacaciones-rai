import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { canSol, canApprove, canSeeRes, canManage } from './lib/helpers'
import Login from './pages/Login'
import MiInfo from './pages/MiInfo'
import Solicitar from './pages/Solicitar'
import { Solicitudes, Calendario, Resumen, Colaboradores } from './pages/Pages'
import './styles/global.css'

function Portal() {
  const { profile, loading, logout } = useAuth()
  const [tab, setTab] = useState('info')

  if (loading) return <div className="loading"><i className="ti ti-loader-2"></i> Cargando...</div>
  if (!profile) return <Login />

  const tabs = [{ k:'info', i:'ti-user', l:'Mi información' }]
  if (canSol(profile))     tabs.push({ k:'sol',  i:'ti-send',      l:'Solicitar'     })
  if (canApprove(profile)) tabs.push({ k:'pend', i:'ti-bell',      l:'Solicitudes'   })
  tabs.push(                          { k:'cal',  i:'ti-calendar',  l:'Calendario'    })
  if (canSeeRes(profile))  tabs.push({ k:'res',  i:'ti-chart-bar', l:'Resumen'       })
  if (canManage(profile))  tabs.push({ k:'adm',  i:'ti-settings',  l:'Colaboradores' })

  const pages = { info:<MiInfo/>, sol:<Solicitar/>, pend:<Solicitudes/>, cal:<Calendario/>, res:<Resumen/>, adm:<Colaboradores/> }

  return (
    <div>
      <div className="topbar">
        <div className="tb-brand"><i className="ti ti-building" style={{fontSize:15,marginRight:5,verticalAlign:-2}}></i>RAI Consultores</div>
        <div className="tb-user">{profile.nombre}</div>
        <button className="btn-out" onClick={logout}><i className="ti ti-logout" style={{fontSize:12,marginRight:3}}></i>Salir</button>
      </div>
      <div className="nav">
        {tabs.map(t=>(
          <button key={t.k} className={`nb${tab===t.k?' active':''}`} onClick={()=>setTab(t.k)}>
            <i className={`ti ${t.i}`} style={{fontSize:13,marginRight:4,verticalAlign:-1}}></i>{t.l}
          </button>
        ))}
      </div>
      {pages[tab]}
    </div>
  )
}

export default function App() {
  return <AuthProvider><Portal /></AuthProvider>
}
