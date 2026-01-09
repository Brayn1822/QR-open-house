const API_URL = "https://script.google.com/macros/s/AKfycbyfRpZbaJ5zmvDNp8x-Im5gaqJkECJ4xfWchVRA471Csb1mTy3xrDYwJvXinullOXbD/exec";

let qrReader = null;
let processing = false;

/************************************
 * UTIL
 ************************************/
function generarIdRegistro() {
  return "R-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/************************************
 * PANTALLAS
 ************************************/
function mostrar(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

function volverMenu() {
  processing = false;
  if (qrReader) qrReader.pause(true);
  mostrar("pantalla-menu");
}

/************************************
 * SCANNER
 ************************************/
function abrirScanner() {
  mostrar("pantalla-scanner");

  if (!qrReader) {
    qrReader = new Html5Qrcode("reader");
    qrReader.start(
      { facingMode: "environment" },
      { fps: 15, qrbox: 250 },
      onScanSuccess
    );
  } else {
    qrReader.resume();
  }
}

/************************************
 * LECTURA QR
 ************************************/
function onScanSuccess(text) {
  if (processing) return;
  processing = true;

  qrReader.pause(true);

  let id = text;

  if (text.startsWith("http")) {
    try {
      const url = new URL(text);
      id = url.searchParams.get("qr") || url.searchParams.get("id");
    } catch (e) {}
  }

  if (!id) {
  mostrarError("❌ QR inválido");
  processing = false;
  qrReader.resume();
  return;
}


  fetch(`${API_URL}?id=${encodeURIComponent(id)}`)
    .then(r => r.json())
    .then(d => procesarRespuesta(d, id))
    .catch(() => mostrarError("❌ Error de conexión"));
}

/************************************
 * RESPUESTA
 ************************************/
function procesarRespuesta(data) {

  // ✅ Asistencia normal
  if (data.status === "ok") {
    mostrarMensajeConfirmacion(
      "✅ Asistencia registrada",
      data.nombre,
      data.area,
      true
    );
    return;
  }

  // 🆕 Registro creado manual
  if (data.status === "created") {
    mostrarMensajeConfirmacion(
      "🆕 Registro creado",
      data.nombre,
      data.area,
      false
    );
    return;
  }

  // 🧍 Persona nueva → formulario
  if (data.status === "new") {
    abrirFormulario();
    return;
  }

  mostrarError("❌ Respuesta desconocida");
}

function mostrarMensajeConfirmacion(titulo, nombre, area, volverScanner) {
  mostrar("pantalla-resultado");

  document.getElementById("pantalla-resultado").innerHTML = `
    <div class="ok">
      <h2>${titulo}</h2>
      <strong>${nombre}</strong>
      <p>${area}</p>
      <button class="btn btn-new" onclick="${volverScanner ? "volverScanner()" : "volverMenu()"}">
        OK
      </button>
    </div>
  `;
}

function mostrarDuplicado(data) {
  mostrar("pantalla-resultado");

  document.getElementById("pantalla-resultado").innerHTML = `
    <div class="ok">
      <h2>⚠️ Registro duplicado</h2>
      <strong>${data.nombre}</strong>
      <p>${data.area}</p>

      <div style="margin-top:15px">
        <button class="btn btn-new" onclick="volverScanner()">OK</button>
        <button class="btn btn-cancel" onclick="volverMenu()">Cancelar</button>
      </div>
    </div>
  `;
}

function volverScanner() {
  processing = false;
  mostrar("pantalla-scanner");
  if (qrReader) qrReader.resume();
}



/************************************
 * FORMULARIO
 ************************************/
function abrirFormulario() {
  const idAuto = generarIdRegistro();

  mostrar("pantalla-resultado");
  document.getElementById("pantalla-resultado").innerHTML = `
    <div class="form-metal">
      <h2>🆕 Nuevo Registro</h2>

      <input id="id" value="${idAuto}" readonly>
      <input id="doc" placeholder="Documento">
      <input id="nom" placeholder="Nombre completo">

      <select id="area">
        <option value="">Área de servicio</option>
        <option>ACADEMIA</option>
        <option>ALABANZA</option>
        <option>CONÉCTATE</option>
        <option>DANZA</option>
        <option>GRUPOS DE CRECIMIENTO</option>
        <option>INTERCESIÓN Y RESTAURACIÓN</option>
        <option>MKIDS</option>
        <option>ON FIRE</option>
        <option>PAREJAS</option>
        <option>PRODUCCIÓN</option>
        <option>WARRIORS</option>
      </select>

      <input id="pass" type="password" placeholder="Contraseña">

      <button class="btn btn-new" onclick="registrar()">Registrar</button>
      <button class="btn btn-cancel" onclick="volverMenu()">Cancelar</button>
    </div>
  `;
}

/************************************
 * REGISTRAR
 ************************************/
function registrar() {
  const id = document.getElementById("id").value;
  const documento = document.getElementById("doc").value.trim();
  const nombre = document.getElementById("nom").value.trim();
  const area = document.getElementById("area").value;
  const password = document.getElementById("pass").value;

  if (!documento || !nombre || !area || !password) {
    mostrarError("⚠️ Completa todos los campos");
    return;
  }

  const params = new URLSearchParams({
    action: "register",
    id,
    documento,
    nombre,
    area,
    password
  });

  fetch(`${API_URL}?${params.toString()}`)
    .then(r => r.json())
    .then(data => {
      if (data.status === "created") {
        procesarRespuesta(data);
        return;
      }
      if (data.status === "duplicated") {
        mostrarMensaje(`
          <div class="ok">
            <h2>⚠️ Registro duplicado</h2>
            <p><strong>${data.nombre}</strong></p>
            <p>${data.area}</p>
            <p>ID réplica: ${data.id}</p>
          </div>
        `);
        return;
      }
      if (data.status === "denied") {
        mostrarError("❌ Contraseña incorrecta");
        return;
      }
      mostrarError("❌ No se pudo registrar");
    })
    .catch(() => mostrarError("❌ Error de conexión"));
}

/************************************
 * UI
 ************************************/
function mostrarMensaje(html) {
  mostrar("pantalla-resultado");
  document.getElementById("pantalla-resultado").innerHTML = html;
}

function mostrarError(msg) {
  mostrarMensaje(`
    <div class="ok">
      <h2>${msg}</h2>
      <button class="btn btn-cancel" onclick="volverMenu()">Volver</button>
    </div>
  `);
}
