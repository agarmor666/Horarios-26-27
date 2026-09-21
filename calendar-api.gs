const CALENDAR_SHEET_ID = '1wJ4e-B3zxc0xB8nBNMJKNX4dsqBJMEZkYNckDxXzpR8';
const CALENDAR_SHEET_NAME = '2026-2027';

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || '').trim();
  if (action === 'calendar-get') return json_(getCalendar_());
  return json_({ success: true, service: 'calendar-api', message: 'API calendario CEIP Bartolomé Flores' });
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const data = JSON.parse(raw);
    if (data.action !== 'calendar-set') throw new Error('Acción no válida');
    const result = appendCalendar_(data);
    return json_({ success: true, row: result.row, semaforo: result.semaforo });
  } catch (err) {
    return json_({ success: false, error: String(err && err.message ? err.message : err) });
  }
}

function appendCalendar_(data) {
  const ss = SpreadsheetApp.openById(CALENDAR_SHEET_ID);
  const sh = ss.getSheetByName(CALENDAR_SHEET_NAME);
  if (!sh) throw new Error('No existe la pestaña 2026-2027');

  const fecha = clean_(data.fecha);
  const inicio = clean_(data.inicio);
  const fin = clean_(data.fin);
  const tipo = clean_(data.tipo) || 'Actividad complementaria';
  const categoria = clean_(data.categoria) || 'Actividades complementarias';
  const profesional = clean_(data.profesional);
  const actividad = clean_(data.actividad);
  const nivel = clean_(data.nivel);
  const grupos = clean_(data.grupos);
  const responsable = clean_(data.responsable);
  const lugar = clean_(data.lugar);
  const estado = clean_(data.estado) || 'PROGRAMADA';
  const aviso = clean_(data.aviso) || 'Pendiente';
  const correo = clean_(data.correo);
  const observaciones = clean_(data.observaciones);

  if (!fecha) throw new Error('La fecha es obligatoria');
  if (!actividad) throw new Error('La actividad es obligatoria');
  if (!grupos) throw new Error('El grupo o destinatarios son obligatorios');

  const semaforo = semaforo_(estado);
  sh.appendRow([semaforo, fecha, inicio, fin, tipo, categoria, profesional, actividad, nivel, grupos, responsable, lugar, estado, aviso, correo, observaciones]);
  const row = sh.getLastRow();
  sh.getRange(row, 2).setNumberFormat('dd/MM/yyyy');
  return { row: row, semaforo: semaforo };
}

function getCalendar_() {
  const ss = SpreadsheetApp.openById(CALENDAR_SHEET_ID);
  const sh = ss.getSheetByName(CALENDAR_SHEET_NAME);
  if (!sh) throw new Error('No existe la pestaña 2026-2027');
  const last = sh.getLastRow();
  if (last < 3) return { success: true, rows: [] };
  const values = sh.getRange(3, 1, last - 2, 16).getDisplayValues();
  return { success: true, rows: values };
}

function semaforo_(estado) {
  const x = String(estado || '').toUpperCase();
  if (x === 'CONFIRMADA') return '🟢';
  if (x === 'CONFLICTO') return '🔴';
  return '🟡';
}

function clean_(v) {
  return String(v == null ? '' : v).trim();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
