const CONFIG = {
  SHEET_NAME: 'Solicitudes',
  CONVIVENCIA_SHEET_NAME: 'Compromisos de convivencia',
  FAMILY_SHEET_NAME: 'Familias',
  PDF_FOLDER_ID: '1gKBP4cNWl2TyjGemt9J1mfGYXeQoz3G4',
  SCHOOL_NAME: 'CEIP Bartolomé Flores',
  SCHOOL_CODE: '04003160',
  INSTITUTIONAL_EMAILS: [
    'jefaturadeestudios@bartolomeflores.com',
    '04003160@bartolomeflores.com'
  ]
};

// Las columnas nuevas se añaden al final para conservar los registros ya existentes.
const HEADERS = [
  'Código','Fecha de registro','Tipo de compromiso','Estado','Representante legal',
  'Correo familiar','Parentesco','Alumno/a','Grupo','Tutor/a','Duración','Objetivos',
  'Otro objetivo','Compromisos de la familia','Otros compromisos','Observaciones',
  'Nombre de la persona firmante','Aceptación','Documento PDF','Fecha de seguimiento',
  'Observaciones de seguimiento','Estado final','Valoración final',
  'Compromisos del centro','Otros compromisos del centro','Versión del modelo',
  'Nombre de la madre','Correo de la madre','Nombre del padre','Correo del padre',
  'Correo del profesorado','Firmante familiar','Firmante del profesorado',
  'Firma familiar','Firma del profesorado','Destinatarios de correo'
];

function doGet() {
  return json_({ok:true,message:'Servicio de compromisos educativos activo'});
}

function doPost(e) {
  try {
    const data = JSON.parse(e && e.postData && e.postData.contents || '{}');
    if (data.action === 'getGuardians') {
      const student = String(data.alumno || '').trim();
      if (!student) throw new Error('Falta seleccionar el alumno/a');
      return json_({ok:true,guardians:guardiansForStudent_(student)});
    }
    if (data.action !== 'submitCommitment') throw new Error('Acción no válida');
    if (String(data.website || '').trim()) return json_({ok:true,code:'RECIBIDO'});
    normaliseLegacyFields_(data);
    validate_(data);

    const cache = CacheService.getScriptCache();
    const fingerprint = digest_([data.emailProfesor,data.emailMadre,data.emailPadre,data.alumno,data.tipo].join('|').toLowerCase());
    if (cache.get(fingerprint)) throw new Error('Esta solicitud acaba de enviarse. Espera dos minutos antes de repetirla.');
    cache.put(fingerprint,'1',120);

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      const code = makeCode_(data);
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

function normaliseLegacyFields_(d) {
  d.firmanteFamilia = d.firmanteFamilia || d.firmante || '';
  d.firmaFamilia = d.firmaFamilia || d.firma || '';
  d.nombreMadre = d.nombreMadre || (d.parentesco === 'Madre' ? d.representante : '');
  d.emailMadre = d.emailMadre || (d.parentesco === 'Madre' ? d.email : '');
  d.nombrePadre = d.nombrePadre || (d.parentesco === 'Padre' ? d.representante : '');
  d.emailPadre = d.emailPadre || (d.parentesco === 'Padre' ? d.email : '');
}

function validate_(d) {
  const required = ['tipo','alumno','grupo','tutor','emailProfesor','duracion','firmanteFamilia','firmanteProfesor'];
  required.forEach(k => { if (!String(d[k] || '').trim()) throw new Error('Falta un campo obligatorio: '+k); });
  validatePersonPair_('madre',d.nombreMadre,d.emailMadre);
  validatePersonPair_('padre',d.nombrePadre,d.emailPadre);
  if (!String(d.nombreMadre || '').trim() && !String(d.nombrePadre || '').trim()) throw new Error('Debe indicarse al menos la madre o el padre');
  if (d.nombreMadre && d.nombrePadre && canonicalName_(d.nombreMadre) === canonicalName_(d.nombrePadre)) throw new Error('La madre y el padre no pueden ser la misma persona');
  [d.emailMadre,d.emailPadre,d.emailProfesor].filter(Boolean).forEach(validateEmail_);
  validateRegisteredGuardians_(d);
  if (!['educativo','convivencia'].includes(d.tipo)) throw new Error('Tipo de compromiso no válido');
  if (!Array.isArray(d.objetivos) || !d.objetivos.length) throw new Error('Debe seleccionarse al menos un objetivo');
  if (!Array.isArray(d.compromisosFamilia) || !d.compromisosFamilia.length) throw new Error('Debe seleccionarse al menos un compromiso familiar');
  if (!Array.isArray(d.compromisosCentro) || !d.compromisosCentro.length) throw new Error('Debe seleccionarse al menos un compromiso del centro');
  if (d.aceptacion !== true) throw new Error('Falta la aceptación expresa');
  validateSignature_(d.firmaFamilia,'familia');
  validateSignature_(d.firmaProfesor,'profesorado');
}

function validateRegisteredGuardians_(d) {
  const allowed = guardiansForStudent_(d.alumno).map(canonicalName_);
  if (!allowed.length) throw new Error('No se ha encontrado la familia del alumno/a seleccionado');
  [['madre',d.nombreMadre],['padre',d.nombrePadre]].forEach(pair=>{
    if (pair[1] && allowed.indexOf(canonicalName_(pair[1])) < 0) throw new Error('El nombre indicado para '+pair[0]+' no coincide con el registro de tutores del centro');
  });
}

function guardiansForStudent_(studentName) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.FAMILY_SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) throw new Error('El registro de familias no está disponible');
  const rows = sh.getRange(2,1,sh.getLastRow()-1,2).getDisplayValues();
  const student = canonicalName_(studentName);
  const seen = {};
  return rows.filter(r=>canonicalName_(r[0])===student).map(r=>String(r[1] || '').trim()).filter(name=>name && !seen[canonicalName_(name)] && (seen[canonicalName_(name)]=true));
}

function canonicalName_(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s*\(\d+\)\s*$/,'').replace(/[^a-zA-Z0-9]+/g,' ').trim().toLowerCase().split(/\s+/).sort().join(' ');
}

function validatePersonPair_(label,name,email) {
  if (Boolean(String(name || '').trim()) !== Boolean(String(email || '').trim())) throw new Error('Debe completarse el nombre y el correo de la '+label);
}
function validateEmail_(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) throw new Error('El correo electrónico no es válido: '+email);
}
function validateSignature_(signature,label) {
  if (!/^data:image\/png;base64,/.test(String(signature || ''))) throw new Error('Falta la firma manuscrita de '+label);
  if (String(signature).length > 750000) throw new Error('La firma de '+label+' supera el tamaño permitido');
}

function familyRecipients_(d) {
  return uniqueEmails_([d.emailMadre,d.emailPadre]);
}
function allRecipients_(d) {
  return uniqueEmails_(CONFIG.INSTITUTIONAL_EMAILS.concat(familyRecipients_(d),[d.emailProfesor]));
}
function uniqueEmails_(items) {
  const seen = {};
  return (items || []).map(x=>String(x || '').trim().toLowerCase()).filter(x=>x && !seen[x] && (seen[x]=true));
}

function appendRow_(d,code,date,pdfUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = d.tipo === 'convivencia' ? CONFIG.CONVIVENCIA_SHEET_NAME : CONFIG.SHEET_NAME;
  let sh = ss.getSheetByName(sheetName);
  if (!sh) sh = ss.insertSheet(sheetName);
  ensureHeaders_(sh);
  const row = [
    code,date,labelType_(d.tipo),'Registrado',safe_(d.representante),safe_(d.email),
    safe_(d.parentesco),safe_(d.alumno),safe_(d.grupo),safe_(d.tutor),safe_(d.duracion),
    safe_(d.objetivos.join(' | ')),safe_(d.otroObjetivo),safe_(d.compromisosFamilia.join(' | ')),
    safe_(d.otroCompromiso),safe_(d.observaciones),safe_(d.firmanteFamilia),'Sí',pdfUrl,'','','','',
    safe_(d.compromisosCentro.join(' | ')),safe_(d.otroCompromisoCentro),safe_(d.modeloVersion),
    safe_(d.nombreMadre),safe_(d.emailMadre),safe_(d.nombrePadre),safe_(d.emailPadre),
    safe_(d.emailProfesor),safe_(d.firmanteFamilia),safe_(d.firmanteProfesor),
    'Incluida en el PDF','Incluida en el PDF',safe_(allRecipients_(d).join(' | '))
  ];
  sh.appendRow(row);
  sh.getRange(sh.getLastRow(),2).setNumberFormat('dd/mm/yyyy hh:mm');
}

function ensureHeaders_(sh) {
  if (sh.getMaxColumns() < HEADERS.length) sh.insertColumnsAfter(sh.getMaxColumns(),HEADERS.length-sh.getMaxColumns());
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
  addField_(body,'Alumno/a',d.alumno);
  addField_(body,'Grupo',d.grupo);
  addField_(body,'Maestro/a que suscribe',d.tutor+' · '+d.emailProfesor);
  if (d.nombreMadre) addField_(body,'Madre',d.nombreMadre+' · '+d.emailMadre);
  if (d.nombrePadre) addField_(body,'Padre',d.nombrePadre+' · '+d.emailPadre);
  addField_(body,'Duración prevista',d.duracion);
  addList_(body,'Objetivos seleccionados',d.objetivos,d.otroObjetivo);
  addList_(body,'Compromisos de la familia',d.compromisosFamilia,d.otroCompromiso);
  addList_(body,'Compromisos del centro',d.compromisosCentro,d.otroCompromisoCentro);
  addField_(body,'Observaciones',d.observaciones || 'Sin observaciones');
  appendSignature_(body,'Firma de la familia',d.firmanteFamilia,d.firmaFamilia,'firma-familia.png');
  appendSignature_(body,'Firma del profesorado',d.firmanteProfesor,d.firmaProfesor,'firma-profesorado.png');
  body.appendParagraph('Las personas firmantes declaran que los datos son correctos y aceptan los compromisos seleccionados. El compromiso queda registrado en el centro.');
  body.appendParagraph('CEIP Bartolomé Flores · Código 04003160 · Plaza Rey Alabez, 11 · 04638 Mojácar (Almería)');
  doc.saveAndClose();

  const source = DriveApp.getFileById(doc.getId());
  const blob = source.getAs(MimeType.PDF).setName(code+' - '+d.alumno+'.pdf');
  const folder = DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID);
  const file = folder.createFile(blob);
  source.setTrashed(true);
  return {file:file,blob:blob};
}

function appendSignature_(body,title,name,dataUrl,fileName) {
  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(name);
  const bytes = Utilities.base64Decode(String(dataUrl).split(',')[1]);
  const image = body.appendImage(Utilities.newBlob(bytes,'image/png',fileName));
  if (image.getWidth() > 260) image.setWidth(260);
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
  const replyTo = CONFIG.INSTITUTIONAL_EMAILS[0];
  const subject='['+code+'] '+labelType_(d.tipo)+' - '+d.alumno;
  const adminHtml='<p>Se ha registrado un nuevo compromiso firmado por la familia y el profesorado.</p>'+summaryHtml_(d,code)+'<p>La copia completa se adjunta en PDF y el registro se encuentra en la hoja de cálculo.</p>';
  MailApp.sendEmail({to:CONFIG.INSTITUTIONAL_EMAILS.join(','),subject:subject,htmlBody:adminHtml,attachments:[pdfBlob],name:CONFIG.SCHOOL_NAME,replyTo:replyTo});
  const copyHtml='<p>Se ha registrado correctamente el compromiso suscrito por la familia y el profesorado.</p>'+summaryHtml_(d,code)+'<p><strong>Estado: registrado.</strong></p><p>Conserve este código. Se adjunta una copia completa en PDF.</p>';
  familyRecipients_(d).forEach(email=>MailApp.sendEmail({to:email,subject:'Compromiso recibido · '+code,htmlBody:copyHtml,attachments:[pdfBlob],name:CONFIG.SCHOOL_NAME,replyTo:replyTo}));
  MailApp.sendEmail({to:d.emailProfesor,subject:'Compromiso recibido · '+code,htmlBody:copyHtml,attachments:[pdfBlob],name:CONFIG.SCHOOL_NAME,replyTo:replyTo});
}

function summaryHtml_(d,code) {
  return '<table style="border-collapse:collapse">'+
    htmlRow_('Código',code)+htmlRow_('Tipo',labelType_(d.tipo))+htmlRow_('Alumno/a',d.alumno)+
    htmlRow_('Grupo',d.grupo)+htmlRow_('Maestro/a',d.tutor)+
    htmlRow_('Madre',d.nombreMadre || 'No indicada')+htmlRow_('Padre',d.nombrePadre || 'No indicado')+'</table>';
}
function htmlRow_(key,value) {
  return '<tr><th style="text-align:left;border:1px solid #ddd;padding:7px;background:#f1f5f9">'+html_(key)+'</th><td style="border:1px solid #ddd;padding:7px">'+html_(value)+'</td></tr>';
}
function labelType_(type) { return type==='convivencia' ? 'Compromiso de convivencia' : 'Compromiso educativo'; }
function makeCode_(d) {
  const date = Utilities.formatDate(new Date(),'Europe/Madrid','ddMMyyyy');
  const typeCode = d.tipo === 'convivencia' ? 'CON' : 'ED';
  const group = codePart_(d.grupo);
  const teacher = personInitials_(d.tutor);
  const student = personInitials_(d.alumno);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const codes = [CONFIG.SHEET_NAME,CONFIG.CONVIVENCIA_SHEET_NAME].reduce((all,name)=>{
    const sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return all;
    return all.concat(sh.getRange(2,1,sh.getLastRow()-1,1).getDisplayValues().map(r=>String(r[0] || '')).filter(Boolean));
  },[]);
  const numbered = codes.map(x=>{const m=x.match(/^COMP-(?:(?:ED|CON)-)?(\d{3,})-/);return m?Number(m[1]):0}).filter(Number.isFinite);
  const lastNumber = Math.max(codes.length,numbered.length ? Math.max.apply(null,numbered) : 0);
  const sequence = String(lastNumber+1).padStart(3,'0');
  return ['COMP',typeCode,sequence,date,group,teacher,student].join('-');
}

function codePart_(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]/g,'').toUpperCase() || 'SG';
}

function personInitials_(value) {
  const clean = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z, ]/g,' ').replace(/\s+/g,' ').trim();
  const parts = clean.split(',');
  let firstName = '', firstSurname = '';
  if (parts.length > 1) {
    const surnames = parts[0].trim().split(/\s+/).filter(Boolean);
    const given = parts.slice(1).join(' ').trim().split(/\s+/).filter(Boolean);
    firstName = given[0] || '';
    firstSurname = surnames[0] || '';
  } else {
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length > 2) {
      firstName = words[2] || '';
      firstSurname = words[0] || '';
    } else {
      firstName = words[0] || '';
      firstSurname = words[1] || '';
    }
  }
  const initials = [firstName,firstSurname].filter(Boolean).map(x=>x.charAt(0)).join('').toUpperCase();
  return initials || 'SI';
}
function formatDate_(d) { return Utilities.formatDate(d,'Europe/Madrid','dd/MM/yyyy HH:mm'); }
function digest_(s) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s)).slice(0,48); }
function safe_(v) { const s=String(v || ''); return /^[=+\-@]/.test(s) ? "'"+s : s; }
function html_(v) { return String(v || '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
