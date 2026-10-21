const CALENDAR_SHEET_ID = '1wJ4e-B3zxc0xB8nBNMJKNX4dsqBJMEZkYNckDxXzpR8';
const CALENDAR_SHEET_NAME = '2026-2027';
const PROGRAMACION_DOCX_ID = '1-Y5wzydDc-g5R_3Mam-vuLJwAq_6xiUX';

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || '').trim();
  if (action === 'calendar-get') {
    try { syncProgramacionDocx_(); } catch (err) { console.log('Sincronización programación: ' + err); }
    return json_(getCalendar_());
  }
  if (action === 'calendar-sync-programacion') return json_(syncProgramacionDocx_());
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


function syncProgramacionDocx_() {
  const file = DriveApp.getFileById(PROGRAMACION_DOCX_ID);
  const files = Utilities.unzip(file.getBlob());
  const docXml = files.find(b => b.getName() === 'word/document.xml');
  if (!docXml) throw new Error('No se ha podido leer word/document.xml');

  const xml = docXml.getDataAsString('UTF-8');
  const paragraphs = [...xml.matchAll(/<w:p\\b[^>]*>([\\s\\S]*?)<\\/w:p>/g)]
    .map(m => [...m[1].matchAll(/<w:t(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/w:t>/g)]
      .map(x => decodeXml_(x[1])).join('').trim())
    .filter(Boolean);

  const ss = SpreadsheetApp.openById(CALENDAR_SHEET_ID);
  const sh = ss.getSheetByName(CALENDAR_SHEET_NAME);
  if (!sh) throw new Error('No existe la pestaña 2026-2027');

  const existing = sh.getLastRow() >= 3
    ? sh.getRange(3, 1, sh.getLastRow() - 2, 16).getDisplayValues()
    : [];
  const keys = new Set(existing.map(r => normalizeKey_(r[1] + '|' + r[7])));

  let etapa = '';
  const added = [];

  paragraphs.forEach(text => {
    const upper = text.toUpperCase();
    if (upper.includes('EDUCACIÓN INFANTIL')) { etapa = 'Educación Infantil'; return; }
    if (/\\bPRIMER CICLO\\b/.test(upper)) { etapa = 'Primer ciclo'; return; }
    if (/\\bSEGUNDO CICLO\\b/.test(upper)) { etapa = 'Segundo ciclo'; return; }
    if (/\\bTERCER CICLO\\b/.test(upper)) { etapa = 'Tercer ciclo'; return; }
    if (!etapa) return;

    const parsed = parseProgramacionDate_(text);
    if (!parsed) return;

    const actividad = cleanActivityText_(text, parsed.matchedText);
    if (!actividad || /TRIMESTRE/i.test(actividad)) return;

    const grupos = etapa === 'Educación Infantil' ? 'Infantil'
      : etapa === 'Primer ciclo' ? '1.º y 2.º de Primaria'
      : etapa === 'Segundo ciclo' ? '3.º y 4.º de Primaria'
      : '5.º y 6.º de Primaria';

    const fecha = Utilities.formatDate(parsed.date, Session.getScriptTimeZone() || 'Europe/Madrid', 'dd/MM/yyyy');
    const key = normalizeKey_(fecha + '|' + actividad);
    if (keys.has(key)) return;

    sh.appendRow([
      '🟡', parsed.date, parsed.time || '', '',
      'Actividad complementaria', 'Actividades complementarias', '',
      actividad, etapa, grupos, '', '',
      'PROGRAMADA', 'Pendiente', '',
      'Importada automáticamente de la Programación de Actividades Complementarias y Extraescolares 2026/27.'
    ]);
    const row = sh.getLastRow();
    sh.getRange(row, 2).setNumberFormat('dd/MM/yyyy');
    keys.add(key);
    added.push({fecha: fecha, actividad: actividad, etapa: etapa});
  });

  return { success: true, source: file.getName(), added: added.length, rows: added };
}

function parseProgramacionDate_(text) {
  const months = {
    enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,
    julio:6,agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11
  };
  let m = text.match(/(\\d{1,2})\\s+de\\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\\s+de\\s+(20\\d{2}))?/i);
  if (m) {
    const month = months[m[2].toLowerCase()];
    const year = m[3] ? Number(m[3]) : (month >= 8 ? 2026 : 2027);
    const tm = text.match(/(?:a\\s+las\\s+)?(\\d{1,2}):(\\d{2})\\s*h?/i);
    return {date:new Date(year,month,Number(m[1])), time:tm ? (String(tm[1]).padStart(2,'0')+':'+tm[2]) : '', matchedText:m[0]};
  }
  m = text.match(/(\\d{1,2})\\/(\\d{1,2})\\/(\\d{2,4})/);
  if (m) {
    const year = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]);
    return {date:new Date(year,Number(m[2])-1,Number(m[1])), time:'', matchedText:m[0]};
  }
  return null;
}

function cleanActivityText_(text, matchedDate) {
  return String(text || '')
    .replace(/^[-*•\\s]+/, '')
    .replace(/\\b(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\\b/ig, '')
    .replace(matchedDate || '', '')
    .replace(/(?:a\\s+las\\s+)?\\d{1,2}:\\d{2}\\s*h?\\.?/ig, '')
    .replace(/[.,;:\\-\\s]+$/g, '')
    .replace(/\\s{2,}/g, ' ')
    .trim();
}

function decodeXml_(s) {
  return String(s || '')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&apos;/g,"'");
}

function normalizeKey_(s) {
  return String(s || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/\\s+/g,' ').trim();
}

function installProgramacionSyncTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'syncProgramacionDocx_')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncProgramacionDocx_').timeBased().everyHours(1).create();
  return {success:true, message:'Sincronización automática cada hora activada'};
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
