import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { ini, fmtD } from '../lib/helpers'
import VacCard from '../components/VacCard'
import Constancia from './Constancia'

export default function MiInfo() {
  const { profile } = useAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [team, setTeam] = useState([])
  const [constanciaData, setConstanciaData] = useState(null)

  useEffect(() => {
    supabase.from('solicitudes').select('*').eq('emp_id',profile.id).order('created_at',{ascending:false})
      .then(({data})=>setSolicitudes(data||[]))
    if(profile.rol!=='colaborador'){
      supabase.from('profiles').select('*,periodos_vacaciones(*)').eq('jefe_id',profile.id).eq('activo',true)
        .then(({data})=>setTeam(data||[]))
    }
  },[profile.id])

  const ep = e => e==='pendiente'?'bp':e==='aprobada'?'ba':'br'
  const el = e => e==='pendiente'?'Pendiente':e==='aprobada'?'Aprobada':'Rechazada'

  return (
    <div>
      <div className="phero">
        <div className="pav" style={{background:profile.color_bg||'#B5D4F4',color:profile.color_fg||'#0C447C'}}>
          {ini(profile.nombre)}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:16,fontWeight:700}}>{profile.nombre}</div>
          <div style={{fontSize:13,color:'#64748b',marginTop:2}}>
            {profile.puesto}
            {profile.depto&&<span className="divtag">{profile.depto}</span>}
          </div>
          {profile.ingreso&&<div style={{fontSize:12,color:'#94a3b8',marginTop:4}}>Ingreso: {profile.ingreso}</div>}
        </div>
      </div>

      {profile.saldo!=null && <VacCard profile={profile}/>}

      {team.length>0&&(
        <div className="card">
          <div className="card-title">Mi equipo</div>
          {team.map((m,i)=>{
            const ms=parseFloat(m.saldo)||0
            const venc=(m.periodos_vacaciones||[]).filter(p=>p.vencido&&((parseFloat(p.ganados)||0)-(parseFloat(p.usados)||0))>0).length
            const pc=ms<=0?['Sin saldo','pill-zero']:ms<3?['Pocos días','pill-low']:['Disponible','pill-ok']
            return(
              <div key={m.id} className="prow">
                <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:m.color_bg,color:m.color_fg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>{ini(m.nombre)}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{m.nombre.split(' ').slice(0,2).join(' ')}</div>
                    <div style={{fontSize:11,color:'#94a3b8'}}>{m.puesto}</div>
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontWeight:700,color:'#0070C0'}}>{ms.toFixed(2)} días</div>
                  <span className={`pill ${pc[1]}`} style={{fontSize:10}}>{pc[0]}</span>
                  {venc>0&&<span className="pill pill-venc" style={{fontSize:10,marginLeft:3}}>{venc} venc.</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {solicitudes.length>0&&(
        <div className="card">
          <div className="card-title">Mis solicitudes</div>
          {solicitudes.map(s=>(
            <div key={s.id} className="prow">
              <span style={{color:'#64748b'}}>{fmtD(s.inicio)} → {fmtD(s.fin)}</span>
              <span style={{color:'#94a3b8',fontSize:12}}>{s.tipo} · {s.dias} día(s)</span>
              <span className={ep(s.estado)}>{el(s.estado)}</span>
              {s.estado==='aprobada'&&(
                <button className="btn-sm" onClick={() => setConstanciaData({ solicitud: s, colaborador: profile, jefe: null })}>
                  📄 Constancia
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {constanciaData && (
        <Constancia {...constanciaData} onClose={() => setConstanciaData(null)} />
      )}
    </div>
  )
}
