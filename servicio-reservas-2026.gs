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
 * La acción confirmada determina si se marca Pagado o se archiva una baja.
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
 * Un único activador ya instalado: alEditarSolicitudPago.
 *
 * - Si H = Confirmada y B = Entrega de dinero declarada:
 *   D en Control de pagos pasa a Pagado.
 * - Si H = Confirmada y B = Baja por causa sobrevenida:
 *   mueve el registro íntegro a Bajas confirmadas y lo quita
 *   del listado activo de Control de pagos.
 *
 * Al rechazar una solicitud no se modifica el registro.
 * Nunca borra la trazabilidad: la solicitud queda en su hoja
 * y la ficha original se conserva en Bajas confirmadas.
 */
function alEditarSolicitudPago(e) {
  if (!e || !e.range) return;
  const celda=e.range;
  const solicitudes=celda.getSheet();
  if (solicitudes.getName()!=='Solicitudes de cambios' ||
      celda.getColumn()!==8 || celda.getNumColumns()!==1 ||
      celda.getNumRows()!==1 || celda.getRow()<2) return;
  if (String(celda.getValue()).trim()!=='Confirmada') return;

  const bloqueo=LockService.getScriptLock();
  if (!bloqueo.tryLock(15000)) throw Error('No se puede acceder al registro ahora');
  try {
    const filaSolicitud=celda.getRow();
    const solicitud=solicitudes.getRange(filaSolicitud,1,1,8).getValues()[0];
    const accion=String(solicitud[1]||'').trim();
    if (accion!=='Entrega de dinero declarada' &&
        accion!=='Baja por causa sobrevenida') return;

    const nombre=String(solicitud[2]||'').trim();
    const libro=e.source;
    const control=libro.getSheetByName('Control de pagos');
    if (!control || !nombre) throw Error('Datos de solicitud incompletos');
    const last=control.getLastRow();
    const registros=last>1?control.getRange(2,1,last-1,7).getValues():[];
    const posiciones=[];
    const normalizar=v=>String(v||'').trim().toLocaleLowerCase('es');
    registros.forEach((fila,i)=>{
      if(normalizar(fila[1])===normalizar(nombre)) posiciones.push(i+2);
    });
    if(posiciones.length!==1){
      // Nunca eliminar ni pagar a una persona ambiguamente identificada.
      const mensaje='Revisión manual: '+posiciones.length+
        ' inscripciones coincidentes para '+nombre;
      celda.setNote(mensaje);
      throw Error(mensaje);
    }

    const filaControl=posiciones[0];
    const registro=control.getRange(filaControl,1,1,7).getValues()[0];
    if (String(registro[2]).trim()!=='Sí, asistiré'){
      celda.setNote('No se ha realizado el cambio: el asistente no figura como activo.');
      throw Error('Asistencia no activa: '+nombre);
    }

    if(accion==='Entrega de dinero declarada'){
      if(String(registro[3]).trim()!=='Pagado'){
        control.getRange(filaControl,4).setValue('Pagado');
      }
      celda.setNote('Pago confirmado y sincronizado automáticamente con Control de pagos.');
      return;
    }

    // Baja aprobada: no perder la ficha ni el posible dinero entregado.
    const bajas=resLogSheet(libro,'Bajas confirmadas',[
      'Fecha de baja','Fecha de inscripción','Nombre y apellidos',
      'Asistencia al solicitar baja','Pago al solicitar baja',
      'Importe (€)','Necesidad alimentaria','Observaciones del menú',
      'Estado de devolución','Fila solicitud'
    ]);
    const estadoDevolucion=String(registro[3]).trim()==='Pagado'?
      'Revisar devolución de 46 € con Nila':'No procede';
    bajas.appendRow([
      new Date(),...registro,estadoDevolucion,filaSolicitud
    ]);
    // Archivar primero; eliminar solo después de conservar la ficha.
    control.deleteRow(filaControl);
    celda.setNote('Baja confirmada: se ha archivado en Bajas confirmadas.'+
      (estadoDevolucion==='No procede'?'':' Revisar devolución con Nila.'));
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
      aviso=tipo+': '+nombre+'\nEstado actual del pago: '+pagoActual+'\nLa solicitud está pendiente de revisión por dirección.';
      mensaje=accion==='pago'?'✅ Aviso de entrega recibido. Dirección comprobará con Nila el pago de 46 € antes de marcarlo como pagado.':accion==='baja'?'✅ Solicitud de baja enviada. Dirección la revisará antes de anular la reserva.':'✅ Modificación solicitada. Dirección comprobará los cambios.';
    }
    ok=true;
    if(admin){
      try{
        const sujeto='Comida de Navidad · '+(accion==='alta'?'Alta':accion==='baja'?'Baja solicitada':accion==='pago'?'Pago declarado':'Modificación solicitada');
        const instruccion=accion==='pago'
          ? 'Comprueba con Nila los 46 €. Pulsa el botón, abre el desplegable de la columna H y elige Confirmada o Rechazada. Al elegir Confirmada, el activador actualizará Pagado automáticamente en Control de pagos.'
          : accion==='baja'
          ? 'Comprueba la causa sobrevenida. Al elegir Confirmada en la columna H, la inscripción se retirará de Control de pagos y se conservará en Bajas confirmadas. Si ya había pagado, revisa su devolución con Nila. Rechazada no altera la inscripción.'
          : accion==='alta'
          ? 'Consulta la inscripción en la hoja privada. El pago permanecerá Pendiente hasta su comprobación.'
          : 'Revisa el cambio solicitado y resuélvelo desde la hoja privada.';
        const tituloBoton=accion==='pago'?'Confirmar o rechazar pago':
          accion==='baja'?'Revisar solicitud de baja':
          accion==='alta'?'Ver inscripción':'Revisar modificación';
        const escaparHtml=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        MailApp.sendEmail({
          to:admin,subject:sujeto,
          body:aviso+'\\n\\n'+instruccion+'\\n\\nAbrir solicitud: '+urlRevision,
          htmlBody:'<p>'+escaparHtml(aviso).replace(/\\n/g,'<br>')+'</p>'+
            '<p><a href="'+urlRevision+'" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">'+tituloBoton+'</a></p>'+
            '<p>'+escaparHtml(instruccion)+'</p>',
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
