/************************************
 CONFIG
*************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbwPB-xnPJvEPYhEVdudA6-goe2DH9kCKv7CTuRmSdK0WPuhYF4xXtR6I0_w-mVhyu6Z/exec";

/************************************
 VARIABLES
*************************************/
let qrReader = null;
let processing = false;

/************************************
 UTILIDAD PANTALLAS
*************************************/
function mostrar(id) {
  document.querySelectorAll(".pantalla").forEach(p =>
    p.classList.remove("activa")
  );
  document.getElementById(id).classList.add("activa");
}

/************************************
 MENU
*************************************/
function volverMenu() {
  processing = false;
  if (qrReader) qrReader.pause(true);
  mostrar("pantalla-menu");
}

/************************************
 SCANNER
*************************************/
function abrirScanner() {
  mostrar("pantalla-scanner");

  setTimeout(async () => {
    try {
      if (!qrReader) {
        qrReader = new Html5Qrcode("reader");
        await qrReader.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: 250 },
          onScanSuccess
        );
      } else {
        qrReader.resume();
      }
    } catch (e) {
      alert("No se pudo acceder a la cámara");
      volverMenu();
    }
  }, 300);
}

/************************************
 QR LEIDO
*************************************/
function onScanSuccess(text) {
  if (processing) return;
  processing = true;

  qrReader.pause(true);

  fetch(`${API_URL}?id=${encodeURIComponent(text)}`)
    .then(r => r.json())
    .then(data => procesarRespuesta(data, text))
    .catch(() => mostrarError("❌ Error de conexión"));
}

/************************************
 RESPUESTA BACKEND
*************************************/
function procesarRespuesta(data, qr) {

  // YA EXISTE
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

  // NO EXISTE → REGISTRO
  abrirFormulario(qr);
}

/************************************
 MENSAJES
*************************************/
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
  qrReader.resume();
  mostrar("pantalla-scanner");
}

/************************************
 FORMULARIO QR NO EXISTE
*************************************/
function abrirFormulario(qr) {
  mostrar("pantalla-resultado");

  document.getElementById("pantalla-resultado").innerHTML = `
    <div style="width:100%;max-width:420px">

      <h2>🆕 Nuevo Registro</h2>

      <input type="hidden" id="qr" value="${qr}">

      <input id="doc" placeholder="Documento"><br><br>
      <input id="nom" placeholder="Nombre completo"><br><br>
      <input id="area" placeholder="Área de servicio"><br><br>

      <select id="estado" style="width:100%;height:45px">
        <option value="Activo">Activo</option>
        <option value="Inactivo">Inactivo</option>
      </select><br><br>

      <input id="pass" type="password" placeholder="Contraseña"><br><br>

      <button class="btn btn-new" onclick="registrar()">Registrar</button>
      <button class="btn btn-cancel" onclick="cancelarRegistro()">Cancelar</button>

    </div>
  `;
}

/************************************
 REGISTRO MANUAL (SIN QR)
*************************************/
function abrirFormularioManual() {
  abrirFormulario("MANUAL_" + Date.now());
}

/************************************
 CANCELAR
*************************************/
function cancelarRegistro() {
  processing = false;
  qrReader.resume();
  mostrar("pantalla-scanner");
}

/************************************
 REGISTRAR
*************************************/
function registrar() {
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: qr.value,
      documento: doc.value,
      nombre: nom.value,
      area: area.value,
      estado: estado.value,
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
