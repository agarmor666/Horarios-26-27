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
const RES_CONTROL_GID='0';
const RES_SOLICITUDES_GID='589909757';
// Opcional: escribe aquí el correo de dirección para recibir avisos.
// Dejar vacío no bloquea ninguna inscripción.
const RES_ADMIN_EMAIL='antoniogarrido@bartolomeflores.com';

/** Ejecutar una vez desde el editor para autorizar MailApp y comprobar avisos. */
function autorizarNotificaciones(){
  MailApp.sendEmail({to:RES_ADMIN_EMAIL,subject:'Prueba de avisos · Comida de Navidad',body:'Los avisos de las inscripciones, entregas a Nila y bajas se enviarán a esta cuenta.'});
}

function resText(v,max){
  let s=String(v||'').trim().slice(0,max||500);
  return /^[=+@\-]/.test(s)?"'"+s:s;
}
function resLogSheet(book,name,headers){
  let sh=book.getSheetByName(name);
  if(!sh){sh=book.insertSheet(name);sh.appendRow(headers);sh.setFrozenRows(1)}
  return sh;
}
/**
 * Ejecutar UNA SOLA VEZ desde Apps Script y autorizar:
 * Instala el activador que observa las confirmaciones de dirección
 * en la hoja "Solicitudes de cambios", columna H.
 * No ejecuta automáticamente ninguna baja ni acepta pagos declarados.
 */
function instalarAutomatizacionPagos() {
  const idFuncion='alEditarSolicitudPago';
  const existentes=ScriptApp.getProjectTriggers().filter(
    t=>t.getHandlerFunction()===idFuncion
  );
  if (!existentes.length) {
    ScriptApp.newTrigger(idFuncion)
      .forSpreadsheet(RES_SPREADSHEET_ID)
      .onEdit()
      .create();
  }
  Logger.log('Activador de confirmación de pagos preparado. Total: '+
    (existentes.length||1));
}

/**
 * Al seleccionar "Confirmada" en H de "Solicitudes de cambios",
 * solo si la acción en B es "Entrega de dinero declarada",
 * busca una única inscripción por nombre y marca Pagado en
 * Control de pagos (columna D). No modifica otras solicitudes.
 */
function alEditarSolicitudPago(e) {
  if (!e || !e.range) return;
  const editada=e.range;
  const hoja=editada.getSheet();
  if (hoja.getName()!=='Solicitudes de cambios' ||
      editada.getColumn()!==8 || editada.getNumColumns()!==1 ||
      editada.getNumRows()!==1 || editada.getRow()<2) return;
  if (String(editada.getValue()).trim()!=='Confirmada') return;

  const bloqueo=LockService.getScriptLock();
  if (!bloqueo.tryLock(15000)) throw Error('No se pudo bloquear el control de pagos');
  try {
    const fila=editada.getRow();
    const datos=hoja.getRange(fila,1,1,8).getValues()[0];
    const accion=String(datos[1]||'').trim();
    if (accion!=='Entrega de dinero declarada') return;

    const nombre=String(datos[2]||'').trim();
    if (!nombre) throw Error('Solicitud sin nombre (fila '+fila+')');
    const libro=e.source;
    const control=libro.getSheetByName('Control de pagos');
    if (!control) throw Error('No existe Control de pagos');
    const filas=control.getLastRow();
    const nombres=filas>1?
      control.getRange(2,2,filas-1,1).getValues():[];
    const coinciden=[];
    nombres.forEach((arr,i)=>{
      if (String(arr[0]||'').trim().toLocaleLowerCase('es')===
          nombre.toLocaleLowerCase('es')) coinciden.push(i+2);
    });
    if (coinciden.length!==1) {
      const error='No se pudo actualizar el pago: '+coinciden.length+
        ' inscripciones coincidentes. Revisar manualmente.';
      editada.setNote(error);
      throw Error(error+' Nombre: '+nombre);
    }
    const row=coinciden[0];
    const asistencia=String(control.getRange(row,3).getValue()).trim();
    if (asistencia!=='Sí, asistiré') {
      editada.setNote('No se ha actualizado el pago: asistencia no activa.');
      throw Error('La asistencia no está activa para '+nombre);
    }
    const pago=control.getRange(row,4);
    if (String(pago.getValue())!=='Pagado') pago.setValue('Pagado');
    editada.setNote('Pago confirmado y sincronizado con Control de pagos, fila '+row+'.');
  } finally {
    bloqueo.releaseLock();
  }
}

function doPost(e){
 let ok=false,mensaje='No se pudo completar la solicitud.';
 try{
  const p=e&&e.parameter||{};
  if(p.sitio_web)throw Error('Solicitud inválida');
  const accion=String(p.accion||'alta');
  const nombre=String(p.nombre||'').trim();
  if(!['alta','modificar','baja','pago'].includes(accion))throw Error('Acción incorrecta');
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
    const detalle=resText(p.detalle,500);
    const necesidad=detalle?(alternativa?'Adaptación solicitada':'Restricción alimentaria indicada'):(alternativa?'Adaptación pendiente de concretar':'Ninguna');
    const observaciones='';
    const entrega=String(p.pagoDeclarado||'')==='Entregado, pendiente de comprobar'?'Entregado, pendiente de comprobar':'Pendiente';
    const admin=RES_ADMIN_EMAIL.trim();
    let aviso='';
    let urlRevision='https://docs.google.com/spreadsheets/d/'+RES_SPREADSHEET_ID+'/edit#gid='+RES_CONTROL_GID;
    let urlRevisionPago='';
    if(accion==='alta'){
      if(coinciden.length)throw Error('Ya existe una inscripción con este nombre; consulta a dirección para corregirla');
      if(p.asistencia!=='Sí, asistiré')throw Error('Solo se admiten altas de asistentes');
      if(!plato)throw Error('Selecciona el plato');
      // La nota alimentaria es opcional incluso si se solicita una alternativa.
      control.appendRow([new Date(),resText(nombre,120),'Sí, asistiré',entrega,RES_PRICE,necesidad,resText(['Plato principal: '+plato,detalle,observaciones].filter(Boolean).join(' · '),1100)]);
      historial.appendRow([new Date(),'Alta',resText(nombre,120),resText(plato,150),entrega]);
      urlRevision+='&range=D'+control.getLastRow();
      aviso='Nueva inscripción: '+nombre+'\nPlato: '+plato+'\nPago declarado: '+entrega+'\nVerifica el cobro con Nila. Restricciones alimentarias en la hoja privada.';
      mensaje='✅ Inscripción registrada. El pago seguirá pendiente de comprobación por la organización.';
    }else{
      // Solo se solicita; nadie puede dar de baja a otro compañero conociendo su nombre.
      // Dirección confirma manualmente cambios, pagos y posibles devoluciones.
      if(coinciden.length!==1)throw Error('No se ha localizado una inscripción única para este nombre');
      if(accion==='modificar'&&!plato)throw Error('Selecciona el plato a modificar');
      const tipo=accion==='baja'?'Baja por causa sobrevenida':accion==='pago'?'Entrega de dinero declarada':'Modificación';
      const pagoActual=String(datos[coinciden[0]-1][3]||'');
      if(accion==='pago' && pagoActual==='Pagado')throw Error('El pago ya consta confirmado');
      if(accion==='pago' && p.pagoDeclarado!=='Entregado, pendiente de comprobar')throw Error('Debes indicar que has entregado el dinero');
      solicitudes.appendRow([new Date(),tipo,resText(nombre,120),resText(plato,150),necesidad,resText([p.detalleBaja,detalle,observaciones].filter(Boolean).join(' · '),1100),entrega,'Pendiente de comprobar']);
      historial.appendRow([new Date(),tipo,resText(nombre,120),resText(plato,150),entrega]);
      urlRevision='https://docs.google.com/spreadsheets/d/'+RES_SPREADSHEET_ID+'/edit#gid='+RES_SOLICITUDES_GID+'&range=H'+solicitudes.getLastRow();
      if(accion==='pago')urlRevisionPago='https://docs.google.com/spreadsheets/d/'+RES_SPREADSHEET_ID+'/edit#gid='+RES_CONTROL_GID+'&range=D'+coinciden[0];
      aviso=tipo+': '+nombre+'\nEstado actual del pago: '+pagoActual+'\nRevisar la pestaña Solicitudes de cambios.\nConfirmar el cobro con Nila y marcar Pagado SOLO en Control de pagos.\nPara una baja, revisar la situación y marcarla manualmente en Control de pagos; no borrar la fila.\nNo se ha alterado automáticamente la inscripción.';
      mensaje=accion==='pago'?'✅ Aviso de entrega recibido. Dirección comprobará con Nila el pago de 46 € antes de marcarlo como pagado.':accion==='baja'?'✅ Solicitud de baja enviada. Dirección la revisará antes de anular la reserva.':'✅ Modificación solicitada. Dirección comprobará los cambios.';
    }
    ok=true;
    if(admin){
      try{
        const sujeto='Comida de Navidad · '+(accion==='alta'?'Alta':accion==='baja'?'Baja solicitada':accion==='pago'?'Pago declarado':'Modificación solicitada');
        const instruccion=accion==='pago'
          ? 'Comprueba la entrega con Nila. Después abre la hoja y marca Confirmada o Rechazada en la solicitud. Si está confirmado, marca Pagado en Control de pagos.'
          : accion==='baja'
          ? 'Comprueba la baja sobrevenida y marca Confirmada o Rechazada en Solicitudes de cambios. Modifica manualmente la asistencia en Control de pagos.'
          : accion==='alta'
          ? 'Revisa la inscripción; el importe permanece Pendiente hasta comprobar con Nila el pago.'
          : 'Comprueba el cambio solicitado y valida o rechaza la solicitud antes de modificar la inscripción.';
        MailApp.sendEmail({
          to:admin,subject:sujeto,
          body:aviso+'\\n\\nPARA REVISAR ESTA SOLICITUD:\\n'+urlRevision+'\\n\\n'+instruccion,
          htmlBody:'<p>'+aviso.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\n/g,'<br>')+'</p>'+
            '<p><a href="'+urlRevision+'" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Revisar y resolver solicitud en la hoja privada</a></p>'+
            (urlRevisionPago?'<p><a href="'+urlRevisionPago+'" style="display:inline-block;background:#15803d;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Abrir casilla Pagado de este compañero</a></p>':'')+
            '<p>'+instruccion+'</p>',
          name:'Reservas Bartolomé Flores'
        });
      }catch(mailErr){console.error('Aviso email no enviado: '+mailErr)}
    }
  }finally{lock.releaseLock()}
 }catch(err){console.error(err);mensaje='No se ha completado. Si ya estás inscrito o necesitas corregir algo, consulta con dirección.'}
 // El mensaje directo desde Apps Script puede quedar atrapado en
 // un iframe de Google. Redirigimos el marco a una página del mismo
 // origen que el portal para recibir una confirmación verificable.
 const pagina='https://agarmor666.github.io/Horarios-26-27/respuesta-reservas.html?estado='+(ok?'ok':'error');
 const html='<!doctype html><html><head><meta http-equiv="refresh" content="1;url='+pagina+'"></head><body><script>window.location.replace('+JSON.stringify(pagina)+');</scr'+'ipt><p>Procesando respuesta...</p></body></html>';
 return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
