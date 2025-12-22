const API_URL = "https://script.google.com/macros/s/AKfycbwPB-xnPJvEPYhEVdudA6-goe2DH9kCKv7CTuRmSdK0WPuhYF4xXtR6I0_w-mVhyu6Z/exec";

let qrReader;
let escaneando = false;
let ultimoQR = "";

// 👉 INICIAR ESCANEO
function iniciarScanner() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("reader").classList.remove("hidden");

  if (!qrReader) {
    qrReader = new Html5Qrcode("reader");
  }

  if (escaneando) return;

  escaneando = true;

  qrReader.start(
    { facingMode: "environment" },
    { fps: 15, qrbox: { width: 320, height: 320 } },
    onScanSuccess
  );
}

// 👉 CUANDO SE LEE UN QR
function onScanSuccess(text) {
  if (text === ultimoQR) return;

  ultimoQR = text;
  detenerScanner();

  fetch(`${API_URL}?id=${text}`)
    .then(res => res.json())
    .then(data => manejarRespuesta(data, text));
}

// 👉 DETENER ESCANEO
function detenerScanner() {
  if (qrReader && escaneando) {
    qrReader.stop();
    escaneando = false;
  }
}

// 👉 MOSTRAR RESULTADO
function manejarRespuesta(data, qr) {

  if (data.status === "ok" || data.status === "created") {
    document.getElementById("resultado").innerHTML = `
      <div class="ok">
        <h2>✅ Asistencia registrada</h2>
        <p><strong>${data.nombre}</strong></p>
        <p>${data.area}</p>
      </div>
    `;

    setTimeout(volverMenu, 1800);
  }

  if (data.status === "new") {
    mostrarFormularioManual(qr);
  }

  if (data.status === "denied") {
    alert("❌ Contraseña incorrecta");
    volverMenu();
  }
}

// 👉 FORMULARIO MANUAL
function mostrarFormularioManual(qr = "") {
  detenerScanner();
  document.getElementById("menu").style.display = "none";

  document.getElementById("resultado").innerHTML = `
    <h2>🆕 Nuevo Registro</h2>

    <input id="qr" placeholder="ID QR" value="${qr}" /><br><br>
    <input id="doc" placeholder="Documento" /><br><br>
    <input id="nom" placeholder="Nombre" /><br><br>
    <input id="area" placeholder="Área" /><br><br>
    <input id="pass" type="password" placeholder="Contraseña" /><br><br>

    <button class="btn btn-new" onclick="registrar()">Registrar</button>
  `;
}

// 👉 REGISTRAR
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
  .then(res => res.json())
  .then(data => manejarRespuesta(data, qr.value));
}

// 👉 VOLVER AL MENÚ
function volverMenu() {
  document.getElementById("menu").style.display = "flex";
  document.getElementById("reader").classList.add("hidden");
  document.getElementById("resultado").innerHTML = "";
  ultimoQR = "";
}
