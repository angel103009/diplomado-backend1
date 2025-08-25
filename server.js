const express = require("express");
const multer = require("multer");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");

const app = express();
const PORT = process.env.PORT || 3000;

// === CONFIGURAR SENDGRID ===
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// === MULTER EN MEMORIA ===
const storage = multer.memoryStorage();
const upload = multer({ storage });

// === MIDDLEWARES ===
app.use(cors());
app.use(express.json());

// === ENDPOINT DE PRUEBA ===
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Servidor funcionando con SendGrid" });
});

// === SUBIR Y ENVIAR ARCHIVO POR CORREO ===
app.post("/upload", upload.single("archivo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "❌ No se envió archivo" });
  }

  try {
    const msg = {
      to: ["Mariana.gomez.tw@gmail.com", "Marigoco09@gmail.com"], // destinatarios
      from: process.env.SENDGRID_FROM, // remitente verificado en SendGrid
      subject: "📂 Nuevo archivo recibido",
      text: `Se ha recibido un archivo: ${req.file.originalname}`,
      attachments: [
        {
          content: req.file.buffer.toString("base64"),
          filename: req.file.originalname,
          type: req.file.mimetype,
          disposition: "attachment"
        }
      ]
    };

    await sgMail.send(msg);
    console.log(`📧 Archivo ${req.file.originalname} enviado con éxito`);
    res.json({ message: "✅ Archivo enviado correctamente" });
  } catch (err) {
    console.error("❌ Error enviando correo:", err);
    res.status(500).json({ message: "Error enviando correo" });
  }
});

// === INICIAR SERVIDOR ===
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
