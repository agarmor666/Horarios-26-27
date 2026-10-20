const CONFIG = {
  SHEET_NAME: 'Solicitudes',
  PDF_FOLDER_NAME: 'Compromisos educativos 2026-2027',
  SCHOOL_NAME: 'CEIP Bartolomé Flores',
  SCHOOL_CODE: '04003160'
};

const HEADERS = [
  'Código','Fecha de registro','Tipo de compromiso','Estado','Representante legal',
  'Correo familiar','Parentesco','Alumno/a','Grupo','Tutor/a','Duración','Objetivos',
  'Otro objetivo','Compromisos de la familia','Otros compromisos','Observaciones',
  'Nombre de la persona firmante','Aceptación','Documento PDF','Fecha de seguimiento',
  'Observaciones de seguimiento','Estado final','Valoración final',
  'Compromisos del centro','Otros compromisos del centro','Versión del modelo'
];

function doGet() {
  return json_({ok:true,message:'Servicio de compromisos educativos activo'});
}

function doPost(e) {
  try {
    const data = JSON.parse(e && e.postData && e.postData.contents || '{}');
    if (data.action !== 'submitCommitment') throw new Error('Acción no válida');
    if (String(data.website || '').trim()) return json_({ok:true,code:'RECIBIDO'});
    validate_(data);

    const cache = CacheService.getScriptCache();
    const fingerprint = digest_([data.email,data.alumno,data.tipo].join('|').toLowerCase());
    if (cache.get(fingerprint)) throw new Error('Esta solicitud acaba de enviarse. Espera dos minutos antes de repetirla.');
    cache.put(fingerprint,'1',120);

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      const code = makeCode_();
      const registeredAt = new Date();
      const pdf = createPdf_(data,code,registeredAt);
      appendRow_(data,code,registeredAt,pdf.file.getUrl());
      sendEmails_(data,code,pdf.blob);
      return json_({ok:true,code:code});
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ok:false,message:String(err && err.message || err)});
  }
}

function validate_(d) {
  const required = ['tipo','representante','email','parentesco','alumno','grupo','tutor','duracion','firmante'];
  required.forEach(k => { if (!String(d[k] || '').trim()) throw new Error('Falta un campo obligatorio: '+k); });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email))) throw new Error('El correo electrónico no es válido');
  if (!['educativo','convivencia'].includes(d.tipo)) throw new Error('Tipo de compromiso no válido');
  if (!Array.isArray(d.objetivos) || !d.objetivos.length) throw new Error('Debe seleccionarse al menos un objetivo');
  if (!Array.isArray(d.compromisosFamilia) || !d.compromisosFamilia.length) throw new Error('Debe seleccionarse al menos un compromiso familiar');
  if (!Array.isArray(d.compromisosCentro) || !d.compromisosCentro.length) throw new Error('Debe seleccionarse al menos un compromiso del centro');
  if (d.aceptacion !== true) throw new Error('Falta la aceptación expresa');
  if (!/^data:image\/png;base64,/.test(String(d.firma || ''))) throw new Error('Falta la firma manuscrita');
  if (String(d.firma).length > 750000) throw new Error('La firma supera el tamaño permitido');
}

function appendRow_(d,code,date,pdfUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) sh = ss.insertSheet(CONFIG.SHEET_NAME);
  ensureHeaders_(sh);
  const row = [
    code,date,labelType_(d.tipo),'Pendiente de validación',safe_(d.representante),safe_(d.email),
    safe_(d.parentesco),safe_(d.alumno),safe_(d.grupo),safe_(d.tutor),safe_(d.duracion),
    safe_(d.objetivos.join(' | ')),safe_(d.otroObjetivo),safe_(d.compromisosFamilia.join(' | ')),
    safe_(d.otroCompromiso),safe_(d.observaciones),safe_(d.firmante),'Sí',pdfUrl,'','','','',
    safe_(d.compromisosCentro.join(' | ')),safe_(d.otroCompromisoCentro),safe_(d.modeloVersion)
  ];
  sh.appendRow(row);
  sh.getRange(sh.getLastRow(),2).setNumberFormat('dd/mm/yyyy hh:mm');
}

function ensureHeaders_(sh) {
  const current = sh.getLastRow() ? sh.getRange(1,1,1,HEADERS.length).getDisplayValues()[0] : [];
  if (HEADERS.some((h,i)=>current[i]!==h)) {
    sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    sh.getRange(1,1,1,HEADERS.length).setFontWeight('bold').setBackground('#e5e7eb').setWrap(true);
    sh.setFrozenRows(1);
  }
}

function createPdf_(d,code,date) {
  const doc = DocumentApp.create(code+' - '+d.alumno);
  const body = doc.getBody();
  body.appendParagraph(CONFIG.SCHOOL_NAME+' · MOJÁCAR').setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph(labelType_(d.tipo).toUpperCase()).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Código: '+code+' · Registrado: '+formatDate_(date));
  body.appendHorizontalRule();
  addField_(body,'Representante legal',d.representante+' ('+d.parentesco+')');
  addField_(body,'Correo familiar',d.email);
  addField_(body,'Alumno/a',d.alumno);
  addField_(body,'Grupo y tutor/a',d.grupo+' · '+d.tutor);
  addField_(body,'Duración prevista',d.duracion);
  addList_(body,'Objetivos seleccionados',d.objetivos,d.otroObjetivo);
  addList_(body,'Compromisos de la familia',d.compromisosFamilia,d.otroCompromiso);
  addList_(body,'Compromisos del centro',d.compromisosCentro,d.otroCompromisoCentro);
  addField_(body,'Observaciones',d.observaciones || 'Sin observaciones');
  body.appendParagraph('Firma del representante legal').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(d.firmante);
  const bytes = Utilities.base64Decode(String(d.firma).split(',')[1]);
  const image = body.appendImage(Utilities.newBlob(bytes,'image/png','firma.png'));
  if (image.getWidth() > 260) image.setWidth(260);
  body.appendParagraph('La persona firmante declara que los datos son correctos y acepta los compromisos seleccionados. Solicitud pendiente de validación por el centro.');
  body.appendParagraph('CEIP Bartolomé Flores · Código 04003160 · Plaza Rey Alabez, 11 · 04638 Mojácar (Almería)');
  doc.saveAndClose();

  const source = DriveApp.getFileById(doc.getId());
  const blob = source.getAs(MimeType.PDF).setName(code+' - '+d.alumno+'.pdf');
  const folders = DriveApp.getFoldersByName(CONFIG.PDF_FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(CONFIG.PDF_FOLDER_NAME);
  const file = folder.createFile(blob);
  source.setTrashed(true);
  return {file:file,blob:blob};
}

function addField_(body,title,value) {
  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(String(value || ''));
}

function addList_(body,title,items,other) {
  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  (items || []).forEach(x => body.appendListItem(String(x)).setGlyphType(DocumentApp.GlyphType.BULLET));
  if (String(other || '').trim()) body.appendListItem('Otro: '+other).setGlyphType(DocumentApp.GlyphType.BULLET);
}

function sendEmails_(d,code,pdfBlob) {
  const subject='['+code+'] '+labelType_(d.tipo)+' - '+d.alumno;
  const adminHtml='<p>Se ha recibido una nueva solicitud pendiente de validación.</p>'+summaryHtml_(d,code)+'<p>La copia completa se adjunta en PDF y el registro se encuentra en la hoja de cálculo.</p>';
  const adminEmail = Session.getEffectiveUser().getEmail();
  MailApp.sendEmail({to:adminEmail,subject:subject,htmlBody:adminHtml,attachments:[pdfBlob],name:CONFIG.SCHOOL_NAME});
  const familyHtml='<p>Hemos recibido correctamente su solicitud.</p>'+summaryHtml_(d,code)+'<p><strong>Estado: pendiente de validación por el centro.</strong></p><p>Conserve este código. Se adjunta una copia en PDF.</p>';
  MailApp.sendEmail({to:d.email,subject:'Solicitud recibida · '+code,htmlBody:familyHtml,attachments:[pdfBlob],name:CONFIG.SCHOOL_NAME,replyTo:adminEmail});
}

function summaryHtml_(d,code) {
  return '<table style="border-collapse:collapse">'+
    htmlRow_('Código',code)+htmlRow_('Tipo',labelType_(d.tipo))+htmlRow_('Alumno/a',d.alumno)+
    htmlRow_('Grupo',d.grupo)+htmlRow_('Representante legal',d.representante)+htmlRow_('Tutor/a',d.tutor)+'</table>';
}

function htmlRow_(key,value) {
  return '<tr><th style="text-align:left;border:1px solid #ddd;padding:7px;background:#f1f5f9">'+html_(key)+'</th><td style="border:1px solid #ddd;padding:7px">'+html_(value)+'</td></tr>';
}

function labelType_(type) { return type==='convivencia' ? 'Compromiso de convivencia' : 'Compromiso educativo'; }
function makeCode_() { return 'COMP-'+Utilities.formatDate(new Date(),'Europe/Madrid','yyyyMMdd')+'-'+Utilities.getUuid().slice(0,6).toUpperCase(); }
function formatDate_(d) { return Utilities.formatDate(d,'Europe/Madrid','dd/MM/yyyy HH:mm'); }
function digest_(s) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s)).slice(0,48); }
function safe_(v) { const s=String(v || ''); return /^[=+\-@]/.test(s) ? "'"+s : s; }
function html_(v) { return String(v || '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
