const API_URL = "https://script.google.com/macros/s/AKfycbwPB-xnPJvEPYhEVdudA6-goe2DH9kCKv7CTuRmSdK0WPuhYF4xXtR6I0_w-mVhyu6Z/exec";
let qrReader;
let ultimoQR = "";

/* UTILIDAD */
function mostrar(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

/* MENU */
function volverMenu() {
  ultimoQR = "";
  if (qrReader) qrReader.stop().catch(() => {});
  mostrar("pantalla-menu");
}

/* SCANNER */
function abrirScanner() {
  mostrar("pantalla-scanner");

  if (!qrReader) {
    qrReader = new Html5Qrcode("reader");
  }

  qrReader.start(
    { facingMode: "environment" },
    { fps: 15, qrbox: 250 },
    onScanSuccess
  );
}

function onScanSuccess(text) {
  if (text === ultimoQR) return;
  ultimoQR = text;

  qrReader.stop();

  fetch(`${API_URL}?id=${text}`)
    .then(r => r.json())
    .then(data => mostrarResultado(data, text));
}

/* RESULTADO */
function mostrarResultado(data, qr) {
  mostrar("pantalla-resultado");

  if (data.status === "ok" || data.status === "created") {
    pantallaResultado(`
      <div class="ok">
        <h2>✅ Asistencia registrada</h2>
        <p><strong>${data.nombre}</strong></p>
        <p>${data.area}</p>
      </div>
    `);
    setTimeout(volverMenu, 2000);
  } else {
    abrirFormulario(qr);
  }
}

function pantallaResultado(html) {
  document.getElementById("pantalla-resultado").innerHTML = html;
}

/* FORMULARIO */
function abrirFormulario(qr = "") {
  mostrar("pantalla-resultado");

  pantallaResultado(`
    <div style="width:100%;max-width:400px">
      <h2>🆕 Nuevo Registro</h2>
      <input id="qr" value="${qr}" placeholder="ID QR" style="width:100%;height:45px"><br><br>
      <input id="doc" placeholder="Documento" style="width:100%;height:45px"><br><br>
      <input id="nom" placeholder="Nombre" style="width:100%;height:45px"><br><br>
      <input id="area" placeholder="Área" style="width:100%;height:45px"><br><br>
      <input id="pass" type="password" placeholder="Contraseña" style="width:100%;height:45px"><br><br>

      <button class="btn btn-new" onclick="registrar()">Registrar</button>
      <button class="btn btn-cancel" onclick="volverMenu()">Cancelar</button>
    </div>
  `);
}

/* REGISTRAR */
function registrar() {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      id: qr.value,
      documento: doc.value,
      nombre: nom.value,
      area: area.value,
      password: pass.value
    })
  })
  .then(r => r.json())
  .then(data => mostrarResultado(data, qr.value));
}
