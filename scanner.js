const API_URL = "PEGA_AQUI_URL_DEL_WEB_APP";

function onScanSuccess(decodedText) {
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
    document.getElementById("resultado").innerHTML = `
      <h3>🆕 Registrar persona</h3>
      <input id="doc" placeholder="Documento"><br>
      <input id="nom" placeholder="Nombre"><br>
      <input id="area" placeholder="Área"><br>
      <input id="pass" placeholder="Contraseña" type="password"><br>
      <button onclick="registrar()">Registrar</button>
    `;
  }

  if (data.status === "denied") {
    alert("❌ Contraseña incorrecta");
  }
}

function registrar() {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      id: lastQR,
      documento: doc.value,
      nombre: nom.value,
      area: area.value,
      password: pass.value
    })
  })
  .then(r => r.json())
  .then(data => manejarRespuesta(data));
}

let lastQR = "";
new Html5Qrcode("reader").start(
  { facingMode: "environment" },
  { fps: 10, qrbox: 250 },
  text => {
    lastQR = text;
    onScanSuccess(text);
  }
);
