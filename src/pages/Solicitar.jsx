import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import emailjs from '@emailjs/browser'

const EJSVC  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EJSTPL = import.meta.env.VITE_EMAILJS_TEMPLATE_ID

export default function Solicitar() {
  const { profile } = useAuth()
  const [jefe, setJefe]       = useState(null)
  const [tipo, setTipo]       = useState('Vacaciones')
  const [ini, setIni]         = useState('')
  const [fin, setFin]         = useState('')
  const [mot, setMot]         = useState('')
  const [ok, setOk]           = useState('')
  const [err, setErr]         = useState('')
  const [loading, setLoading] = useState(false)
  const saldo = parseFloat(profile.saldo)||0
  const today = new Date().toISOString().split('T')[0]

  useEffect(()=>{
    if(profile.jefe_id){
      supabase.from('profiles').select('nombre,email').eq('id',profile.jefe_id).single()
        .then(({data})=>setJefe(data))
    }
  },[profile.jefe_id])

  async function enviar(){
    setOk('');setErr('')
    if(!ini||!fin){setErr('Completa las fechas.');return}
    if(fin<ini){setErr('La fecha de fin debe ser posterior al inicio.');return}
    const d1=new Date(ini+'T00:00:00'),d2=new Date(fin+'T00:00:00')
    const dias=Math.round((d2-d1)/(1000*60*60*24))+1
    setLoading(true)
    try{
      const {error:dbErr}=await supabase.from('solicitudes').insert({
        emp_id:profile.id, tipo, inicio:ini, fin, dias, motivo:mot||'Sin especificar', estado:'pendiente'
      })
      if(dbErr) throw dbErr

      // EmailJS — solo si está configurado
      const jefeEmail=jefe?.email||profile.jefe_email||'administracion@raiconsultores.com'
      const jefeNombre=jefe?.nombre||'Administración'
      if(EJSVC&&EJSVC!=='PENDIENTE'){
        await emailjs.send(EJSVC,EJSTPL,{
          to_email:jefeEmail, to_name:jefeNombre,
          from_name:profile.nombre, from_puesto:profile.puesto,
          tipo_solicitud:tipo,
          fecha_inicio:d1.toLocaleDateString('es-GT',{day:'2-digit',month:'long',year:'numeric'}),
          fecha_fin:d2.toLocaleDateString('es-GT',{day:'2-digit',month:'long',year:'numeric'}),
          dias_solicitados:dias, motivo:mot||'Sin especificar'
        })
      }
      setOk(`✓ Solicitud enviada correctamente. ${jefeNombre} será notificado.`)
      setIni('');setFin('');setMot('')
    }catch(e){
      console.error(e);setErr('Error al enviar. Intenta de nuevo.')
    }finally{setLoading(false)}
  }

  return(
    <div className="card">
      <div className="card-title">Solicitar vacaciones o permiso</div>
      <div style={{fontSize:13,color:'#64748b',marginBottom:4}}>
        Tienes <strong style={{color:'#0070C0'}}>{saldo.toFixed(2)} días</strong> disponibles.
      </div>
      <div style={{fontSize:12,color:'#94a3b8',marginBottom:'1rem'}}>
        Tu solicitud será enviada a: <strong>{jefe?.nombre||'Administración'}</strong>
      </div>
      <label className="fl">Tipo de solicitud</label>
      <select className="fi" value={tipo} onChange={e=>setTipo(e.target.value)}>
        <option>Vacaciones</option>
        <option>Permiso con goce</option>
        <option>Permiso sin goce</option>
        <option>Compensatorio</option>
      </select>
      <label className="fl">Fecha de inicio</label>
      <input type="date" className="fi" value={ini} min={today} onChange={e=>setIni(e.target.value)}/>
      <label className="fl">Fecha de fin</label>
      <input type="date" className="fi" value={fin} min={ini||today} onChange={e=>setFin(e.target.value)}/>
      <label className="fl">Motivo o comentario</label>
      <input type="text" className="fi" placeholder="Ej. Viaje familiar, cita médica..."
        value={mot} onChange={e=>setMot(e.target.value)}/>
      <button className="btn-p" onClick={enviar} disabled={loading}>
        <i className="ti ti-send" style={{fontSize:14}}></i>
        {loading?'Enviando...':'Enviar solicitud'}
      </button>
      {ok&&<div className="aok">{ok}</div>}
      {err&&<div className="aerr">{err}</div>}
    </div>
  )
}
