const API_URL = "https://script.google.com/macros/s/AKfycbwPB-xnPJvEPYhEVdudA6-goe2DH9kCKv7CTuRmSdK0WPuhYF4xXtR6I0_w-mVhyu6Z/exec";

let qrReader;
let ultimoQR = "";

// 👉 ABRIR SCANNER
function abrirScanner() {
  document.getElementById("pantalla-menu").classList.add("hidden");
  document.getElementById("pantalla-resultado").classList.add("hidden");
  document.getElementById("pantalla-scanner").classList.remove("hidden");

  if (!qrReader) {
    qrReader = new Html5Qrcode("reader");
  }

  qrReader.start(
    { facingMode: "environment" },
    { fps: 15, qrbox: 300 },
    onScanSuccess
  );
}

// 👉 CUANDO LEE QR
function onScanSuccess(text) {
  if (text === ultimoQR) return;
  ultimoQR = text;

  qrReader.stop();

  fetch(`${API_URL}?id=${text}`)
    .then(r => r.json())
    .then(data => mostrarResultado(data, text));
}

// 👉 MOSTRAR RESULTADO
function mostrarResultado(data, qr) {
  document.getElementById("pantalla-scanner").classList.add("hidden");
  document.getElementById("pantalla-resultado").classList.remove("hidden");

  if (data.status === "ok" || data.status === "created") {
    document.getElementById("pantalla-resultado").innerHTML = `
      <div class="ok">
        <h2>✅ Asistencia registrada</h2>
        <p><strong>${data.nombre}</strong></p>
        <p>${data.area}</p>
      </div>
    `;
    setTimeout(volverMenu, 2000);
  }

  if (data.status === "new") {
    abrirFormulario(qr);
  }
}

// 👉 FORMULARIO MANUAL
function abrirFormulario(qr = "") {
  document.getElementById("pantalla-menu").classList.add("hidden");
  document.getElementById("pantalla-scanner").classList.add("hidden");
  document.getElementById("pantalla-resultado").classList.remove("hidden");

 document.getElementById("pantalla-resultado").innerHTML = `
  <div style="width:100%; max-width:400px; margin:auto;">
    <h2>🆕 Nuevo Registro</h2>
    <input id="qr" placeholder="ID QR" value="${qr}" style="width:100%;height:45px"><br><br>
    <input id="doc" placeholder="Documento" style="width:100%;height:45px"><br><br>
    <input id="nom" placeholder="Nombre" style="width:100%;height:45px"><br><br>
    <input id="area" placeholder="Área" style="width:100%;height:45px"><br><br>
    <input id="pass" type="password" placeholder="Contraseña" style="width:100%;height:45px"><br><br>
    <button class="btn btn-new" onclick="registrar()">Registrar</button><br><br>
    <button class="btn btn-cancel" onclick="volverMenu()">Cancelar</button>
  </div>
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
  .then(r => r.json())
  .then(data => mostrarResultado(data, qr.value));
}

// 👉 VOLVER AL MENU
function volverMenu() {
  ultimoQR = "";
  document.getElementById("pantalla-menu").classList.remove("hidden");
  document.getElementById("pantalla-scanner").classList.add("hidden");
  document.getElementById("pantalla-resultado").classList.add("hidden");
}
