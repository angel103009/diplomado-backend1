const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// === STORAGE / UPLOADS ===
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const safeOriginal = file.originalname.replace(/\s+/g, "_");
    const uniqueName = Date.now() + "-" + safeOriginal;
    console.log("📂 Archivo recibido:", uniqueName);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// === MIDDLEWARES ===
app.use(cors()); // Permite orígenes cruzados
app.use("/uploads", express.static(uploadPath)); // Servir archivos bajo /uploads

// Healthcheck
app.get("/", (_req, res) => {
  res.json({ status: "ok", uploadsBase: "/uploads" });
});

// === RUTA DE SUBIDA ===
// Campo: "archivo" (mantengo el mismo nombre que ya usa tu front)
app.post("/upload", upload.single("archivo"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se envió archivo." });
    }
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    console.log("✅ Archivo guardado en:", req.file.path);
    return res.json({
      message: "✅ Archivo subido correctamente",
      file: {
        ...req.file,
        url: fileUrl,
      },
    });
  } catch (err) {
    console.error("❌ Error en /upload:", err);
    return res.status(500).json({ message: "Error subiendo archivo" });
  }
});

// === LISTAR ARCHIVOS ===
app.get("/list", (_req, res) => {
  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      console.error("❌ Error listando:", err);
      return res.status(500).json({ error: "No se pudieron listar los archivos" });
    }
    const baseUrl = (_req.protocol || "http") + "://" + _req.get("host");
    const data = files.map((name) => ({
      name,
      url: `${baseUrl}/uploads/${name}`,
    }));
    res.json({ archivos: data });
  });
});

// === ERRORES GENERALES ===
app.use((err, _req, res, _next) => {
  console.error("❌ Error general:", err);
  res.status(500).json({ message: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
