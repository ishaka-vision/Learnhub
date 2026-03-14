const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const { Enrollment } = require("../models/Enrollment");
const { protect, checkRole, optionalProtect } = require("../middleware/auth");
const { uploadImage, toPublicUploadPath } = require("../config/cloudinary");

const normalizeListField = (body, key) => {
  const direct = body[key];
  const bracket = body[`${key}[]`];
  const source = bracket !== undefined ? bracket : direct;
  if (Array.isArray(source)) return source.filter((item) => typeof item === "string" && item.trim());
  if (typeof source === "string" && source.trim()) return [source.trim()];
  return [];
};

const normalizeCustomCategory = (category, customCategory) => {
  if (category !== "Autre") return null;
  return typeof customCategory === "string" && customCategory.trim() ? customCategory.trim() : null;
};

// GET /api/v1/courses — Catalogue public
router.get("/", async (req, res, next) => {
  try {
    const { category, level, search, minRating, page = 1, limit = 12, sort = "-createdAt" } = req.query;
    const filter = { status: "published" };

    if (category) filter.$or = [{ category }, { customCategory: category }];
    if (level) filter.level = level;
    if (minRating) filter.averageRating = { $gte: parseFloat(minRating) };
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate("instructor", "firstName lastName avatar")
        .sort(sort).skip(skip).limit(parseInt(limit)).select("-modules"),
      Course.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) { next(error); }
});

// GET /api/v1/courses/instructor/my-courses
router.get("/instructor/my-courses", protect, checkRole("instructor"), async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .sort("-createdAt")
      .select("title status thumbnail enrollmentCount averageRating reviewCount createdAt");
    res.status(200).json({ success: true, data: courses });
  } catch (error) { next(error); }
});

// GET /api/v1/courses/:id — Détail d'un cours
router.get("/:id", optionalProtect, async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "firstName lastName avatar bio")
      .populate({
        path: "modules",
        options: { sort: { order: 1 } },
        populate: {
          path: "lessons",
          options: { sort: { order: 1 } },
          select: "title duration pointsReward order blocks",
        },
      });

    if (!course) {
      return res.status(404).json({ success: false, message: "Cours introuvable." });
    }

    // Les instructeurs peuvent accéder à leurs propres cours (même en brouillon)
    // Les admins peuvent accéder à tous les cours
    // Les autres utilisateurs ne voient que les cours publiés
    const isAuthenticated = Boolean(req.user);
    const isOwner = isAuthenticated && course.instructor._id.toString() === req.user._id.toString();
    const isAdmin = isAuthenticated && req.user.role === "admin";
    const isStudent = isAuthenticated && req.user.role === "student";

    if (course.status !== "published" && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Ce cours n'est pas encore publié." });
    }

    let isEnrolled = false;
    if (isStudent) {
      const enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id }).select("_id");
      isEnrolled = Boolean(enrollment);
    }

    const canSeeBlocks = isOwner || isAdmin || isEnrolled;
    if (!canSeeBlocks) {
      for (const moduleItem of course.modules || []) {
        for (const lessonItem of moduleItem.lessons || []) {
          lessonItem.blocks = [];
        }
      }
    }

    res.status(200).json({ success: true, data: course, isEnrolled });
  } catch (error) { next(error); }
});

// POST /api/v1/courses — Créer un cours
router.post("/", protect, checkRole("instructor"), uploadImage.single("thumbnail"), async (req, res, next) => {
  try {
    const { title, description, category, level, customCategory } = req.body;
    const courseData = {
      title, description, category, level,
      instructor: req.user._id,
      customCategory: normalizeCustomCategory(category, customCategory),
      requirements: normalizeListField(req.body, "requirements"),
      whatYouWillLearn: normalizeListField(req.body, "whatYouWillLearn"),
    };
    if (req.file) courseData.thumbnail = toPublicUploadPath(req.file.path);

    const course = await Course.create(courseData);
    res.status(201).json({ success: true, message: "Cours créé.", data: course });
  } catch (error) { next(error); }
});

// PUT /api/v1/courses/:id — Modifier un cours
router.put("/:id", protect, checkRole("instructor"), uploadImage.single("thumbnail"), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Cours introuvable." });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Non autorisé." });
    }

    const { title, description, category, level, customCategory } = req.body;
    const updateData = {
      title,
      description,
      category,
      level,
      customCategory: normalizeCustomCategory(category, customCategory),
      requirements: normalizeListField(req.body, "requirements"),
      whatYouWillLearn: normalizeListField(req.body, "whatYouWillLearn"),
    };
    if (req.file) updateData.thumbnail = toPublicUploadPath(req.file.path);

    const updated = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updated });
  } catch (error) { next(error); }
});

// DELETE /api/v1/courses/:id
router.delete("/:id", protect, checkRole("admin", "instructor"), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Cours introuvable." });

    const isOwner = course.instructor.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Non autorisé." });
    }

    const modules = await Module.find({ course: course._id });
    const lessonIds = modules.flatMap((m) => m.lessons);
    await Lesson.deleteMany({ _id: { $in: lessonIds } });
    await Module.deleteMany({ course: course._id });
    await course.deleteOne();

    res.status(200).json({ success: true, message: "Cours supprimé." });
  } catch (error) { next(error); }
});

// PATCH /api/v1/courses/:id/submit — Soumettre pour approbation
router.patch("/:id/submit", protect, checkRole("instructor"), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Cours introuvable." });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Non autorisé." });
    }
    if (course.status !== "draft" && course.status !== "rejected") {
      return res.status(400).json({ success: false, message: "Ce cours ne peut pas être soumis." });
    }

    course.status = "pending";
    course.rejectionReason = null;
    await course.save();
    res.status(200).json({ success: true, message: "Cours soumis pour approbation.", data: course });
  } catch (error) { next(error); }
});

// PATCH /api/v1/courses/:id/approve — Admin approuve ou rejette
router.patch("/:id/approve", protect, checkRole("admin"), async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Cours introuvable." });
    if (course.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Seuls les cours en attente peuvent être validés ou rejetés.",
      });
    }

    if (action === "approve") {
      course.status = "published";
      course.rejectionReason = null;
    } else if (action === "reject") {
      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          message: "Une raison de rejet est obligatoire.",
        });
      }
      course.status = "rejected";
      course.rejectionReason = reason.trim();
    } else {
      return res.status(400).json({ success: false, message: "Action invalide : 'approve' ou 'reject'." });
    }

    await course.save();
    res.status(200).json({ success: true, data: course });
  } catch (error) { next(error); }
});

module.exports = router;
