const API_URL = "https://script.google.com/macros/s/AKfycbwko_4M4IDtgohh2KdgnJIts9w0Y0XSAG1yHeYwZMr6AyGtW2k9e16XkuBrCwZg3n2H/exec";

let qrReader = null;
let processing = false;

/************************************
 * UTIL
 ************************************/
function generarIdRegistro() {
  return "R-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/************************************
 * PANTALLAS
 ************************************/
function mostrar(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

function volverMenu() {
  processing = false;
  if (qrReader) qrReader.pause(true);
  mostrar("pantalla-menu");
}

/************************************
 * SCANNER
 ************************************/
function abrirScanner() {
  mostrar("pantalla-scanner");

  if (!qrReader) {
    qrReader = new Html5Qrcode("reader");
    qrReader.start(
      { facingMode: "environment" },
      { fps: 15, qrbox: 250 },
      onScanSuccess
    );
  } else {
    qrReader.resume();
  }
}

/************************************
 * LECTURA QR
 ************************************/
function onScanSuccess(text) {
  if (processing) return;
  processing = true;

  qrReader.pause(true);

  let id = text;

  if (text.startsWith("http")) {
    try {
      const url = new URL(text);
      id = url.searchParams.get("qr") || url.searchParams.get("id");
    } catch {}
  }

  if (!id) {
    mostrarError("❌ QR inválido");
    return;
  }

  fetch(`${API_URL}?id=${encodeURIComponent(id)}`)
    .then(r => r.json())
    .then(d => procesarRespuesta(d, id))
    .catch(() => mostrarError("❌ Error de conexión"));
}

/************************************
 * RESPUESTA
 ************************************/
function procesarRespuesta(data, id) {
  if (data.status === "ok" || data.status === "created") {
    mostrarMensaje(`
      <div class="ok">
        <h2>✅ Asistencia registrada</h2>
        <strong>${data.nombre}</strong>
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

  abrirFormulario();
}

/************************************
 * FORMULARIO
 ************************************/
function abrirFormulario() {
  const idAuto = generarIdRegistro();

  mostrar("pantalla-resultado");
  document.getElementById("pantalla-resultado").innerHTML = `
    <div class="form-metal">
      <h2>🆕 Nuevo Registro</h2>

      <input id="id" value="${idAuto}" readonly>
      <input id="doc" placeholder="Documento">
      <input id="nom" placeholder="Nombre completo">

      <select id="area">
        <option value="">Área de servicio</option>
        <option>ACADEMIA</option>
        <option>ALABANZA</option>
        <option>CONÉCTATE</option>
        <option>DANZA</option>
        <option>GRUPOS DE CRECIMIENTO</option>
        <option>INTERCESIÓN Y RESTAURACIÓN</option>
        <option>MKIDS</option>
        <option>ON FIRE</option>
        <option>PAREJAS</option>
        <option>PRODUCCIÓN</option>
        <option>WARRIORS</option>
      </select>

      <input id="pass" type="password" placeholder="Contraseña">

      <button class="btn btn-new" onclick="registrar()">Registrar</button>
      <button class="btn btn-cancel" onclick="volverMenu()">Cancelar</button>
    </div>
  `;
}

/************************************
 * REGISTRAR
 ************************************/
function registrar() {
  const payload = {
    id: document.getElementById("id").value,
    documento: document.getElementById("doc").value,
    nombre: document.getElementById("nom").value,
    area: document.getElementById("area").value,
    password: document.getElementById("pass").value
  };

  if (!payload.nombre || !payload.area || !payload.password) {
    mostrarError("❌ Completa todos los campos");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(r => r.text())
    .then(txt => {
      let data;
      try {
        data = JSON.parse(txt);
      } catch {
        throw "Respuesta inválida del servidor";
      }

      if (data.status === "denied") {
        mostrarError("❌ Contraseña incorrecta");
        return;
      }

      if (data.status === "error") {
        mostrarError("❌ " + data.msg);
        return;
      }

      procesarRespuesta(data, payload.id);
    })
    .catch(err => mostrarError("❌ " + err));
}


/************************************
 * UI
 ************************************/
function mostrarMensaje(html) {
  mostrar("pantalla-resultado");
  document.getElementById("pantalla-resultado").innerHTML = html;
}

function mostrarError(msg) {
  mostrarMensaje(`
    <div class="ok">
      <h2>${msg}</h2>
      <button class="btn btn-cancel" onclick="volverMenu()">Volver</button>
    </div>
  `);
}
