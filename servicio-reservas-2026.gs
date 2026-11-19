/**
 * CEIP Bartolomé Flores: alta, modificación y baja de comida de Navidad 2026.
 * Copiar en Apps Script del colegio, guardar e implementar COMO APLICACIÓN WEB.
 * Ejecutar como: cuenta organizadora. NO volver a ejecutar crearFormularioComidaNavidad.
 * Compartir la URL /exec para conectarla en RESERVAS_BACKEND_URL de index.html.
 * Usa correo de la cuenta que ejecuta el script para avisos a dirección.
 * El nombre del docente, las necesidades alimentarias y los pagos nunca se publican en GitHub.
 */
const RES_SPREADSHEET_ID='1JnCKPdOCrBFpeubBtAdcYznZ733JTrGFZXGRoXI_Mbk';
const RES_ALLOWED_ORIGIN='https://agarmor666.github.io';
const RES_PRICE=46;
function resSafe(s,max) {
  s=String(s||'').trim().slice(0,max||500);
  return /^[=+@\-]/.test(s)?"'"+s:s;
}
function resHash(s){
  const b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s));
  return b.map(n=>('0'+(n&255).toString(16)).slice(-2)).join('');
}
function resSheet(ss,name,headers){
  let sh=ss.getSheetByName(name);
  if(!sh){sh=ss.insertSheet(name);sh.appendRow(headers);sh.setFrozenRows(1);}
  return sh;
}
function resSend(to,subject,body){
  if(to)MailApp.sendEmail({to:to,subject:subject,body:body,name:'Reservas · CEIP Bartolomé Flores'});
}
function doPost(e){
 let ok=false, mensaje='No se ha podido registrar la solicitud.';
 try{
  const p=(e&&e.parameter)||{}, action=String(p.accion||'alta');
  if(p.sitio_web)throw Error('Control de formulario');
  if(!['alta','modificar','baja'].includes(action))throw Error('Acción inválida');
  const nombre=String(p.nombre||'').trim(),correo=String(p.correo||'').trim().toLowerCase();
  if(!nombre||nombre.length>120||!/^\S+@\S+\.\S+$/.test(correo)||correo.length>180)throw Error('Nombre o correo inválido');
  const ss=SpreadsheetApp.openById(RES_SPREADSHEET_ID),control=ss.getSheetByName('Control de pagos');
  if(!control)throw Error('No existe Control de pagos');
  const claves=resSheet(ss,'Claves reservas',['Nombre','Correo','Fila de control','Hash de clave','Fecha alta','Último cambio']);
  const historial=resSheet(ss,'Historial de reservas',['Fecha','Acción','Nombre','Correo','Plato','Pago']);
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(20000))throw Error('Sistema ocupado');
  try{
   const keys=claves.getDataRange().getValues();
   let keyRow=-1;
   for(let i=1;i<keys.length;i++){
     if(String(keys[i][0]).toLowerCase()===nombre.toLowerCase()&&String(keys[i][1]).toLowerCase()===correo){keyRow=i+1;break;}
   }
   const admin=Session.getEffectiveUser().getEmail();
   const asunto='Comida Navidad · '+(action==='alta'?'Nueva inscripción':action==='modificar'?'Inscripción modificada':'Baja solicitada');
   let plato=String(p.observaciones||'').match(/Plato principal: ([^\n]+)/);
   plato=plato?plato[1]:'Sin especificar';
   if(action==='alta'){
     if(keyRow!==-1)throw Error('Ya hay una inscripción para este nombre y correo; usa Modificar');
     if(!['Sí, asistiré','Por ahora no podré asistir'].includes(p.asistencia))throw Error('Asistencia inválida');
     const token=Utilities.getUuid()+'-'+Utilities.getUuid();
     const fila=control.getLastRow()+1;
     control.appendRow([new Date(),resSafe(nombre,120),p.asistencia,p.asistencia==='Sí, asistiré'?'Pendiente':'No procede',p.asistencia==='Sí, asistiré'?RES_PRICE:0,resSafe(p.necesidad,150),resSafe([p.detalle,p.observaciones].filter(Boolean).join(' · '),1100)]);
     claves.appendRow([nombre,correo,fila,resHash(token),new Date(),new Date()]);
     historial.appendRow([new Date(),'Alta',nombre,correo,plato,'Pendiente']);
     resSend(correo,'Clave de tu inscripción · Comida de Navidad','Tu inscripción se ha recibido.\nNombre: '+nombre+'\nClave personal para modificar o cancelar: '+token+'\nGuarda esta clave. No la compartas.\nLa reserva definitiva se comunicará más adelante.');
     resSend(admin,asunto,'Inscripción de: '+nombre+'\nCorreo: '+correo+'\nAsistencia: '+p.asistencia+'\nPlato: '+plato+'\nConsulta las restricciones alimentarias en la hoja privada.');
     mensaje='✅ Inscripción registrada. Revisa tu correo para guardar la clave de modificación o baja.';
   }else{
     if(keyRow===-1)throw Error('No existe una inscripción con esos datos');
     const key=String(p.clave||'').trim();
     if(!key||resHash(key)!==String(keys[keyRow-1][3]))throw Error('Clave de reserva incorrecta');
     const row=Number(keys[keyRow-1][2]),last=control.getLastRow();
     if(!Number.isInteger(row)||row<2||row>last)throw Error('Registro no encontrado');
     let pago=String(control.getRange(row,4).getValue());
     if(action==='baja'){
       control.getRange(row,3).setValue('Baja solicitada');
       if(pago!=='Pagado'){control.getRange(row,4).setValue('No procede');control.getRange(row,5).setValue(0);}
       historial.appendRow([new Date(),'Baja solicitada',nombre,correo,'',pago]);
       resSend(admin,asunto,'Baja solicitada: '+nombre+'\nCorreo: '+correo+'\nEstado del pago: '+pago+'\nRevisa la devolución si ya había pagado.');
       resSend(correo,'Baja solicitada · Comida de Navidad','Hemos registrado tu solicitud de baja. Si ya habías pagado, contacta con la organización para la devolución.');
       mensaje='✅ Baja solicitada y comunicada a la organización.';
     }else{
       if(!['Sí, asistiré','Por ahora no podré asistir'].includes(p.asistencia))throw Error('Asistencia inválida');
       const nuevo=[p.asistencia,resSafe(p.necesidad,150),resSafe([p.detalle,p.observaciones].filter(Boolean).join(' · '),1100)];
       control.getRange(row,3).setValue(nuevo[0]);control.getRange(row,6).setValue(nuevo[1]);control.getRange(row,7).setValue(nuevo[2]);
       if(nuevo[0]!=='Sí, asistiré'&&pago!=='Pagado'){control.getRange(row,4).setValue('No procede');control.getRange(row,5).setValue(0);}
       if(nuevo[0]==='Sí, asistiré'&&pago==='No procede'){control.getRange(row,4).setValue('Pendiente');control.getRange(row,5).setValue(RES_PRICE);}
       historial.appendRow([new Date(),'Modificación',nombre,correo,plato,pago]);
       resSend(admin,asunto,'Inscripción modificada: '+nombre+'\nCorreo: '+correo+'\nAsistencia: '+p.asistencia+'\nPlato: '+plato+'\nConsulta detalles alimentarios en la hoja privada.');
       resSend(correo,'Inscripción modificada · Comida de Navidad','Se ha registrado la modificación de tu inscripción a la comida de Navidad.');
       mensaje='✅ Modificación registrada y comunicada.';
     }
     claves.getRange(keyRow,6).setValue(new Date());
   }
   ok=true;
  }finally{lock.releaseLock();}
 }catch(err){console.error(err);mensaje='No se completó la solicitud. Comprueba el correo y la clave o consulta con dirección.';}
 const data=JSON.stringify({tipo:'reserva-bartolome-flores',ok:ok,mensaje:mensaje}).replace(/</g,'\\u003c');
 const html='<!doctype html><html><body><script>window.parent.postMessage('+data+','+JSON.stringify(RES_ALLOWED_ORIGIN)+');<\\/script></body></html>';
 return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
