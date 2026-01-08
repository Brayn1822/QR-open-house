/************************************
 CONFIG
*************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbwPB-xnPJvEPYhEVdudA6-goe2DH9kCKv7CTuRmSdK0WPuhYF4xXtR6I0_w-mVhyu6Z/exec";

/************************************
 VARIABLES
*************************************/
let qrReader = null;
let cameraRunning = false;
let processing = false;

/************************************
 CAMBIO DE PANTALLA
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

  if (qrReader && cameraRunning) {
    qrReader.stop().catch(()=>{});
    cameraRunning = false;
  }

  mostrar("pantalla-menu");
}

/************************************
 SCANNER
*************************************/
async function abrirScanner() {
  mostrar("pantalla-scanner");

  if (!qrReader) {
    qrReader = new Html5Qrcode("reader");
  }

  try {
    await qrReader.start(
      { facingMode: "environment" },
      { fps: 15, qrbox: { width: 250, height: 250 } },
      onScanSuccess
    );
    cameraRunning = true;
  } catch (e) {
    alert("No se pudo acceder a la cámara");
    volverMenu();
  }
}

/************************************
 LECTURA QR
*************************************/
function onScanSuccess(text) {
  if (processing) return;
  processing = true;

  qrReader.pause(true);

  fetch(`${API_URL}?id=${encodeURIComponent(text)}`)
    .then(r => r.json())
    .then(data => procesarRespuesta(data, text))
    .catch(() => mostrarError("Error de conexión"));
}

/************************************
 RESPUESTA API
*************************************/
function procesarRespuesta(data, qr) {

  // EXISTE O RECIÉN REGISTRADO
  if (data.status === "ok" || data.status === "created") {
    mostrarResultado(
      data.nombre,
      data.area,
      data.status === "created" ? "REGISTRADO" : "QR"
    );

    setTimeout(reanudarScanner, 1400);
    return;
  }

  // NO EXISTE
  abrirFormulario(qr);
}

/************************************
 RESULTADO
*************************************/
function mostrarResultado(nombre, area, estado) {
  mostrar("pantalla-resultado");

  document.getElementById("pantalla-resultado").innerHTML = `
    <div class="ok">
      <h2>${nombre}</h2>
      <p>${area}</p>
      <div class="estado ${estado === "REGISTRADO" ? "registrado" : "qr"}">
        Estado ${estado}
      </div>
    </div>
  `;
}

/************************************
 ERRORES
*************************************/
function mostrarError(msg) {
  mostrar("pantalla-resultado");

  document.getElementById("pantalla-resultado").innerHTML = `
    <div class="ok">
      <h2>❌ ${msg}</h2>
      <button class="btn btn-cancel" onclick="reanudarScanner()">Volver</button>
    </div>
  `;
}

/************************************
 FORMULARIO REGISTRO
*************************************/
function abrirFormulario(qr = "") {
  mostrar("pantalla-resultado");

  document.getElementById("pantalla-resultado").innerHTML = `
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

/************************************
 REGISTRAR
*************************************/
function registrar(qr) {
  fetch(API_URL, {
    method: "POST",
    hea
