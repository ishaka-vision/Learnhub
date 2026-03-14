const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Créer les dossiers s'ils n'existent pas
const imageDir = path.join(__dirname, "../uploads/images");
const exerciseDir = path.join(__dirname, "../uploads/exercises");

[imageDir, exerciseDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage pour les images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Storage pour les exercices
const exerciseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, exerciseDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Filter pour les images
const imageFilter = (req, file, cb) => {
  const allowed = ["jpg", "jpeg", "png", "webp"];
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Seules les images JPG, PNG et WebP sont autorisées"));
  }
};

// Filter pour les exercices
const exerciseFilter = (req, file, cb) => {
  const allowed = ["pdf", "zip", "png", "jpg", "jpeg", "txt", "doc", "docx"];
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Format de fichier non autorisé"));
  }
};

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadExercise = multer({
  storage: exerciseStorage,
  fileFilter: exerciseFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

const toPublicUploadPath = (filePath) => {
  if (!filePath) return null;
  const normalized = String(filePath).replace(/\\/g, "/");
  const marker = "/uploads/";
  const idx = normalized.lastIndexOf(marker);
  if (idx !== -1) return normalized.slice(idx);
  if (normalized.startsWith("uploads/")) return `/${normalized}`;
  return filePath;
};

module.exports = { uploadImage, uploadExercise, toPublicUploadPath };
