# Activación de inscripciones · Comida de Navidad 2026

## Qué está preparado
- Formulario interno: https://agarmor666.github.io/Horarios-26-27/reservas.html
- Código de Google Apps Script: servicio-reservas-2026.gs (en este repositorio)
- Hoja existente: https://docs.google.com/spreadsheets/d/1JnCKPdOCrBFpeubBtAdcYznZ733JTrGFZXGRoXI_Mbk/edit
- No crear de nuevo la hoja ni el formulario de Google.

## Activación (cuenta propietaria de la hoja)
1. Abrir https://script.google.com/ con la misma cuenta que creó la hoja.
2. Abrir el proyecto existente utilizado para crear las inscripciones, o crear un proyecto vacío.
3. Crear un archivo de secuencia de comandos llamado "ServicioReservas" y pegar TODO el contenido del archivo "servicio-reservas-2026.gs" del repositorio.
4. Guardar. No ejecutar "crearFormularioComidaNavidad" otra vez.
5. Pulsar Implementar > Nueva implementación > Tipo: Aplicación web.
6. "Ejecutar como": Yo (la persona propietaria de la hoja). "Quién tiene acceso": los docentes que necesiten utilizar el formulario; si no tienen cuenta Google autorizada, puede requerirse "Cualquier usuario" (no obliga a introducir email en el formulario). Confirmar permisos solicitados de Sheets y Mail.
7. Pulsar Implementar. Copiar la URL terminada en /exec (NO la URL del editor).
8. Sustituir la constante RESERVAS_BACKEND_URL en index.html y backendUrl en reservas.html por esa URL. Se puede pedir a ChatGPT que lo haga pegándole la URL.
9. Realizar una inscripción de prueba y verificar que aparece una sola fila en "Control de pagos", con Pago = "Pendiente", y que dirección recibe el aviso al correo de la cuenta que ejecuta el servicio.
10. Comprobar que la opción de baja y modificación crea solicitudes en "Solicitudes de cambios", sin eliminar automáticamente la inscripción, y que dirección recibe los avisos.
11. Comprobar el acceso desde un móvil en una sesión distinta antes de difundir el enlace.

## Privacidad y control
- El desplegable basta para apuntarse: no se pide email ni clave al docente.
- Las bajas son solicitudes sujetas a comprobación de dirección, porque seleccionar un nombre NO verifica la identidad del solicitante.
- El pago de 46 € se entrega a Mila y debe ser confirmado manualmente por organización.
- No compartir la hoja privada de pagos ni los datos de alergias con todo el profesorado.
