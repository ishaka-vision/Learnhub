const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const { Enrollment, Progress } = require("../models/Enrollment");
const User = require("../models/User");
const { protect, checkRole } = require("../middleware/auth");

// POST /api/v1/enrollments/:courseId — S'inscrire
router.post("/:courseId", protect, checkRole("student"), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ success: false, message: "Cours introuvable ou non publié." });
    }

    const existing = await Enrollment.findOne({ student: req.user._id, course: course._id });
    if (existing) {
      return res.status(400).json({ success: false, message: "Déjà inscrit à ce cours." });
    }

    await Enrollment.create({ student: req.user._id, course: course._id });
    await Course.findByIdAndUpdate(course._id, { $inc: { enrollmentCount: 1 } });
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalPoints: 2 } });

    res.status(201).json({ success: true, message: "Inscription réussie ! +2 points." });
  } catch (error) { next(error); }
});

// GET /api/v1/enrollments/my — Mes cours
router.get("/my", protect, checkRole("student"), async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: "course",
        select: "title thumbnail instructor category customCategory level averageRating",
        populate: { path: "instructor", select: "firstName lastName" },
      })
      .sort("-createdAt");
    res.status(200).json({ success: true, data: enrollments });
  } catch (error) { next(error); }
});

// POST /api/v1/progress/:lessonId/complete — Marquer une leçon terminée
router.post("/progress/:lessonId/complete", protect, checkRole("student"), async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: "Leçon introuvable." });

    const enrollment = await Enrollment.findOne({ student: req.user._id, course: lesson.course });
    if (!enrollment) return res.status(403).json({ success: false, message: "Non inscrit à ce cours." });

    const existing = await Progress.findOne({ student: req.user._id, lesson: lesson._id });

    if (!existing) {
      await Progress.create({
        student: req.user._id, lesson: lesson._id,
        course: lesson.course, completed: true, completedAt: new Date(),
      });
      await User.findByIdAndUpdate(req.user._id, { $inc: { totalPoints: lesson.pointsReward } });
    }

    const [totalLessons, completedLessons] = await Promise.all([
      Lesson.countDocuments({ course: lesson.course }),
      Progress.countDocuments({ student: req.user._id, course: lesson.course, completed: true }),
    ]);

    const completionPercent = Math.round((completedLessons / totalLessons) * 100);
    const updateData = { completionPercent };

    if (completionPercent === 100 && !enrollment.completedAt) {
      updateData.completedAt = new Date();
      await User.findByIdAndUpdate(req.user._id, { $inc: { totalPoints: 50 } });
    }

    await Enrollment.findByIdAndUpdate(enrollment._id, updateData);

    res.status(200).json({
      success: true,
      message: `Leçon terminée ! +${existing ? 0 : lesson.pointsReward} points.`,
      completionPercent,
    });
  } catch (error) { next(error); }
});

// GET /api/v1/progress/:courseId — Progression dans un cours
router.get("/progress/:courseId", protect, async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId });
    if (!enrollment) return res.status(403).json({ success: false, message: "Non inscrit." });

    const completedLessons = await Progress.find({
      student: req.user._id, course: req.params.courseId, completed: true,
    }).select("lesson completedAt");

    res.status(200).json({
      success: true,
      data: {
        completionPercent: enrollment.completionPercent,
        completedAt: enrollment.completedAt,
        completedLessonIds: completedLessons.map((p) => p.lesson.toString()),
      },
    });
  } catch (error) { next(error); }
});

module.exports = router;
