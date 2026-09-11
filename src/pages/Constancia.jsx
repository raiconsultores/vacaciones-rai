import { useMemo } from 'react'
import {
  Document, Page, Text, View, Image, StyleSheet, PDFDownloadLink, Line, Svg
} from '@react-pdf/renderer'

const LOGO = 'data:image/png;base64,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'

// ─── Estilos ────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: '#000', padding: '28 36 28 36', backgroundColor: '#fff' },

  // Header
  headerBox:  { flexDirection: 'row', alignItems: 'center', border: '1.5 solid #000', padding: '8 12', marginBottom: 10 },
  headerLogo: { width: 54, height: 26, marginRight: 14 },
  headerTitle:{ fontSize: 18, fontFamily: 'Helvetica-Bold', letterSpacing: 1, textTransform: 'uppercase' },

  // Sección con título flotante
  sec:       { border: '1.5 solid #000', borderRadius: 2, padding: '12 12 10 12', marginBottom: 8, position: 'relative' },
  secTitle:  { position: 'absolute', top: -6, left: 10, backgroundColor: '#fff', paddingLeft: 4, paddingRight: 4, fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // Campos con línea
  fieldRow:  { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  fieldLabel:{ fontSize: 10, marginRight: 4 },
  fieldLine: { flex: 1, borderBottom: '1.5 solid #000', fontSize: 10, paddingBottom: 1 },
  fieldValue:{ fontSize: 10 },

  // Checkboxes
  cbRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 16 },
  cbBox:     { width: 11, height: 11, border: '1.5 solid #000', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  cbLabel:   { fontSize: 10 },

  // Tabla
  table:     { marginTop: 6 },
  tableHead: { flexDirection: 'row', backgroundColor: '#fff' },
  tableRow:  { flexDirection: 'row' },
  thCell:    { flex: 1, border: '1.5 solid #000', padding: '4 6', fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'center' },
  tdCell:    { flex: 1, border: '1.5 solid #000', padding: '5 6', fontSize: 9, textAlign: 'center', minHeight: 18 },

  // Constancia texto
  uline:     { borderBottom: '1.5 solid #000' },

  // Firma
  firmaWrap: { alignItems: 'center', marginTop: 20 },
  firmaLine: { borderTop: '1.5 solid #000', width: 200, paddingTop: 3, fontSize: 8, textAlign: 'center', fontFamily: 'Helvetica' },
})

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = d => {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Componente: campo con línea
function Field({ label, value, lineWidth }) {
  return (
    <View style={S.fieldRow}>
      <Text style={S.fieldLabel}>{label}</Text>
      <View style={[S.fieldLine, lineWidth ? { flex: 0, width: lineWidth } : {}]}>
        <Text style={S.fieldValue}>{value || ''}</Text>
      </View>
    </View>
  )
}

// Componente: checkbox
function Cb({ checked, label }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 18 }}>
      <View style={S.cbBox}>
        {checked && <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>X</Text>}
      </View>
      <Text style={S.cbLabel}>{label}</Text>
    </View>
  )
}

// Componente: sección con título flotante
function Sec({ title, children, style }) {
  return (
    <View style={[S.sec, style]}>
      <Text style={S.secTitle}>{title}</Text>
      {children}
    </View>
  )
}

// ─── Documento PDF ──────────────────────────────────────────────────────────
function ConstanciaPDF({ solicitud, colaborador, jefe }) {
  const nombre     = colaborador?.nombre || ''
  const puesto     = colaborador?.puesto || ''
  const jefNombre  = jefe?.nombre || ''
  const periodos   = colaborador?.periodos_vacaciones || []
  const periodo    = periodos.find(p => p.id === solicitud?.periodo_id) || periodos.find(p => !p.vencido) || {}
  const perIni     = periodo.inicio || ''
  const perFin     = periodo.fin    || ''
  const diasGozar  = solicitud?.dias || 0
  const saldo      = parseFloat(periodo.saldo ?? colaborador?.saldo ?? 0)
  const diasPend   = Math.max(0, saldo).toFixed(2)

  return (
    <Document>
      <Page size="LETTER" style={S.page}>

        {/* Header */}
        <View style={S.headerBox}>
          <Image src={LOGO} style={S.headerLogo} />
          <Text style={S.headerTitle}>Solicitud de Vacaciones</Text>
        </View>

        {/* Información General */}
        <Sec title="Información General">
          <Field label="Nombre del colaborador:" value={nombre} />
          <Field label="Puesto desempeñado:" value={puesto} />
          <Field label="Empresa:" value="RAI Consultores, Sociedad Anónima" />
        </Sec>

        {/* Notas */}
        <Sec title="Notas">
          <Text style={{ fontSize: 10 }}>a) Total de días a gozar por período 15 días.</Text>
        </Sec>

        {/* Período de Vacaciones */}
        <Sec title="Periodo de Vacaciones">
          <View style={S.cbRow}>
            <Text style={[S.fieldLabel, { marginRight: 8 }]}>Por este medio solicito:</Text>
            <Cb checked={true}  label="Días de vacaciones" />
            <Cb checked={false} label="Vacaciones completas" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 8 }}>
            <Text style={S.fieldLabel}>Correspondientes al periodo del</Text>
            <View style={{ borderBottom: '1.5 solid #000', width: 75 }}>
              <Text style={S.fieldValue}>{fmt(perIni)}</Text>
            </View>
            <Text style={S.fieldLabel}>al</Text>
            <View style={{ borderBottom: '1.5 solid #000', width: 75 }}>
              <Text style={S.fieldValue}>{fmt(perFin)}</Text>
            </View>
          </View>

          {/* Tabla */}
          <View style={S.table}>
            <View style={S.tableHead}>
              <Text style={S.thCell}>Iniciando</Text>
              <Text style={S.thCell}>Finalizando</Text>
              <Text style={S.thCell}>Días a gozar</Text>
              <Text style={S.thCell}>Días pendientes</Text>
            </View>
            <View style={S.tableRow}>
              <Text style={S.tdCell}>{fmt(solicitud?.inicio)}</Text>
              <Text style={S.tdCell}>{fmt(solicitud?.fin)}</Text>
              <Text style={S.tdCell}>{diasGozar}</Text>
              <Text style={S.tdCell}>{diasPend}</Text>
            </View>
            {[0,1,2].map(i => (
              <View key={i} style={S.tableRow}>
                <Text style={S.tdCell}> </Text>
                <Text style={S.tdCell}> </Text>
                <Text style={S.tdCell}> </Text>
                <Text style={S.tdCell}> </Text>
              </View>
            ))}
          </View>
        </Sec>

        {/* Anticipo de Salario */}
        <Sec title="Anticipo de Salario">
          <View style={S.cbRow}>
            <Text style={[S.fieldLabel, { marginRight: 8 }]}>¿Desea solicitar anticipo de salario por vacaciones?</Text>
            <Cb checked={false} label="Sí" />
            <Cb checked={true}  label="No" />
          </View>
        </Sec>

        {/* Autorización */}
        <Sec title="AUTORIZACIÓN">
          <Field label="Nombre del jefe inmediato :" value={jefNombre} />
          <View style={{ marginTop: 10 }}>
            <Field label="Firma del jefe inmediato:" value="" />
          </View>
        </Sec>

        {/* Constancia */}
        <Sec title="CONSTANCIA DE VACACIONES">
          <Text style={{ fontSize: 10, lineHeight: 1.8 }}>
            {`Por este medio Yo, ${nombre}, hago constar que por concepto de vacaciones he gozado de ${diasGozar} días correspondientes al periodo del ${fmt(perIni)} al ${fmt(perFin)}.`}
          </Text>

          <View style={S.firmaWrap}>
            <View style={{ borderTop: '1.5 solid #000', width: 200, alignItems: 'center', paddingTop: 3 }}>
              <Text style={{ fontSize: 8 }}>Firma del colaborador</Text>
            </View>
          </View>
        </Sec>

      </Page>
    </Document>
  )
}

// ─── Componente principal (modal con botón de descarga) ──────────────────────
export default function Constancia({ solicitud, colaborador, jefe, onClose }) {
  const nombre = colaborador?.nombre || 'colaborador'

  const doc = useMemo(() => (
    <ConstanciaPDF solicitud={solicitud} colaborador={colaborador} jefe={jefe} />
  ), [solicitud, colaborador, jefe])

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460, padding: '2rem', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '0.5rem', color: '#014BA0' }}>Constancia de Vacaciones</h3>
        <p style={{ fontSize: 13, color: '#555', marginBottom: '1.5rem' }}>
          Se generará el PDF con los datos de la solicitud de <strong>{nombre}</strong>.
        </p>

        <PDFDownloadLink
          document={doc}
          fileName={`Constancia_Vacaciones_${nombre.replace(/\s+/g,'_')}.pdf`}
          style={{ textDecoration: 'none' }}
        >
          {({ loading }) => (
            <button className="btn-p" style={{ marginTop: 0, width: '100%', padding: '0.75rem' }}>
              {loading ? '⏳ Generando PDF...' : '📄 Descargar PDF'}
            </button>
          )}
        </PDFDownloadLink>

        <button
          onClick={onClose}
          style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13 }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
