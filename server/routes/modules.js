const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const { protect, checkRole } = require("../middleware/auth");

const ALLOWED_BLOCK_TYPES = new Set(["text", "video", "example", "note", "exercise", "quiz"]);

const sanitizeLessonBlocks = (blocks = []) => {
  return blocks
    .filter((block) => block && typeof block === "object" && ALLOWED_BLOCK_TYPES.has(block.type))
    .map((block, index) => {
      const sanitized = {
        type: block.type,
        order: Number.isFinite(Number(block.order)) ? Number(block.order) : index,
        content: typeof block.content === "string" ? block.content : null,
      };

      if (block.type === "video") {
        sanitized.videoUrl = typeof block.videoUrl === "string" && block.videoUrl.trim()
          ? block.videoUrl.trim()
          : null;
        sanitized.videoTitle = typeof block.videoTitle === "string" && block.videoTitle.trim()
          ? block.videoTitle.trim()
          : null;
      }

      if (mongoose.Types.ObjectId.isValid(block.exercise)) {
        sanitized.exercise = block.exercise;
      }
      if (mongoose.Types.ObjectId.isValid(block.quiz)) {
        sanitized.quiz = block.quiz;
      }

      return sanitized;
    });
};

// POST /api/v1/modules — Créer un module
router.post("/", protect, checkRole("instructor"), async (req, res, next) => {
  try {
    const { courseId, title } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Cours introuvable." });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Non autorisé." });
    }

    const count = await Module.countDocuments({ course: courseId });
    const module = await Module.create({ title, course: courseId, order: count });
    await Course.findByIdAndUpdate(courseId, { $push: { modules: module._id } });

    res.status(201).json({ success: true, data: module });
  } catch (error) { next(error); }
});

// PUT /api/v1/modules/:id
router.put("/:id", protect, checkRole("instructor"), async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ success: false, message: "Module introuvable." });
    const course = await Course.findById(module.course).select("instructor");
    if (!course) return res.status(404).json({ success: false, message: "Cours introuvable." });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Non autorisé." });
    }

    module.title = req.body.title;
    await module.save();
    res.status(200).json({ success: true, data: module });
  } catch (error) { next(error); }
});

// DELETE /api/v1/modules/:id
router.delete("/:id", protect, checkRole("instructor", "admin"), async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ success: false, message: "Module introuvable." });
    if (req.user.role === "instructor") {
      const course = await Course.findById(module.course).select("instructor");
      if (!course) return res.status(404).json({ success: false, message: "Cours introuvable." });
      if (course.instructor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Non autorisé." });
      }
    }

    await Lesson.deleteMany({ module: module._id });
    await Course.findByIdAndUpdate(module.course, { $pull: { modules: module._id } });
    await module.deleteOne();

    res.status(200).json({ success: true, message: "Module supprimé." });
  } catch (error) { next(error); }
});

// GET /api/v1/modules/lessons/:id — Récupérer une leçon complète
router.get("/lessons/:id", protect, async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate("blocks.exercise")
      .populate("blocks.quiz");
    if (!lesson) return res.status(404).json({ success: false, message: "Leçon introuvable." });
    res.status(200).json({ success: true, data: lesson });
  } catch (error) { next(error); }
});

// POST /api/v1/modules/lessons — Créer une leçon
router.post("/lessons", protect, checkRole("instructor"), async (req, res, next) => {
  try {
    const { moduleId, title, duration, pointsReward } = req.body;
    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ success: false, message: "Module introuvable." });
    const course = await Course.findById(module.course).select("instructor");
    if (!course) return res.status(404).json({ success: false, message: "Cours introuvable." });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Non autorisé." });
    }

    const count = await Lesson.countDocuments({ module: moduleId });
    const lesson = await Lesson.create({
      title, module: moduleId, course: module.course,
      order: count, duration: duration || 10,
      pointsReward: pointsReward || 5, blocks: [],
    });

    await Module.findByIdAndUpdate(moduleId, { $push: { lessons: lesson._id } });
    res.status(201).json({ success: true, data: lesson });
  } catch (error) { next(error); }
});

// PUT /api/v1/modules/lessons/:id — Mettre à jour une leçon
router.put("/lessons/:id", protect, checkRole("instructor"), async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: "Leçon introuvable." });
    const course = await Course.findById(lesson.course).select("instructor");
    if (!course) return res.status(404).json({ success: false, message: "Cours introuvable." });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Non autorisé." });
    }

    const { title, duration, pointsReward, blocks } = req.body;
    if (typeof title === "string") lesson.title = title.trim();
    if (Object.prototype.hasOwnProperty.call(req.body, "duration")) {
      lesson.duration = Number(duration);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "pointsReward")) {
      lesson.pointsReward = Number(pointsReward);
    }
    if (Array.isArray(blocks)) {
      lesson.blocks = sanitizeLessonBlocks(blocks);
    }

    await lesson.save();
    res.status(200).json({ success: true, data: lesson });
  } catch (error) { next(error); }
});

// DELETE /api/v1/modules/lessons/:id
router.delete("/lessons/:id", protect, checkRole("instructor", "admin"), async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: "Leçon introuvable." });

    await Module.findByIdAndUpdate(lesson.module, { $pull: { lessons: lesson._id } });
    await lesson.deleteOne();

    res.status(200).json({ success: true, message: "Leçon supprimée." });
  } catch (error) { next(error); }
});

module.exports = router;
