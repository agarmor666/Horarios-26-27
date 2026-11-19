/**
 * CEIP Bartolomé Flores · comida de Navidad 2026.
 * Inscripción solo con nombre; solicitudes de cambio y baja a validar por dirección.
 * Publicar como aplicación web, ejecutar como propietario, y enlazar su URL /exec
 * en RESERVAS_BACKEND_URL del portal. No ejecutar otra vez crearFormularioComidaNavidad.
 * No publicar este fichero con credenciales personales.
 */
const RES_SPREADSHEET_ID='1JnCKPdOCrBFpeubBtAdcYznZ733JTrGFZXGRoXI_Mbk';
const RES_ALLOWED_ORIGIN='https://agarmor666.github.io';
const RES_PRICE=46;
function resText(v,max){
  let s=String(v||'').trim().slice(0,max||500);
  return /^[=+@\-]/.test(s)?"'"+s:s;
}
function resLogSheet(book,name,headers){
  let sh=book.getSheetByName(name);
  if(!sh){sh=book.insertSheet(name);sh.appendRow(headers);sh.setFrozenRows(1)}
  return sh;
}
function doPost(e){
 let ok=false,mensaje='No se pudo completar la solicitud.';
 try{
  const p=e&&e.parameter||{};
  if(p.sitio_web)throw Error('Solicitud inválida');
  const accion=String(p.accion||'alta');
  const nombre=String(p.nombre||'').trim();
  if(!['alta','modificar','baja'].includes(accion))throw Error('Acción incorrecta');
  if(!nombre||nombre.length>120)throw Error('Nombre obligatorio');
  const book=SpreadsheetApp.openById(RES_SPREADSHEET_ID);
  const control=book.getSheetByName('Control de pagos');
  if(!control)throw Error('No existe Control de pagos');
  const solicitudes=resLogSheet(book,'Solicitudes de cambios',['Fecha','Acción','Nombre','Plato solicitado','Necesidad','Detalle','Pago declarado','Estado']);
  const historial=resLogSheet(book,'Historial de reservas',['Fecha','Acción','Nombre','Plato','Pago declarado']);
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw Error('Inténtalo otra vez');
  try{
    const datos=control.getDataRange().getValues();
    const coinciden=[];
    for(let i=1;i<datos.length;i++){
      if(String(datos[i][1]||'').trim().toLowerCase()===nombre.toLowerCase())coinciden.push(i+1);
    }
    const plato=String(p.plato||'').trim().slice(0,150);
    const alternativa=plato==='Necesito una alternativa';
    const necesidad=alternativa?resText(p.necesidad,150):'Ninguna';
    const detalle=alternativa?resText(p.detalle,500):'';
    const observaciones=alternativa?resText(p.observaciones,500):'';
    const entrega=String(p.pagoDeclarado||'')==='Entregado, pendiente de comprobar'?'Entregado, pendiente de comprobar':'Pendiente';
    const admin=Session.getEffectiveUser().getEmail();
    let aviso='';
    if(accion==='alta'){
      if(coinciden.length)throw Error('Ya existe una inscripción con este nombre; consulta a dirección para corregirla');
      if(p.asistencia!=='Sí, asistiré')throw Error('Solo se admiten altas de asistentes');
      if(!plato)throw Error('Selecciona el plato');
      if(alternativa&&(!necesidad||!detalle))throw Error('Detalla la alternativa');
      control.appendRow([new Date(),resText(nombre,120),'Sí, asistiré',entrega,RES_PRICE,necesidad,resText(['Plato principal: '+plato,detalle,observaciones].filter(Boolean).join(' · '),1100)]);
      historial.appendRow([new Date(),'Alta',resText(nombre,120),resText(plato,150),entrega]);
      aviso='Nueva inscripción: '+nombre+'\nPlato: '+plato+'\nPago declarado: '+entrega+'\nVerifica el cobro con Mila. Restricciones alimentarias en la hoja privada.';
      mensaje='✅ Inscripción registrada. El pago seguirá pendiente de comprobación por la organización.';
    }else{
      // Solo se solicita; nadie puede dar de baja a otro compañero conociendo su nombre.
      // Dirección confirma manualmente cambios, pagos y posibles devoluciones.
      if(coinciden.length!==1)throw Error('No se ha localizado una inscripción única para este nombre');
      if(accion==='modificar'&&!plato)throw Error('Selecciona el plato a modificar');
      solicitudes.appendRow([new Date(),accion==='baja'?'Baja por causa sobrevenida':'Modificación',resText(nombre,120),resText(plato,150),necesidad,resText([detalle,observaciones].filter(Boolean).join(' · '),1100),entrega,'Pendiente de comprobar']);
      historial.appendRow([new Date(),accion==='baja'?'Baja solicitada':'Cambio solicitado',resText(nombre,120),resText(plato,150),entrega]);
      aviso=(accion==='baja'?'Solicitud de baja por causa sobrevenida':'Solicitud de modificación')+': '+nombre+'\nRevisar pestaña Solicitudes de cambios. No se ha alterado la inscripción ni el pago.';
      mensaje=accion==='baja'?'✅ Solicitud de baja enviada. Dirección verificará la causa sobrevenida y confirmará la baja.':'✅ Solicitud de modificación enviada. Dirección comprobará los cambios.';
    }
    ok=true;
    if(admin){try{MailApp.sendEmail({to:admin,subject:'Comida de Navidad · '+(accion==='alta'?'Alta':accion==='baja'?'Baja solicitada':'Modificación solicitada'),body:aviso,name:'Reservas Bartolomé Flores'})}catch(mailErr){console.error('Aviso email no enviado: '+mailErr)}}
  }finally{lock.releaseLock()}
 }catch(err){console.error(err);mensaje='No se ha completado. Si ya estás inscrito o necesitas corregir algo, consulta con dirección.'}
 const payload=JSON.stringify({tipo:'reserva-bartolome-flores',ok:ok,mensaje:mensaje}).replace(/</g,'\\u003c');
 const html='<!doctype html><html><body><script>window.parent.postMessage('+payload+','+JSON.stringify(RES_ALLOWED_ORIGIN)+');</scr'+'ipt></body></html>';
 return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
