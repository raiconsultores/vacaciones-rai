export const AVS = [
  {bg:"#B5D4F4",fg:"#0C447C"},{bg:"#9FE1CB",fg:"#085041"},
  {bg:"#FAC775",fg:"#633806"},{bg:"#CECBF6",fg:"#3C3489"},
  {bg:"#F5C4B3",fg:"#712B13"},{bg:"#C0DD97",fg:"#27500A"},
  {bg:"#F4C0D1",fg:"#72243E"},{bg:"#D3D1C7",fg:"#444441"},
  {bg:"#B5D4F4",fg:"#1e3a8a"},{bg:"#9FE1CB",fg:"#14532d"},
  {bg:"#CECBF6",fg:"#4c1d95"},{bg:"#FAC775",fg:"#854d0e"},
]
export const ini = n => (n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
export const av  = id => AVS[id % AVS.length]
export const fmtD = d => new Date(d+'T00:00:00').toLocaleDateString('es-GT',{day:'2-digit',month:'short'})
export const fmtF = d => new Date(d+'T00:00:00').toLocaleDateString('es-GT',{day:'2-digit',month:'long',year:'numeric'})

export function calcAntiguedad(ingresoStr) {
  if (!ingresoStr) return null
  const ing = new Date(ingresoStr+'T00:00:00')
  const hoy = new Date()
  if (isNaN(ing)||ing>hoy) return null
  let a=hoy.getFullYear()-ing.getFullYear(), m=hoy.getMonth()-ing.getMonth(), d=hoy.getDate()-ing.getDate()
  if(d<0){m--;d+=new Date(hoy.getFullYear(),hoy.getMonth(),0).getDate()}
  if(m<0){a--;m+=12}
  const totalDias=(hoy-ing)/(1000*60*60*24)
  return {anios:a,meses:m,dias:d,diasGanados:((totalDias/365)*15).toFixed(2),str:`${a} año(s), ${m} mes(es), ${d} día(s)`}
}
export const canSol     = p => ['colaborador','admin','jefe','gerente'].includes(p.rol)
export const canApprove = p => ['jefe','admin','gerente'].includes(p.rol)
export const canSeeRes  = p => ['admin','gerente'].includes(p.rol)
export const canManage  = p => p.rol === 'admin'
