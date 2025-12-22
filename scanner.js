const API_URL = "https://script.google.com/macros/s/AKfycbwPB-xnPJvEPYhEVdudA6-goe2DH9kCKv7CTuRmSdK0WPuhYF4xXtR6I0_w-mVhyu6Z/exec";
let lastQR = "";

function onScanSuccess(decodedText) {
  lastQR = decodedText;
  fetch(`${API_URL}?id=${decodedText}`)
    .then(r => r.json())
    .then(data => manejarRespuesta(data));
}

function manejarRespuesta(data) {

  if (data.status === "ok" || data.status === "created") {
    document.getElementById("resultado").innerHTML = `
      <div class="ok">
        <h2>✅ Asistencia registrada</h2>
        <p><strong>Nombre:</strong> ${data.nombre}</p>
        <p><strong>Área:</strong> ${data.area}</p>
      </div>
    `;
  }

  if (data.status === "new") {
    mostrarFormularioManual();
  }

  if (data.status === "denied") {
    alert("❌ Contraseña incorrecta");
  }
}

// 👉 FORMULARIO MANUAL
function mostrarFormularioManual() {
  document.getElementById("resultado").innerHTML = `
    <h3>🆕 Registrar nuevo usuario</h3>

    <input id="qr" placeholder="ID QR (ej: QR1501)" /><br>
    <input id="doc" placeholder="Documento" /><br>
    <input id="nom" placeholder="Nombre" /><br>
    <input id="area" placeholder="Área de servicio" /><br>
    <input id="pass" type="password" placeholder="Contraseña" /><br><br>

    <button onclick="registrar()">Registrar</button>
  `;
}

// 👉 ENVÍO AL BACKEND
function registrar() {
  const idQR = document.getElementById("qr").value || lastQR;

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      id: idQR,
      documento: doc.value,
      nombre: nom.value,
      area: area.value,
      password: pass.value
    })
  })
  .then(r => r.json())
  .then(data => manejarRespuesta(data));
}

// 👉 INICIAR LECTOR QR
new Html5Qrcode("reader").start(
  { facingMode: "environment" },
  { fps: 10, qrbox: 250 },
  onScanSuccess
);
