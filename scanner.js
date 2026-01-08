/************************************
 * CONFIG
 ************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbw76d4z57pYvr4lnUROTwQOQYWPnhxz6GoQ1A5XOFQrfDelqDmYzOE-7WdX9Ox8MtVb/exec";

let qrReader = null;
let processing = false;

/************************************
 * PANTALLAS
 ************************************/
function mostrar(id) {
  document.querySelectorAll(".pantalla").forEach(p =>
    p.classList.remove("activa")
  );
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
 * LECTURA QR (CLAVE)
 ************************************/
function onScanSuccess(text) {
  if (processing) return;
  processing = true;

  qrReader.pause(true);

  let id = text;

  // 🔥 aceptar URL con ?qr o ?id
  if (text.startsWith("http")) {
    try {
      const url = new URL(text);
      id = url.searchParams.get("qr") || url.searchParams.get("id");
    } catch (e) {}
  }

  if (!id) {
    mostrarError("❌ QR inválido");
    return;
  }

  fetch(`${API_URL}?id=${encodeURIComponent(id)}`)
    .then(r => r.json())
    .then(data => procesarRespuesta(data, id))
    .catch(() => mostrarError("❌ Error de conexión"));
}

/************************************
 * RESPUESTA
 ************************************/
function procesarRespuesta(data, id) {
  if (data.status === "ok" || data.status === "created") {
    mostrarMensaje(`
      <div class="ok">
        <h2>✅ Asistencia registrada</h2>
        <p><strong>${data.nombre}</strong></p>
        <p>${data.area}</p>
      </div>
    `);

    setTimeout(() => {
      processing = false;
      qrReader.resume();
      mostrar("pantalla-scanner");
    }, 1200);
    return;
  }

  abrirFormulario(id);
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

/************************************
 * FORM
 ************************************/
function abrirFormulario(id = "") {
  mostrar("pantalla-resultado");
  document.getElementById("pantalla-resultado").innerHTML = `
    <div>
      <h2>🆕 Nuevo Registro</h2>
      <input id="qr" value="${id}" placeholder="ID"><br><br>
      <input id="doc" placeholder="Documento"><br><br>
      <input id="nom" placeholder="Nombre"><br><br>
      <input id="area" placeholder="Área"><br><br>
      <input id="pass" type="password" placeholder="Contraseña"><br><br>
      <button class="btn btn-new" onclick="registrar()">Registrar</button>
      <button class="btn btn-cancel" onclick="volverMenu()">Cancelar</button>
    </div>
  `;
}

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
    .then(d => procesarRespuesta(d, qr.value))
    .catch(() => mostrarError("❌ Error al registrar"));
}
