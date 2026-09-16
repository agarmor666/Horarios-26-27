window.H={"d":["Lunes","Martes","Miércoles","Jueves","Viernes"],"h":["09:00-09:30","09:30-10:00","10:00-10:30","10:30-11:00","11:00-11:30","11:30-12:00","12:00-12:30","12:30-13:00","13:00-13:30","13:30-14:00"],"g":["1º A","1º B","2º A","2º B","3º A","3º B","4º A","4º B","5º A","5º B","5º C","6º A","6º B","6º C","I 3 A","I 3 B","I 4 A","I 4 B","I 5 A","I 5 B"],"t":["Alconchel Vázquez Carlos","Enjuto Mena Carolina","Fernandez Marcos Donate Raquel","Flores Ortega Juana Pilar","García Arnau Mireia","García Piñero Isabel Mª","Garrido Morales Antonio J.","González Carrillo, Francisco","González Sanz Nuria","Guerrero Piñero Ana Celia","Haro Mansilla Aladina","Jimena Quesada Luis Mª","Jiménez Medina Ana Bella","Jimenez Torres Mª José","Mañas Villar, Lucía","Martínez Guerrero Isabel Mª","Montoya Morales Mª Luisa","Moreno Alonso Antonia","Palomares Padilla Pilar","Pastor Reche, Carmen Dolores","Peña Ruíz Mª Cruz","Ramos Muñoz, Patricia","Rodríguez Agüero, María Isabel","Rodríguez Domínguez, Ana Belén","Rodríguez Montes Jesús","Tafur Porras Ángela","Torres Molina Juan Carlos","Vedia Salinas Cristina","Velázquez Peramos, María de la Cabeza","Yanguez López-Cano Rafael"],"s":["Matemáticas","Lengua Cast. y Literatura","Ctº del Medio Natural, Social y Cultural.","Francés","Atención Educativa / Religión","Biblioteca","Comunicación y Representación de la Realidad.","Coordinación Ciclo","Coordinación Código Escuela 4.0","Coordinación TDE","Crecimiento en Armonía","Descubrimiento y Exploración del Entorno.","Dirección","Educación en Valores Cívicos y Éticos","Educación Física","Educación Plástica y Visual.","Inglés","Jefatura de Estudios","Música y Danza.","Recreo","Reducción Horaria","Secretaría","Servicios Complementarios","Coordinación PCT Mates","Vigilancia recreo - Patio Infantil","Vigilancia recreo - Pista","Vigilancia recreo - Rampa","Vigilancia recreo - Salida Edf. Principal","Vigilancia recreo - Zona Infantil (1er ciclo)"],"a":[]};
(function(){
  const nav=document.querySelector('.nav');
  const main=document.querySelector('main');
  if(!nav||!main)return;

  const oldLegend=document.querySelector('header .legend');
  if(oldLegend)oldLegend.remove();
  const statsBtn=nav.querySelector('button[data-k="stats"]');
  if(statsBtn)statsBtn.remove();

  const commonLink='display:inline-flex;align-items:center;text-decoration:none;background:#fff;color:#475569;padding:11px 17px;border-radius:12px;font-weight:800;box-shadow:0 2px 6px #0001;cursor:pointer';
  const home=document.createElement('a');
  home.href='#inicio';
  home.textContent='🏠 Inicio';
  home.style.cssText=commonLink;
  nav.insertBefore(home,nav.firstChild);

  const asuntos=document.createElement('a');
  asuntos.href='https://agarmor666.github.io/asuntos-propios/';
  asuntos.textContent='📝 Asuntos propios';
  asuntos.style.cssText=commonLink;
  nav.appendChild(asuntos);

  const apoyo=document.createElement('a');
  apoyo.href='#apoyo-refuerzo';
  apoyo.textContent='🧩 Apoyo y refuerzo';
  apoyo.style.cssText=commonLink;
  nav.appendChild(apoyo);

  const style=document.createElement('style');
  style.textContent=`
    #portal-home .home-hero{position:relative;overflow:hidden;border-radius:20px;min-height:320px;margin-bottom:20px;background:#0f172a;box-shadow:0 12px 30px #0002}
    #portal-home .home-hero img{width:100%;height:340px;object-fit:cover;display:block;opacity:.78}
    #portal-home .home-overlay{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:28px;background:linear-gradient(180deg,transparent 30%,rgba(15,23,42,.88));color:#fff}
    #portal-home .home-overlay h2{font-size:clamp(1.7rem,4vw,2.7rem);margin:0 0 7px}
    #portal-home .home-overlay p{margin:0;font-size:1.05rem;color:#e2e8f0}
    #portal-home .home-tools{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    #portal-home .home-card{border:1px solid #dbe3ec;border-radius:16px;padding:18px;background:linear-gradient(135deg,#fff,#f8fafc);box-shadow:0 5px 18px #0001}
    #portal-home .home-card h3{margin:0 0 8px}.home-card p{margin:0 0 12px;color:#64748b}
    #portal-home select{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:11px;background:#fff;font:inherit;font-weight:700}
    #apoyo-refuerzo .support-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    #apoyo-refuerzo .support-card{background:#fff;border:1px solid #dbe3ec;border-radius:16px;padding:18px;box-shadow:0 5px 18px #0001}
    #apoyo-refuerzo .support-card h3{margin:0 0 14px;color:#334155}
    #apoyo-refuerzo .support-field{margin-bottom:14px}#apoyo-refuerzo .support-field label{display:block;font-weight:900;margin-bottom:6px;color:#334155}
    #apoyo-refuerzo .support-field input,#apoyo-refuerzo .support-field select,#apoyo-refuerzo .support-field textarea{width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:11px;background:#fff;font:inherit}
    #apoyo-refuerzo .support-field textarea{min-height:105px;resize:vertical}.support-tramos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .support-check{display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;font-size:.88rem}.support-check input{width:auto!important}
    .support-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}.support-btn{border:0;border-radius:11px;padding:12px 17px;font-weight:900;cursor:pointer;background:linear-gradient(135deg,#0f766e,#14b8a6);color:#fff;font:inherit}.support-btn.alt{background:linear-gradient(135deg,#475569,#64748b)}
    .support-msg{margin-top:12px;padding:12px 14px;border-radius:11px;display:none;font-weight:800}.support-msg.ok{display:block;background:#dcfce7;border:1px solid #86efac;color:#166534}.support-msg.err{display:block;background:#fee2e2;border:1px solid #fca5a5;color:#991b1b}.support-msg.warn{display:block;background:#fff7ed;border:1px solid #fdba74;color:#9a3412}
    @media(max-width:850px){#portal-home .home-tools,#apoyo-refuerzo .support-grid{grid-template-columns:1fr}.support-tramos{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const homeSec=document.createElement('section');
  homeSec.id='portal-home';
  homeSec.innerHTML=`
    <div class="home-hero">
      <img src="https://static.grupojoly.com/clip/90b9608a-df4a-415b-87ea-3970b67778c0_source-aspect-ratio_1600w_0.jpg" alt="CEIP Bartolomé Flores de Mojácar">
      <div class="home-overlay"><h2>CEIP Bartolomé Flores</h2><p>Portal interno · Curso 2026/27 · Mojácar</p></div>
    </div>
    <div class="home-tools">
      <div class="home-card"><h3>👥 Consultar horario por grupo</h3><p>Selecciona un grupo para abrir directamente su horario.</p><select id="homeGroup"><option value="">Seleccionar grupo…</option>${H.g.map((g,i)=>`<option value="${i}">${g}</option>`).join('')}</select></div>
      <div class="home-card"><h3>👨‍🏫 Consultar horario por profesor/a</h3><p>Selecciona un docente para abrir directamente su horario.</p><select id="homeTeacher"><option value="">Seleccionar profesor/a…</option>${H.t.map((t,i)=>`<option value="${i}">${t}</option>`).join('')}</select></div>
    </div>`;
  main.insertBefore(homeSec,main.firstChild);

  const docentes=['Alconchel Vázquez, Carlos','Del Caño Ceballos, María','Enjuto Mena, Carolina','Fernández Marcos Donate, Raquel','Flores Ortega, Juana del Pilar','García Arnau, Mireia','García Piñero, Isabel María','Garrido Morales, Antonio Jesús','González Carrillo, Francisco','González Sanz, Nuria','Haro Mansilla, Aladina','Jimena Quesada, Luis María','Jiménez Medina, Ana Bella','Jiménez Torres, María Jose','Mañas Villar, Lucía','Martínez Guerrero, Isabel María','Montoya Morales, María Luisa','Moreno Alonso, Antonia','Palomares Padilla, Pilar','Pastor Reche, Carmen Dolores','Peña Ruiz, María Cruz','Ramos Muñoz, Patricia','Rodríguez Agüero, María Isabel','Rodríguez Domínguez, Ana Belén','Rodríguez Montes, Jesús','Roldán Camenforte, Leónides','Tafur Porras, Ángela María','Teruel Ortiz, Carlos','Torres Molina, Juan Carlos','Vedia Salinas, Carmen Cristín','Velázquez Peramos, María de la Cabeza','Yanguez López-Cano, Rafael'];
  const tramos=['1er tramo - 9:00 a 9:30','2º tramo - 9:30 a 10:00','3º tramo - 10:00 a 10:30','4º tramo - 10:30 a 11:00','5º tramo - 11:00 a 11:30','6º tramo - 11:30 a 12:00','7º tramo - 12:00 a 12:30','8º tramo - 12:30 a 13:00','9º tramo - 13:00 a 13:30','10º tramo - 13:30 a 14:00'];
  const SUPPORT_API='https://script.google.com/macros/s/AKfycbxrYGXIpAdwn-6LjN8Ka9dp9tiNP9_UgFuMw8ZBeuS5C7-hGyqpvsAOdPj7L5Rxzfc6/exec';
  const sec=document.createElement('section');sec.id='apoyo-refuerzo';sec.style.display='none';
  sec.innerHTML=`<h2 class="title">🧩 Registro de apoyo y refuerzo · Curso 2026/27</h2><p class="hint">Registro interno del CEIP Bartolomé Flores.</p><div class="support-grid"><div class="support-card"><h3>1. Datos de la sesión</h3><div class="support-field"><label>Grupo</label><select id="supGrupo"><option value="">Seleccionar grupo…</option>${H.g.map(g=>`<option>${g}</option>`).join('')}</select></div><div class="support-field"><label>Maestra/o de apoyo</label><select id="supDocente"><option value="">Seleccionar docente…</option>${docentes.map(d=>`<option>${d}</option>`).join('')}</select></div><div class="support-field"><label for="supArea">Área / ámbito</label><input id="supArea" list="supAreas" placeholder="Seleccionar o escribir área…"><datalist id="supAreas"><option value="Lengua Castellana y Literatura"><option value="Matemáticas"><option value="Conocimiento del Medio"><option value="Inglés"><option value="Francés"><option value="Educación Física"><option value="Educación Artística"><option value="Religión / Atención Educativa"><option value="Comunicación y Representación de la Realidad"><option value="Crecimiento en Armonía"><option value="Descubrimiento y Exploración del Entorno"><option value="Otro ámbito"></datalist></div><div class="support-field"><label>Fecha</label><input type="date" id="supFecha" min="2026-09-10" max="2027-06-22"></div><div class="support-field"><label>Sesión / tramo horario</label><div class="support-tramos">${tramos.map(t=>`<label class="support-check"><input type="checkbox" name="supTramo" value="${t}"> ${t}</label>`).join('')}</div></div></div><div class="support-card"><h3>2. Organización del apoyo</h3><div class="support-field"><label>Lugar de la sesión</label><select id="supLugar"><option value="">Seleccionar…</option><option>Dentro del aula</option><option>Fuera del aula</option></select></div><div class="support-field"><label>Tipo de sesión</label><select id="supTipo"><option value="">Seleccionar…</option><option>Individual</option><option>Pequeño grupo</option><option>Gran grupo</option></select></div><div class="support-field"><label>Alumna/o/s que lo recibe</label><input id="supAlumnado"></div><div class="support-field"><label>Actitud durante la sesión</label><select id="supActitud"><option value="">Seleccionar…</option><option>Se esfuerza y consigue los objetivos</option><option>Se esfuerza y NO consigue los objetivos</option><option>No se esfuerza. Es poco colaborador</option></select></div><div class="support-field"><label>Dificultad encontrada</label><select id="supDificultad"><option value="">Seleccionar…</option><option>Baja</option><option>Media</option><option>Alta</option></select></div></div><div class="support-card" style="grid-column:1/-1"><h3>3. Intervención realizada</h3><div class="support-field"><label>Actividad / contenidos reforzados</label><textarea id="supContenido"></textarea></div><div class="support-field"><label>Observaciones</label><textarea id="supObs"></textarea></div><div class="support-actions"><button class="support-btn" id="supGuardar">💾 Guardar registro</button><button class="support-btn alt" id="supLimpiar" type="button">↺ Limpiar</button></div><div id="supMsg" class="support-msg"></div></div></div>`;
  main.appendChild(sec);

  function allHide(){['viewer','stats','recess','portal-home','apoyo-refuerzo'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none'})}
  function resetNav(){document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));[home,apoyo].forEach(a=>{a.style.color='#475569';a.style.background='#fff'})}
  function showHome(){allHide();resetNav();homeSec.style.display='block';home.style.color='#fff';home.style.background='linear-gradient(135deg,#2563eb,#7c3aed)';history.replaceState(null,'','#inicio')}
  function showSupport(){allHide();resetNav();sec.style.display='block';apoyo.style.color='#fff';apoyo.style.background='linear-gradient(135deg,#2563eb,#7c3aed)';history.replaceState(null,'','#apoyo-refuerzo')}
  home.addEventListener('click',e=>{e.preventDefault();showHome()});apoyo.addEventListener('click',e=>{e.preventDefault();showSupport()});

  function blankDropdown(kind){setTimeout(()=>{const sel=document.getElementById('entity'),title=document.getElementById('title'),tbl=document.getElementById('tbl');if(!sel)return;const label=kind==='groups'?'Seleccionar grupo…':'Seleccionar profesor/a…';const o=document.createElement('option');o.value='-1';o.textContent=label;sel.insertBefore(o,sel.firstChild);sel.value='-1';if(title)title.textContent='';if(tbl)tbl.innerHTML='';},0)}
  document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>{homeSec.style.display='none';sec.style.display='none';home.style.color='#475569';home.style.background='#fff';apoyo.style.color='#475569';apoyo.style.background='#fff';if(b.dataset.k==='groups'||b.dataset.k==='teachers')blankDropdown(b.dataset.k)}));

  function openEntity(kind,idx){const btn=nav.querySelector(`button[data-k="${kind}"]`);if(!btn)return;btn.click();setTimeout(()=>{const sel=document.getElementById('entity');if(!sel)return;sel.value=String(idx);if(window.render)window.render(idx);},20)}
  document.getElementById('homeGroup').addEventListener('change',e=>{if(e.target.value!=='')openEntity('groups',+e.target.value)});
  document.getElementById('homeTeacher').addEventListener('change',e=>{if(e.target.value!=='')openEntity('teachers',+e.target.value)});

  function val(id){return(document.getElementById(id)?.value||'').trim()}function clearForm(){['supGrupo','supDocente','supArea','supFecha','supLugar','supTipo','supAlumnado','supActitud','supDificultad','supContenido','supObs'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});document.querySelectorAll('input[name="supTramo"]').forEach(x=>x.checked=false);const m=document.getElementById('supMsg');m.className='support-msg';m.textContent=''}function msg(text,type){const m=document.getElementById('supMsg');m.textContent=text;m.className='support-msg '+type}
  async function saveSupport(){const sesiones=[...document.querySelectorAll('input[name="supTramo"]:checked')].map(x=>x.value);const data={action:'support-set',curso:'26-27',grupo:val('supGrupo'),sesion:sesiones.join(', '),docente:val('supDocente'),area:val('supArea'),fecha:val('supFecha'),lugar:val('supLugar'),tipo:val('supTipo'),alumnado:val('supAlumnado'),actitud:val('supActitud'),dificultad:val('supDificultad'),contenido:val('supContenido'),observaciones:val('supObs')};if(!data.grupo||!data.docente||!data.area||!data.fecha||!data.sesion||!data.lugar||!data.tipo||!data.dificultad||!data.contenido){msg('Completa los campos obligatorios.','err');return}const btn=document.getElementById('supGuardar');btn.disabled=true;msg('Guardando registro…','warn');try{const r=await fetch(SUPPORT_API,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)});const j=await r.json();if(!j.success)throw new Error(j.error||'No se ha podido guardar');msg('Registro guardado correctamente en CURSO 26-27.','ok');setTimeout(clearForm,1600)}catch(e){msg('No se ha podido guardar el registro.','err')}finally{btn.disabled=false}}
  document.getElementById('supGuardar').addEventListener('click',saveSupport);document.getElementById('supLimpiar').addEventListener('click',clearForm);
  setTimeout(()=>{if(location.hash==='#apoyo-refuerzo')showSupport();else showHome()},0);
})();