window.H={"d":["Lunes","Martes","Miércoles","Jueves","Viernes"],"h":["09:00-09:30","09:30-10:00","10:00-10:30","10:30-11:00","11:00-11:30","11:30-12:00","12:00-12:30","12:30-13:00","13:00-13:30","13:30-14:00"],"g":["1º A","1º B","2º A","2º B","3º A","3º B","4º A","4º B","5º A","5º B","5º C","6º A","6º B","6º C","I 3 A","I 3 B","I 4 A","I 4 B","I 5 A","I 5 B"],"t":["Alconchel Vázquez Carlos","Enjuto Mena Carolina","Fernandez Marcos Donate Raquel","Flores Ortega Juana Pilar","García Arnau Mireia","García Piñero Isabel Mª","Garrido Morales Antonio J.","González Carrillo, Francisco","González Sanz Nuria","Guerrero Piñero Ana Celia","Haro Mansilla Aladina","Jimena Quesada Luis Mª","Jiménez Medina Ana Bella","Jimenez Torres Mª José","Mañas Villar, Lucía","Martínez Guerrero Isabel Mª","Montoya Morales Mª Luisa","Moreno Alonso Antonia","Palomares Padilla Pilar","Pastor Reche, Carmen Dolores","Peña Ruíz Mª Cruz","Ramos Muñoz, Patricia","Rodríguez Agüero, María Isabel","Rodríguez Domínguez, Ana Belén","Rodríguez Montes Jesús","Tafur Porras Ángela","Torres Molina Juan Carlos","Vedia Salinas Cristina","Velázquez Peramos, María de la Cabeza","Yanguez López-Cano Rafael"],"s":["Matemáticas","Lengua Cast. y Literatura","Ctº del Medio Natural, Social y Cultural.","Francés","Atención Educativa / Religión","Biblioteca","Comunicación y Representación de la Realidad.","Coordinación Ciclo","Coordinación Código Escuela 4.0","Coordinación TDE","Crecimiento en Armonía","Descubrimiento y Exploración del Entorno.","Dirección","Educación en Valores Cívicos y Éticos","Educación Física","Educación Plástica y Visual.","Inglés","Jefatura de Estudios","Música y Danza.","Recreo","Reducción Horaria","Secretaría","Servicios Complementarios","Coordinación PCT Mates","Vigilancia recreo - Patio Infantil","Vigilancia recreo - Pista","Vigilancia recreo - Rampa","Vigilancia recreo - Salida Edf. Principal","Vigilancia recreo - Zona Infantil (1er ciclo)"],"a":[]};
(function(){
  const nav=document.querySelector('.nav');
  const main=document.querySelector('main');
  if(!nav||!main)return;

  const asuntos=document.createElement('a');
  asuntos.href='https://agarmor666.github.io/asuntos-propios/';
  asuntos.textContent='📝 Asuntos propios';
  asuntos.style.cssText='display:inline-flex;align-items:center;text-decoration:none;background:#fff;color:#475569;padding:11px 17px;border-radius:12px;font-weight:800;box-shadow:0 2px 6px #0001';
  nav.appendChild(asuntos);

  const apoyo=document.createElement('a');
  apoyo.href='#apoyo-refuerzo';
  apoyo.textContent='🧩 Apoyo y refuerzo';
  apoyo.style.cssText='display:inline-flex;align-items:center;text-decoration:none;background:#fff;color:#475569;padding:11px 17px;border-radius:12px;font-weight:800;box-shadow:0 2px 6px #0001;cursor:pointer';
  nav.appendChild(apoyo);

  const sec=document.createElement('section');
  sec.id='apoyo-refuerzo';
  sec.style.display='none';
  sec.innerHTML=`
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px">
      <div>
        <h2 class="title" style="margin-bottom:6px">🧩 Registro de apoyo y refuerzo 2026/27</h2>
        <p class="hint" style="margin-bottom:0">Registro de las actuaciones de apoyo y refuerzo realizadas con el alumnado.</p>
      </div>
      <a href="https://docs.google.com/forms/d/e/1FAIpQLSeIyNU9O3Kwc-T8AlVTIfcvY3ZDV2C0vN6R1AZNyXevAi_GrQ/viewform?usp=header" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;text-decoration:none;background:linear-gradient(135deg,#0f766e,#14b8a6);color:#fff;padding:11px 15px;border-radius:11px;font-weight:800">↗ Abrir formulario</a>
    </div>
    <div style="padding:14px 16px;border-radius:14px;background:#ecfeff;border:1px solid #a5f3fc;color:#155e75;margin-bottom:16px;font-weight:700">
      El formulario permite registrar grupo, tramo horario, docente de apoyo, fecha, lugar y tipo de sesión, alumnado atendido, actitud, dificultad, contenidos reforzados y observaciones.
    </div>
    <div style="border:1px solid #dbe3ec;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 5px 18px #0001">
      <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSeIyNU9O3Kwc-T8AlVTIfcvY3ZDV2C0vN6R1AZNyXevAi_GrQ/viewform?embedded=true" width="100%" height="1350" frameborder="0" marginheight="0" marginwidth="0" title="Registro de apoyo y refuerzo 2026/27">Cargando…</iframe>
    </div>`;
  main.appendChild(sec);

  function showSupport(){
    document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));
    apoyo.style.color='#fff';
    apoyo.style.background='linear-gradient(135deg,#0f766e,#14b8a6)';
    const viewer=document.getElementById('viewer'),stats=document.getElementById('stats'),recess=document.getElementById('recess');
    if(viewer)viewer.style.display='none';
    if(stats)stats.style.display='none';
    if(recess)recess.style.display='none';
    sec.style.display='block';
  }
  apoyo.addEventListener('click',e=>{e.preventDefault();showSupport();history.replaceState(null,'','#apoyo-refuerzo')});

  document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>{
    sec.style.display='none';
    apoyo.style.color='#475569';
    apoyo.style.background='#fff';
  }));

  if(location.hash==='#apoyo-refuerzo')setTimeout(showSupport,0);
})();