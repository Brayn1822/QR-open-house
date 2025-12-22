/************************************
 CONFIG
*************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbwPB-xnPJvEPYhEVdudA6-goe2DH9kCKv7CTuRmSdK0WPuhYF4xXtR6I0_w-mVhyu6Z/exec";

/************************************
 VARIABLES
*************************************/
let qrReader = null;
let ultimoQR = "";

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
  ultimoQR = "";

  if (qrReader) {
    qrReader.stop().catch(() => {});
  }

  mostrar("pantalla-menu");
}

/************************************
 SCANNER
*************************************/
function abrirScanner() {
  mostrar("pantalla-scanner");

  // Espera a que el DOM esté visible
  setTimeout(() => {

    if (qrReader) {
      qrReader.stop().catch(() => {});
      qrReader.clear();
    }

    qrReader = new Html5Qrcode("reader");

    qrReader.start(
      { facingMode: "environment" },
      { fps: 15, qrbox: 250 },
      onScanSuccess,
      () => {}
    );

  }, 300);
}

function onScanSuccess(text) {
  if (text === ultimoQR) return;
  ultimoQR = text;

  qrReader.stop().catch(() => {});

  fetch(`${API_URL}?id=${encodeURIComponent(text)}`)
    .then(r => r.json())
    .then(data => procesarRespuesta(data, text))
    .catch(() => {
      mostrarMensaje("❌ Error de conexión");
      setTimeout(volverMenu, 2000);
    });
}

/************************************
 RESPUESTAS
*************************************/
function procesarRespuesta(data, qr) {

  // REGISTRADO
  if (data.status === "ok" || data.status === "created") {
    mostrarMensaje(`
      <div class="ok">
        <h2>✅ Asistencia registrada</h2>
        <p><strong>${data.nombre}</strong></p>
        <p>${data.area}</p>
      </div>
    `);

    setTimeout(volverMenu, 2000);
    return;
  }

  // NO EXISTE
  abrirFormulario(qr);
}

/************************************
 MENSAJES
*************************************/
function mostrarMensaje(html) {
  mostrar("pantalla-resultado");
  document.getElementById("pantalla-resultado").innerHTML = html;
}

/************************************
 FORMULARIO
*************************************/
function abrirFormulario(qr = "") {
  mostrar("pantalla-resultado");

  document.getElementById("pantalla-resultado").innerHTML = `
    <div style="width:100%;max-width:420px">

      <h2>🆕 Nuevo Registro</h2>

      <input id="qr" value="${qr}" placeholder="ID QR"><br><br>
      <input id="doc" placeholder="Documento"><br><br>
      <input id="nom" placeholder="Nombre completo"><br><br>
      <input id="area" placeholder="Área de servicio"><br><br>
      <input id="pass" type="password" placeholder="Contraseña"><br><br>

      <button class="btn btn-new" onclick="registrar()">Registrar</button>
      <button class="btn btn-cancel" onclick="volverMenu()">Cancelar</button>

    </div>
  `;
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
      password: pass.value
    })
  })
  .then(r => r.json())
  .then(data => procesarRespuesta(data, qr.value))
  .catch(() => {
    mostrarMensaje("❌ Error al registrar");
    setTimeout(volverMenu, 2000);
  });
}
