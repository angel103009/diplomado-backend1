import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config(); // cargar variables del .env

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de Multer para guardar archivos
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Ruta para subir archivos y mandar correo
app.post("/upload", upload.single("archivo"), async (req, res) => {
  const { actividad } = req.body;
  if (!req.file) return res.status(400).json({ message: "No se envió ningún archivo" });

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.towerev.com",  // Cambia al host de tu proveedor si es diferente
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Diplomado" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // puedes cambiar a otro destinatario
      subject: `Nueva entrega - Actividad ${actividad}`,
      text: `Un estudiante subió un archivo para la actividad ${actividad}.\nArchivo: ${req.file.filename}`
    });

    res.json({ message: "✅ Archivo recibido y correo enviado" });
  } catch (error) {
    console.error("Error enviando correo:", error);
    res.status(500).json({ message: "❌ Error al enviar correo" });
  }
});

// Rutas para listar y servir archivos
app.get("/list", (req, res) => {
  try {
    const archivos = fs.readdirSync(uploadDir).map(name => ({ name, url: `/uploads/${name}` }));
    res.json({ archivos });
  } catch (err) {
    res.status(500).json({ message: "Error al listar archivos" });
  }
});

app.use("/uploads", express.static(uploadDir));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));


