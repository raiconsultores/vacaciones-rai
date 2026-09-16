import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { ini, fmtD, canSeeRes } from '../lib/helpers'

const ep = e => e==='pendiente'?'bp':e==='aprobada'?'ba':'br'
const el = e => e==='pendiente'?'Pendiente':e==='aprobada'?'Aprobada':'Rechazada'

export function Solicitudes() {
  const { profile } = useAuth()
  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{cargar()},[])

  async function cargar(){
    setLoading(true)
    let {data}=await supabase.from('solicitudes')
      .select('*,profiles:emp_id(nombre,puesto,color_bg,color_fg,jefe_id)')
      .eq('estado','pendiente').order('created_at',{ascending:true})
    let lista=data||[]
    if(profile.rol==='jefe') lista=lista.filter(s=>s.profiles?.jefe_id===profile.id)
    setPendientes(lista);setLoading(false)
  }

  async function resolver(sol,estado){
    await supabase.from('solicitudes').update({estado,aprobado_por:profile.id}).eq('id',sol.id)
    if(estado==='aprobada'&&sol.tipo==='Vacaciones'){
      if(sol.periodo_id){
        const {data:periodo}=await supabase.from('periodos_vacaciones').select('ganados,usados').eq('id',sol.periodo_id).single()
        if(periodo){
          const nuevoUsados=(parseFloat(periodo.usados)||0)+sol.dias
          const nuevoSaldo=Math.max(0,(parseFloat(periodo.ganados)||0)-nuevoUsados)
          await supabase.from('periodos_vacaciones').update({usados:nuevoUsados,saldo:nuevoSaldo}).eq('id',sol.periodo_id)
        }
        const {data:periodos}=await supabase.from('periodos_vacaciones').select('saldo,vencido').eq('user_id',sol.emp_id)
        const totalSaldo=(periodos||[]).filter(p=>!p.vencido).reduce((s,p)=>s+(parseFloat(p.saldo)||0),0)
        await supabase.from('profiles').update({saldo:parseFloat(totalSaldo.toFixed(2))}).eq('id',sol.emp_id)
      }else{
        const {data:emp}=await supabase.from('profiles').select('saldo').eq('id',sol.emp_id).single()
        if(emp) await supabase.from('profiles').update({saldo:Math.max(0,(parseFloat(emp.saldo)||0)-sol.dias)}).eq('id',sol.emp_id)
      }
    }
    cargar()
  }

  if(loading) return <div className="loading"><i className="ti ti-loader-2"></i>Cargando...</div>
  if(!pendientes.length) return(
    <div className="card" style={{textAlign:'center',padding:'2rem',color:'#94a3b8'}}>
      <i className="ti ti-circle-check" style={{fontSize:32,color:'#86efac',display:'block',marginBottom:8}}></i>
      No hay solicitudes pendientes.
    </div>
  )
  return(
    <div>
      <div style={{fontSize:13,color:'#64748b',marginBottom:'1rem'}}>{pendientes.length} solicitud(es) pendiente(s)</div>
      {pendientes.map(s=>{
        const p=s.profiles||{}
        return(
          <div key={s.id} className="rcard">
            <div className="rcard-h">
              <div className="rav" style={{background:p.color_bg||'#e2e8f0',color:p.color_fg||'#374151'}}>{ini(p.nombre||'?')}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{p.nombre}</div>
                <div style={{fontSize:11,color:'#94a3b8'}}>{p.puesto}</div>
                <div style={{marginTop:6,fontSize:13}}><strong>{s.tipo}</strong> · {fmtD(s.inicio)} → {fmtD(s.fin)} · <strong>{s.dias} día(s)</strong></div>
                {s.motivo&&s.motivo!=='Sin especificar'&&<div style={{fontSize:12,color:'#64748b',marginTop:3}}>"{s.motivo}"</div>}
              </div>
            </div>
            <div className="racts">
              <button className="btn-ap" onClick={()=>resolver(s,'aprobada')}><i className="ti ti-check" style={{fontSize:13,marginRight:4}}></i>Aprobar</button>
              <button className="btn-re" onClick={()=>resolver(s,'rechazada')}><i className="ti ti-x" style={{fontSize:13,marginRight:4}}></i>Rechazar</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const DIAS=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export function Calendario(){
  const { profile } = useAuth()
  const puedeGestionar = !!profile && canSeeRes(profile)
  const [date,setDate]=useState(new Date())
  const [sols,setSols]=useState([])
  const [colaboradores,setColaboradores]=useState([])
  const [modal,setModal]=useState(null)
  const [empId,setEmpId]=useState('')
  const [tipoM,setTipoM]=useState('Vacaciones')
  const [inicioM,setInicioM]=useState('')
  const [finM,setFinM]=useState('')
  const [guardando,setGuardando]=useState(false)
  const [err,setErr]=useState('')

  async function cargarSols(){
    const hoy=new Date().toISOString().slice(0,10)
    const {data}=await supabase.from('solicitudes').select('*,profiles:emp_id(nombre,color_bg,color_fg)').eq('estado','aprobada')
      .gte('fin',hoy)
    setSols(data||[])
  }
  useEffect(()=>{cargarSols()},[])

  useEffect(()=>{
    if(puedeGestionar){
      supabase.from('profiles').select('id,nombre').eq('activo',true).order('nombre')
        .then(({data})=>setColaboradores(data||[]))
    }
  },[puedeGestionar])

  const year=date.getFullYear(),month=date.getMonth()
  const firstDay=new Date(year,month,1).getDay()
  const daysInMonth=new Date(year,month+1,0).getDate()
  const today=new Date()
  function getSols(day){
    const d=new Date(year,month,day)
    return sols.filter(s=>{const i=new Date(s.inicio+'T00:00:00'),f=new Date(s.fin+'T00:00:00');return d>=i&&d<=f})
  }

  function abrirModal(day){
    if(!puedeGestionar) return
    const f=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    setEmpId('');setTipoM('Vacaciones');setInicioM(f);setFinM(f);setErr('')
    setModal(f)
  }
  function cerrarModal(){setModal(null)}

  const diasM = (inicioM&&finM&&finM>=inicioM)
    ? Math.round((new Date(finM+'T00:00:00')-new Date(inicioM+'T00:00:00'))/(1000*60*60*24))+1
    : 0

  async function guardarAusencia(){
    setErr('')
    if(!empId){setErr('Selecciona un colaborador.');return}
    if(!inicioM||!finM){setErr('Completa las fechas.');return}
    if(finM<inicioM){setErr('La fecha de fin debe ser posterior al inicio.');return}
    setGuardando(true)
    try{
      const {error}=await supabase.from('solicitudes').insert({
        emp_id:empId, tipo:tipoM, inicio:inicioM, fin:finM, dias:diasM,
        motivo:'Registrado desde calendario', estado:'aprobada', aprobado_por:profile.id
      })
      if(error) throw error
      cerrarModal()
      cargarSols()
    }catch(e){
      setErr('Error al guardar: '+e.message)
    }finally{setGuardando(false)}
  }

  async function eliminarAusencia(sol){
    if(!puedeGestionar) return
    if(!window.confirm(`¿Eliminar la ausencia de ${sol.profiles?.nombre||'este colaborador'}?`)) return
    const {error}=await supabase.from('solicitudes').delete().eq('id',sol.id)
    if(error){ setErr('Error al eliminar: '+error.message); return }
    cargarSols()
  }
  const ausencias=sols.filter(s=>{
    const i=new Date(s.inicio+'T00:00:00'),f=new Date(s.fin+'T00:00:00')
    return(i.getMonth()===month&&i.getFullYear()===year)||(f.getMonth()===month&&f.getFullYear()===year)
  })
  const cells=[]
  for(let i=0;i<firstDay;i++) cells.push(null)
  for(let d=1;d<=daysInMonth;d++) cells.push(d)
  return(
    <div>
      <div className="card">
        <div className="cal-nav">
          <button className="cal-nb" onClick={()=>setDate(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}>‹</button>
          <div className="cal-ml">{MESES[month]} {year}</div>
          <button className="cal-nb" onClick={()=>setDate(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}>›</button>
        </div>
        <div className="cgrid">
          {DIAS.map(d=><div key={d} className="chdr">{d}</div>)}
          {cells.map((day,i)=>{
            if(!day) return <div key={`e${i}`}></div>
            const isToday=today.getDate()===day&&today.getMonth()===month&&today.getFullYear()===year
            const evs=getSols(day)
            return(
              <div key={day} className={`cc curr${isToday?' today':''}`}
                onClick={()=>abrirModal(day)} style={{cursor:puedeGestionar?'pointer':'default'}}>
                <div className="cnum">{day}</div>
                {evs.slice(0,2).map((s,j)=>(
                  <div key={j} className="cev" style={{background:s.profiles?.color_bg,color:s.profiles?.color_fg}}>{ini(s.profiles?.nombre||'?')}</div>
                ))}
                {evs.length>2&&<div className="cev" style={{background:'#e2e8f0',color:'#64748b'}}>+{evs.length-2}</div>}
              </div>
            )
          })}
        </div>
      </div>
      {ausencias.length>0&&(
        <div className="card">
          <div className="card-title">Ausencias en {MESES[month]}</div>
          {ausencias.map(s=>(
            <div key={s.id} className="out-item">
              <div className="out-dot" style={{background:s.profiles?.color_bg}}></div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13}}>{s.profiles?.nombre?.split(' ').slice(0,2).join(' ')}</div>
                <div style={{fontSize:11,color:'#94a3b8'}}>{fmtD(s.inicio)} → {fmtD(s.fin)} · {s.dias} día(s)</div>
              </div>
              <span style={{fontSize:11,color:'#64748b'}}>{s.tipo}</span>
              {puedeGestionar&&(
                <button className="btn-del" style={{marginLeft:8}} onClick={()=>eliminarAusencia(s)}>
                  <i className="ti ti-trash" style={{fontSize:12}}></i>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {err&&!modal&&<div className="aerr">{err}</div>}
      {modal&&puedeGestionar&&(
        <div className="modal-bg open" onClick={e=>e.target===e.currentTarget&&cerrarModal()}>
          <div className="modal">
            <h3>Registrar ausencia <button className="modal-close" onClick={cerrarModal}>×</button></h3>
            <label className="fl">Colaborador</label>
            <select className="fi" value={empId} onChange={e=>setEmpId(e.target.value)}>
              <option value="">-- Seleccionar --</option>
              {colaboradores.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <label className="fl">Tipo de solicitud</label>
            <select className="fi" value={tipoM} onChange={e=>setTipoM(e.target.value)}>
              <option>Vacaciones</option>
              <option>Permiso con goce</option>
              <option>Permiso sin goce</option>
              <option>Compensatorio</option>
            </select>
            <label className="fl">Fecha de inicio</label>
            <input type="date" className="fi" value={inicioM} onChange={e=>setInicioM(e.target.value)}/>
            <label className="fl">Fecha de fin</label>
            <input type="date" className="fi" value={finM} min={inicioM} onChange={e=>setFinM(e.target.value)}/>
            <div style={{fontSize:12,color:'#64748b',margin:'6px 0 12px'}}>Días: <strong>{diasM}</strong></div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',flexWrap:'wrap'}}>
              <button className="btn-sm" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-p" style={{marginTop:0}} onClick={guardarAusencia} disabled={guardando}>
                <i className="ti ti-device-floppy" style={{fontSize:14}}></i>{guardando?'Guardando...':'Guardar'}
              </button>
            </div>
            {err&&<div className="aerr">{err}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

export function Resumen(){
  const [lista,setLista]=useState([])
  const [loading,setLoading]=useState(true)
  const [historial,setHistorial]=useState([])
  const [fEmp,setFEmp]=useState('')
  const [fEstado,setFEstado]=useState('')
  const [fDesde,setFDesde]=useState('')
  const [fHasta,setFHasta]=useState('')
  useEffect(()=>{
    supabase.from('profiles').select('*,periodos_vacaciones(*)').eq('activo',true).order('nombre')
      .then(({data})=>{setLista(data||[]);setLoading(false)})
    supabase.from('solicitudes').select('*,profiles:emp_id(nombre)').order('created_at',{ascending:false})
      .then(({data})=>setHistorial(data||[]))
  },[])
  const historialFiltrado=useMemo(()=>historial.filter(s=>
    (!fEmp||s.emp_id===fEmp) &&
    (!fEstado||s.estado===fEstado) &&
    (!fDesde||s.inicio>=fDesde) &&
    (!fHasta||s.inicio<=fHasta)
  ),[historial,fEmp,fEstado,fDesde,fHasta])
  if(loading) return <div className="loading"><i className="ti ti-loader-2"></i>Cargando...</div>
  const sinSaldo=lista.filter(u=>(parseFloat(u.saldo)||0)<=0)
  const conVenc=lista.filter(u=>(u.periodos_vacaciones||[]).some(p=>p.vencido&&((parseFloat(p.ganados)||0)-(parseFloat(p.usados)||0))>0))
  return(
    <div>
      <div className="stats-grid">
        <div className="stat-box"><div className="stat-num">{lista.length}</div><div className="stat-lbl">Colaboradores</div></div>
        <div className="stat-box"><div className="stat-num" style={{color:'#991b1b'}}>{sinSaldo.length}</div><div className="stat-lbl">Sin saldo</div></div>
        <div className="stat-box"><div className="stat-num" style={{color:'#6b21a8'}}>{conVenc.length}</div><div className="stat-lbl">Con días vencidos</div></div>
      </div>
      <div className="card">
        <div className="card-title">Saldos de vacaciones</div>
        <div style={{overflowX:'auto'}}>
          <table className="stbl">
            <thead><tr><th>Colaborador</th><th>Puesto</th><th>Ingreso</th><th>Saldo</th><th>Estado</th></tr></thead>
            <tbody>
              {lista.map(u=>{
                const saldo=parseFloat(u.saldo)||0
                const venc=(u.periodos_vacaciones||[]).filter(p=>p.vencido&&((parseFloat(p.ganados)||0)-(parseFloat(p.usados)||0))>0)
                const [pill,pc]=saldo<=0?['Sin saldo','pill-zero']:saldo<3?['Pocos días','pill-low']:['Disponible','pill-ok']
                return(
                  <tr key={u.id}>
                    <td><div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:u.color_bg,color:u.color_fg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>{ini(u.nombre)}</div>
                      <span style={{fontWeight:600}}>{u.nombre.split(' ').slice(0,2).join(' ')}</span>
                    </div></td>
                    <td style={{color:'#64748b',fontSize:12}}>{u.puesto}</td>
                    <td style={{color:'#64748b',fontSize:12}}>{u.ingreso}</td>
                    <td style={{fontWeight:700,color:'#0D4170'}}>{saldo.toFixed(2)}</td>
                    <td>
                      <span className={`pill ${pc}`}>{pill}</span>
                      {venc.length>0&&<span className="pill pill-venc" style={{marginLeft:4}}>{venc.reduce((s,p)=>s+((parseFloat(p.ganados)||0)-(parseFloat(p.usados)||0)),0).toFixed(2)} venc.</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Historial de Solicitudes</div>
        <div className="pg3">
          <div>
            <label className="fl">Colaborador</label>
            <select className="fi" value={fEmp} onChange={e=>setFEmp(e.target.value)}>
              <option value="">Todos</option>
              {lista.map(u=><option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="fl">Estado</label>
            <select className="fi" value={fEstado} onChange={e=>setFEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
          <div className="grid2">
            <div>
              <label className="fl">Desde</label>
              <input type="date" className="fi" value={fDesde} onChange={e=>setFDesde(e.target.value)}/>
            </div>
            <div>
              <label className="fl">Hasta</label>
              <input type="date" className="fi" value={fHasta} min={fDesde||undefined} onChange={e=>setFHasta(e.target.value)}/>
            </div>
          </div>
        </div>
        <div style={{overflowX:'auto',marginTop:'1rem'}}>
          <table className="stbl">
            <thead>
              <tr>
                <th>Colaborador</th><th>Tipo</th><th>Inicio</th><th>Fin</th><th>Días</th><th>Estado</th><th>Solicitado el</th>
              </tr>
            </thead>
            <tbody>
              {historialFiltrado.map(s=>(
                <tr key={s.id}>
                  <td style={{fontWeight:600}}>{s.profiles?.nombre||'—'}</td>
                  <td style={{color:'#64748b',fontSize:12}}>{s.tipo}</td>
                  <td style={{fontSize:12}}>{fmtD(s.inicio)}</td>
                  <td style={{fontSize:12}}>{fmtD(s.fin)}</td>
                  <td>{s.dias}</td>
                  <td><span className={ep(s.estado)}>{el(s.estado)}</span></td>
                  <td style={{color:'#64748b',fontSize:12}}>{new Date(s.created_at).toLocaleDateString('es-GT',{day:'2-digit',month:'short',year:'numeric'})}</td>
                </tr>
              ))}
              {historialFiltrado.length===0&&(
                <tr><td colSpan={7} style={{textAlign:'center',color:'#94a3b8',padding:'1rem'}}>No hay solicitudes con estos filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function Colaboradores(){
  const [lista,setLista]=useState([])
  const [loading,setLoading]=useState(true)
  const [editando,setEditando]=useState(null)
  const [periodos,setPeriodos]=useState([])
  const [ok,setOk]=useState('')
  const [err,setErr]=useState('')

  useEffect(()=>{cargar()},[])

  async function cargar(){
    const {data}=await supabase.from('profiles').select('*,periodos_vacaciones(*)').eq('activo',true).order('nombre')
    setLista(data||[]);setLoading(false)
  }

  function abrirEdicion(u){setEditando({...u});setPeriodos(JSON.parse(JSON.stringify(u.periodos_vacaciones||[])));setOk('');setErr('')}
  function cerrar(){setEditando(null)}

  async function guardar(){
    setOk('');setErr('')
    if(!editando.nombre||!editando.puesto){setErr('Nombre y puesto son obligatorios.');return}
    try{
      const nuevoSaldo=periodos.reduce((s,p)=>s+Math.max(0,(parseFloat(p.ganados)||0)-(parseFloat(p.usados)||0)),0)
      await supabase.from('profiles').update({nombre:editando.nombre,puesto:editando.puesto,depto:editando.depto,ingreso:editando.ingreso,saldo:parseFloat(nuevoSaldo.toFixed(2))}).eq('id',editando.id)
      await supabase.from('periodos_vacaciones').delete().eq('user_id',editando.id)
      if(periodos.length) await supabase.from('periodos_vacaciones').insert(periodos.map(p=>({user_id:editando.id,anio:p.anio,inicio:p.inicio||null,fin:p.fin||null,ganados:parseFloat(p.ganados)||0,usados:parseFloat(p.usados)||0,saldo:Math.max(0,(parseFloat(p.ganados)||0)-(parseFloat(p.usados)||0)),vencido:p.vencido||false})))
      setOk(`Guardado. Saldo: ${nuevoSaldo.toFixed(2)} días`);cargar();setTimeout(cerrar,1500)
    }catch(e){setErr('Error: '+e.message)}
  }

  function addPeriodo(){setPeriodos(p=>[...p,{anio:'',inicio:'',fin:'',ganados:15,usados:0,saldo:15,vencido:false}])}
  function delPeriodo(i){setPeriodos(p=>p.filter((_,j)=>j!==i))}
  function updPeriodo(i,field,val){setPeriodos(p=>p.map((x,j)=>j===i?{...x,[field]:field==='ganados'||field==='usados'?parseFloat(val)||0:val}:x))}

  if(loading) return <div className="loading"><i className="ti ti-loader-2"></i>Cargando...</div>
  return(
    <div>
      <div className="card">
        <div className="card-title">Colaboradores activos <span style={{fontSize:12,color:'#94a3b8',fontWeight:400}}>{lista.length} registros</span></div>
        {lista.map(u=>{
          const saldo=parseFloat(u.saldo)||0
          return(
            <div key={u.id} className="col-row">
              <div style={{width:36,height:36,borderRadius:'50%',background:u.color_bg,color:u.color_fg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{ini(u.nombre)}</div>
              <div className="col-info"><div className="col-name">{u.nombre}</div><div className="col-sub">{u.puesto} · {u.depto}</div></div>
              <div style={{textAlign:'right',flexShrink:0,marginRight:10}}>
                <div style={{fontWeight:700,color:'#0D4170',fontSize:13}}>{saldo.toFixed(2)} días</div>
                <div style={{fontSize:10,color:'#94a3b8'}}>{(u.periodos_vacaciones||[]).length} períodos</div>
              </div>
              <button className="btn-sm" onClick={()=>abrirEdicion(u)}><i className="ti ti-pencil" style={{fontSize:12}}></i>Editar</button>
            </div>
          )
        })}
      </div>
      {editando&&(
        <div className="modal-bg open" onClick={e=>e.target===e.currentTarget&&cerrar()}>
          <div className="modal">
            <h3>Editar colaborador <button className="modal-close" onClick={cerrar}>×</button></h3>
            <div className="grid2">
              <div><label className="fl">Nombre</label><input className="fi-sm" value={editando.nombre} onChange={e=>setEditando(x=>({...x,nombre:e.target.value}))}/></div>
              <div><label className="fl">Puesto</label><input className="fi-sm" value={editando.puesto||''} onChange={e=>setEditando(x=>({...x,puesto:e.target.value}))}/></div>
              <div><label className="fl">Departamento</label><input className="fi-sm" value={editando.depto||''} onChange={e=>setEditando(x=>({...x,depto:e.target.value}))}/></div>
              <div><label className="fl">Ingreso</label><input type="date" className="fi-sm" value={editando.ingreso||''} onChange={e=>setEditando(x=>({...x,ingreso:e.target.value}))}/></div>
            </div>
            <div className="ssep" style={{marginTop:'1.25rem'}}>Períodos de vacaciones</div>
            {periodos.map((p,i)=>{
              const ps=Math.max(0,(parseFloat(p.ganados)||0)-(parseFloat(p.usados)||0))
              return(
                <div key={i} className="period-edit-row">
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <span style={{fontSize:12,fontWeight:700}}>Período {i+1}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <label style={{fontSize:11,color:'#64748b',display:'flex',alignItems:'center',gap:5,cursor:'pointer'}}>
                        <input type="checkbox" checked={p.vencido||false} onChange={e=>updPeriodo(i,'vencido',e.target.checked)}/> Vencido
                      </label>
                      <button className="btn-del" onClick={()=>delPeriodo(i)}><i className="ti ti-trash" style={{fontSize:12}}></i></button>
                    </div>
                  </div>
                  <div className="pg2">
                    <div><label>Nombre período</label><input className="fi-sm" value={p.anio||''} placeholder="2024/2025" onChange={e=>updPeriodo(i,'anio',e.target.value)}/></div>
                  </div>
                  <div className="pg2">
                    <div><label>Fecha inicio</label><input type="date" className="fi-sm" value={p.inicio||''} onChange={e=>updPeriodo(i,'inicio',e.target.value)}/></div>
                    <div><label>Fecha fin</label><input type="date" className="fi-sm" value={p.fin||''} onChange={e=>updPeriodo(i,'fin',e.target.value)}/></div>
                  </div>
                  <div className="pg3" style={{marginTop:6}}>
                    <div><label>Ganados</label><input type="number" className="fi-sm" value={p.ganados||''} step="0.5" min="0" onChange={e=>updPeriodo(i,'ganados',e.target.value)}/></div>
                    <div><label>Usados</label><input type="number" className="fi-sm" value={p.usados||''} step="0.5" min="0" onChange={e=>updPeriodo(i,'usados',e.target.value)}/></div>
                    <div><label>Saldo</label><input className="fi-sm" readOnly value={ps.toFixed(2)} style={{background:'#f8fafc',color:'#0D4170',fontWeight:700}}/></div>
                  </div>
                </div>
              )
            })}
            <button className="btn-add" onClick={addPeriodo}><i className="ti ti-plus" style={{fontSize:13}}></i>Agregar período</button>
            <div style={{display:'flex',gap:10,marginTop:'1.25rem',justifyContent:'flex-end',flexWrap:'wrap'}}>
              <button className="btn-sm" onClick={cerrar}>Cancelar</button>
              <button className="btn-p" style={{marginTop:0}} onClick={guardar}><i className="ti ti-device-floppy" style={{fontSize:14}}></i>Guardar</button>
            </div>
            {ok&&<div className="aok">{ok}</div>}
            {err&&<div className="aerr">{err}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
