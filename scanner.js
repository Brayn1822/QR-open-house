const API_URL = "https://script.google.com/macros/s/AKfycbwPB-xnPJvEPYhEVdudA6-goe2DH9kCKv7CTuRmSdK0WPuhYF4xXtR6I0_w-mVhyu6Z/exec";
let html5Qr;
let ultimoQR = "";
let escaneando = false;

// 👉 BOTÓN: INICIAR SCANNER
function iniciarScanner() {
  document.getElementById("reader").classList.remove("oculto");
  document.getElementById("resultado").innerHTML = "";

  if (!html5Qr) {
    html5Qr = new Html5Qrcode("reader");
  }

  if (escaneando) return;

  escaneando = true;

  html5Qr.start(
    { facingMode: "environment" },
    { fps: 15, qrbox: { width: 350, height: 350 } },
    onScanSuccess
  );
}

// 👉 CUANDO LEE EL QR
function onScanSuccess(text) {
  if (text === ultimoQR) return; // evita doble lectura

  ultimoQR = text;
  detenerScanner();

  fetch(`${API_URL}?id=${text}`)
    .then(r => r.json())
    .then(data => manejarRespuesta(data, text));
}

// 👉 DETENER SCANNER
function detenerScanner() {
  if (html5Qr && escaneando) {
    html5Qr.stop();
    escaneando = false;
  }
}

// 👉 MANEJO DE RESPUESTA
function manejarRespuesta(data, qr) {

  if (data.status === "ok" || data.status === "created") {
    document.getElementById("resultado").innerHTML = `
      <div class="ok">
        <h2>✅ Asistencia registrada</h2>
        <p><strong>Nombre:</strong> ${data.nombre}</p>
        <p><strong>Área:</strong> ${data.area}</p>
      </div>
    `;

    // 🔁 vuelve a escanear automáticamente
    setTimeout(iniciarScanner, 1500);
  }

  if (data.status === "new") {
    mostrarFormularioManual(qr);
  }

  if (data.status === "denied") {
    alert("❌ Contraseña incorrecta");
  }
}

// 👉 FORMULARIO MANUAL
function mostrarFormularioManual(qr = "") {
  detenerScanner();

  document.getElementById("resultado").innerHTML = `
    <h3>🆕 Registrar nuevo usuario</h3>

    <input id="qr" placeholder="ID QR" value="${qr}" /><br>
    <input id="doc" placeholder="Documento" /><br>
    <input id="nom" placeholder="Nombre" /><br>
    <input id="area" placeholder="Área de servicio" /><br>
    <input id="pass" type="password" placeholder="Contraseña" /><br><br>

    <button onclick="registrar()">Registrar</button>
  `;
}

// 👉 REGISTRAR PERSONA
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
  .then(data => manejarRespuesta(data, qr.value));
}
