const express = require("express");
const router = express.Router();
const { protect, checkRole } = require("../middleware/auth");
const { Enrollment, Progress } = require("../models/Enrollment");
const Lesson = require("../models/Lesson");
const Course = require("../models/Course");
const User = require("../models/User");

const getCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas inscrit à ce cours.",
      });
    }

    const course = await Course.findById(courseId).populate({
      path: "modules",
      populate: { path: "lessons" },
    });

    if (!course) {
      return res.status(404).json({ success: false, message: "Cours introuvable." });
    }

    const totalLessons = course.modules.reduce(
      (sum, mod) => sum + mod.lessons.length,
      0
    );
    const completedLessons = enrollment.completedLessons?.length || 0;
    const progressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    res.json({
      success: true,
      data: {
        course: { _id: course._id, title: course.title },
        totalLessons,
        completedLessons,
        progressPercentage,
        completionPercent: enrollment.completionPercent || progressPercentage,
        completedLessonIds: enrollment.completedLessons || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

const markLessonComplete = async (req, res, next) => {
  try {
    const lessonId = req.params.lessonId || req.body.lessonId;
    const bodyCourseId = req.body.courseId;
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: "lessonId est requis.",
      });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Leçon introuvable." });
    }

    const courseId = bodyCourseId || lesson.course.toString();
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas inscrit à ce cours.",
      });
    }

    if (!enrollment.completedLessons.some((id) => id.toString() === lessonId.toString())) {
      enrollment.completedLessons.push(lesson._id);
      await Progress.updateOne(
        { student: req.user._id, lesson: lesson._id, course: lesson.course },
        {
          $set: {
            completed: true,
            completedAt: new Date(),
          },
        },
        { upsert: true }
      );
      await User.findByIdAndUpdate(req.user._id, { $inc: { totalPoints: lesson.pointsReward || 5 } });
    }

    const totalLessons = await Lesson.countDocuments({ course: lesson.course });
    const completedLessons = enrollment.completedLessons.length;
    const completionPercent = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    enrollment.completionPercent = completionPercent;
    if (completionPercent === 100 && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
      await User.findByIdAndUpdate(req.user._id, { $inc: { totalPoints: 50 } });
    }
    await enrollment.save();

    res.status(200).json({
      success: true,
      message: "Leçon marquée comme complétée.",
      completionPercent,
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

// Endpoints existants
router.get("/course/:courseId", protect, checkRole("student"), getCourseProgress);
router.post("/mark-lesson-complete", protect, checkRole("student"), markLessonComplete);

// GET /api/v1/progress/student - Récupère la progression globale d'un student
router.get("/student", protect, checkRole("student"), async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user._id,
    }).populate("course", "title");

    const progressData = enrollments.map((enrollment) => ({
      course: enrollment.course.title,
      courseId: enrollment.course._id,
      completedLessons: enrollment.completedLessons?.length || 0,
      enrolledAt: enrollment.createdAt,
    }));

    res.json({
      success: true,
      data: progressData,
    });
  } catch (error) {
    next(error);
  }
});

// Endpoints attendus par le frontend actuel
router.get("/:courseId", protect, checkRole("student"), getCourseProgress);
router.post("/:lessonId/complete", protect, checkRole("student"), markLessonComplete);

module.exports = router;
