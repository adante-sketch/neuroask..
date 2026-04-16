import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import Tesseract from "tesseract.js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", core: "v4.2" });
  });

  // File Upload & OCR Endpoint
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = file.path;
      const fileType = file.mimetype;

      let extractedText = "";
      if (fileType.startsWith("image/")) {
        const { data: { text } } = await Tesseract.recognize(filePath, "eng");
        extractedText = text;
      } else if (fileType === "text/plain") {
        extractedText = fs.readFileSync(filePath, "utf8");
      } else {
        extractedText = "File uploaded. AI analysis pending for this format.";
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({ 
        extractedText
      });
    } catch (error: any) {
      console.error("Upload Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { overlay: false }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NEUROASK Core running on http://localhost:${PORT}`);
  });
}

startServer();
