const API_URL = "https://script.google.com/macros/s/AKfycbxM9U_yy_TQQHID2DvKFetwcfJ5vBbgYGme7wF4_-wRGfaaT-ZxebO7lX0iPd6Sldic/exec";

let qrReader = null;
let processing = false;

/* --------- CONTROL DE PANTALLAS ---------- */
function mostrar(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

function volverMenu() {
  processing = false;
  if (qrReader) qrReader.pause(true);
  mostrar("pantalla-menu");
}

/* --------- SCANNER ---------- */
function abrirScanner() {
  mostrar("pantalla-scanner");

  setTimeout(async () => {
    if (!qrReader) {
      qrReader = new Html5Qrcode("reader");
      try {
        await qrReader.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: 250 },
          onScanSuccess
        );
      } catch {
        alert("No se pudo acceder a la cámara");
        volverMenu();
      }
    } else {
      qrReader.resume();
    }
  }, 200);
}

function onScanSuccess(text) {
  if (processing) return;
  processing = true;
  qrReader.pause(true);

  fetch(`${API_URL}?id=${encodeURIComponent(text)}`)
    .then(r => r.json())
    .then(data => procesarRespuesta(data, text))
    .catch(() => mostrarError("❌ Error de conexión"));
}

/* --------- RESPUESTAS ---------- */
function procesarRespuesta(data, qr) {
  if (data.status === "ok" || data.status === "created") {
    mostrarMensaje(`
      <div class="ok">
        <h2>✅ Asistencia registrada</h2>
        <p><strong>${data.nombre}</strong></p>
        <p>${data.area}</p>
        <p class="estado">${data.status === "ok" ? "Estado: QR" : "Estado: REGISTRADO"}</p>
      </div>
    `);

    setTimeout(() => {
      processing = false;
      qrReader.resume();
      mostrar("pantalla-scanner");
    }, 1200);
    return;
  }

  abrirFormulario(qr);
}

/* --------- MENSAJES ---------- */
function mostrarMensaje(html) {
  mostrar("pantalla-resultado");
  document.getElementById("pantalla-resultado").innerHTML = html;
}

function mostrarError(msg) {
  mostrarMensaje(`
    <div class="ok">
      <h2>${msg}</h2>
      <button class="btn btn-cancel" onclick="salirError()">Volver</button>
    </div>
  `);
}

function salirError() {
  processing = false;
  if (qrReader) qrReader.resume();
  mostrar("pantalla-scanner");
}

/* --------- FORMULARIO ---------- */
function abrirFormulario(qr = "") {
  mostrar("pantalla-resultado");

  document.getElementById("pantalla-resultado").innerHTML = `
    <div class="form">
      <h2>🆕 Nuevo Registro</h2>

      <input id="qr" value="${qr}" placeholder="ID QR" readonly>
      <input id="doc" placeholder="Documento">
      <input id="nom" placeholder="Nombre completo">
      <input id="area" placeholder="Área de servicio">
      <input id="pass" type="password" placeholder="Contraseña">

      <button class="btn btn-new" onclick="registrar()">Registrar</button>
      <button class="btn btn-cancel" onclick="cancelarRegistro()">Cancelar</button>
    </div>
  `;
}

function cancelarRegistro() {
  processing = false;
  if (qrReader) qrReader.resume();
  mostrar("pantalla-scanner");
}

/* --------- REGISTRAR ---------- */
function registrar() {
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: qr.value,
      documento: doc.value,
      nombre: nom.value,
      area: area.value,
      password: pass.value
    })
  })
  .then(r => r.json())
  .then(data => {
    processing = false;
    qrReader.resume();
    procesarRespuesta(data, qr.value);
  })
  .catch(() => mostrarError("❌ Error al registrar"));
}
