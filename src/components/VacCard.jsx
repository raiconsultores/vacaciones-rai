import { calcAntiguedad } from '../lib/helpers'

export default function VacCard({ profile }) {
  const periodos = profile.periodos_vacaciones || []
  const saldo    = parseFloat(profile.saldo) || 0
  const pct      = Math.min(100, Math.round((saldo / 15) * 100))
  const vc       = calcAntiguedad(profile.ingreso)
  const tg       = periodos.reduce((s,p) => s+(parseFloat(p.ganados)||0), 0)
  const tu       = periodos.reduce((s,p) => s+(parseFloat(p.usados)||0), 0)
  const vencidos = periodos.filter(p => p.vencido && ((parseFloat(p.ganados)||0)-(parseFloat(p.usados)||0))>0)
  const sv       = vencidos.reduce((s,p) => s+((parseFloat(p.ganados)||0)-(parseFloat(p.usados)||0)), 0)

  return (
    <div className="card">
      <div className="card-title">Saldo de vacaciones acumulado</div>
      <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:10}}>
        <span style={{fontSize:40,fontWeight:700,color:'#0D4170'}}>{saldo.toFixed(2)}</span>
        <span style={{fontSize:15,color:'#64748b'}}>días disponibles</span>
        {sv>0 && <span className="pill pill-venc" style={{marginLeft:4}}>{sv.toFixed(2)} vencidos</span>}
      </div>
      <div className="bar-track"><div className="bar-fill" style={{width:`${pct}%`}}></div></div>
      <div style={{fontSize:11,color:'#94a3b8',marginTop:6}}>{pct}% del último ciclo anual</div>
      {vc && (
        <div className="vc-box" style={{marginTop:'.85rem'}}>
          <div className="vc-title"><i className="ti ti-calculator" style={{fontSize:14}}></i>Resumen de vacaciones</div>
          <div className="vc-row"><span>Antigüedad</span><span>{vc.str}</span></div>
          <div className="vc-row"><span>Días ganados por antigüedad</span><span>{vc.diasGanados} días</span></div>
          <div className="vc-row"><span>Total ganados (períodos)</span><span>{tg.toFixed(2)} días</span></div>
          <div className="vc-row"><span>Total utilizados</span><span>{tu.toFixed(2)} días</span></div>
          {sv>0 && <div className="vc-row venc"><span>Días vencidos</span><span>{sv.toFixed(2)} días</span></div>}
          <div className="vc-row"><span>Saldo total disponible</span><span>{saldo.toFixed(2)} días</span></div>
        </div>
      )}
      {periodos.length>0 && (
        <div style={{marginTop:'.85rem'}}>
          <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Detalle por período</div>
          {periodos.map((p,i) => {
            const ps=Math.max(0,(parseFloat(p.ganados)||0)-(parseFloat(p.usados)||0))
            const tag=p.vencido
              ?(ps>0?<span style={{background:'#faf5ff',color:'#6b21a8',borderRadius:10,padding:'1px 6px',fontSize:10,fontWeight:700}}>VENCIDO CON SALDO</span>
                    :<span style={{background:'#f1f5f9',color:'#64748b',borderRadius:10,padding:'1px 6px',fontSize:10}}>VENCIDO</span>)
              :<span style={{background:'#f0fdf4',color:'#166534',borderRadius:10,padding:'1px 6px',fontSize:10,fontWeight:700}}>ACTIVO</span>
            return (
              <div key={i} className="prow">
                <div>
                  <span style={{fontSize:13,fontWeight:600}}>{p.anio}</span> {tag}
                  <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>Ganados: {(parseFloat(p.ganados)||0).toFixed(2)} · Usados: {(parseFloat(p.usados)||0).toFixed(2)}</div>
                </div>
                <span style={{fontWeight:700,color:p.vencido&&ps>0?'#6b21a8':'#0D4170',flexShrink:0}}>{ps.toFixed(2)} días</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
