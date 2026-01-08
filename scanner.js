/************ CONFIG ************/
const API_URL = "https://script.google.com/macros/s/AKfycbwPB-xnPJvEPYhEVdudA6-goe2DH9kCKv7CTuRmSdK0WPuhYF4xXtR6I0_w-mVhyu6Z/exec";

/************ VARIABLES ************/
let qrReader;
let procesando = false;

/************ UI ************/
function mostrar(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

/************ MENU ************/
function volverMenu() {
  procesando = false;
  detenerCamara();
  mostrar("menu");
}

/************ SCANNER ************/
async function abrirScanner() {
  mostrar("scanner");

  if (!qrReader) {
    qrReader = new Html5Qrcode("reader");
  }

  try {
    await qrReader.start(
      { facingMode: "environment" },
      { fps: 12, qrbox: 260 },
      leerQR
    );
  } catch {
    alert("No se pudo acceder a la cámara");
    volverMenu();
  }
}

function detenerCamara() {
  if (qrReader) {
    qrReader.stop().catch(() => {});
  }
}

/************ LECTURA ************/
function leerQR(text) {
  if (procesando) return;
  procesando = true;

  qrReader.pause();

  fetch(`${API_URL}?id=${encodeURIComponent(text)}`)
    .then(r => r.json())
    .then(data => manejarRespuesta(data, text))
    .catch(() => error("Error de conexión"));
}

/************ RESPUESTAS ************/
function manejarRespuesta(data, qr) {

  if (data.status === "ok" || data.status === "created") {
    mostrarResultado(
      data.nombre,
      data.area,
      data.status === "created" ? "REGISTRADO" : "QR"
    );
    setTimeout(reanudarScanner, 1500);
    return;
  }

  abrirFormulario(qr);
}

/************ RESULTADO ************/
function mostrarResultado(nombre, area, estado) {
  mostrar("resultado");
  document.getElementById("resultado").innerHTML = `
    <div class="ok">
      <h2>${nombre}</h2>
      <p>${area}</p>
      <div class="estado ${estado === "REGISTRADO" ? "registrado" : "qr"}">
        Estado ${estado}
      </div>
    </div>
  `;
}

/************ FORMULARIO ************/
function abrirFormulario(qr = "") {
  mostrar("resultado");
  document.getElementById("resultado").innerHTML = `
    <div class="ok">
      <h2>Nuevo Registro</h2>

      <input id="doc" placeholder="Documento"><br><br>
      <input id="nom" placeholder="Nombre completo"><br><br>
      <input id="area" placeholder="Área de servicio"><br><br>
      <input id="pass" type="password" placeholder="Contraseña"><br><br>

      <button class="btn btn-new" onclick="registrar('${qr}')">Registrar</button>
      <button class="btn btn-cancel" onclick="reanudarScanner()">Cancelar</button>
    </div>
  `;
}

/************ REGISTRAR ************/
function registrar(qr) {
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: qr,
      documento: doc.value,
      nombre: nom.value,
      area: area.value,
      password: pass.value
    })
  })
  .then(r => r.json())
  .then(data => manejarRespuesta(data, qr))
  .catch(() => error("Error al registrar"));
}

/****
