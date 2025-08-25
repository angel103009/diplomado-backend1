const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// === Configuración de Multer para guardar archivos ===
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// === Ruta para subir archivos y mandar correo ===
app.post("/upload", upload.single("archivo"), async (req, res) => {
  const { actividad } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "No se envió ningún archivo" });
  }

  try {
    // Configurar transporte con Gmail
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "Mariana.gomez.tw@gmail.com", // tu correo de pruebas
        pass: "Pamela98"                    // tu contraseña de pruebas
      }
    });

    // Enviar correo al admin (puedes usar el mismo correo para recibirlo)
    await transporter.sendMail({
      from: `"Diplomado" <Mariana.gomez.tw@gmail.com>`,
      to: "Mariana.gomez.tw@gmail.com", // aquí pon el correo destino
      subject: `Nueva entrega - Actividad ${actividad}`,
      text: `Un estudiante subió un archivo para la actividad ${actividad}.
Archivo: ${req.file.filename}`
    });

    res.json({ message: "✅ Archivo recibido y correo enviado" });
  } catch (error) {
    console.error("Error enviando correo:", error);
    res.status(500).json({ message: "❌ Error al enviar correo" });
  }
});

// === Ruta para listar archivos ===
app.get("/list", (req, res) => {
  try {
    const archivos = fs.readdirSync(uploadDir).map(name => ({
      name,
      url: `/uploads/${name}`
    }));
    res.json({ archivos });
  } catch (err) {
    res.status(500).json({ message: "Error al listar archivos" });
  }
});

// === Servir archivos subidos ===
app.use("/uploads", express.static(uploadDir));

// === Puerto dinámico (Render) o 3000 en local ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));

