const express = require("express");
const router = express.Router();
const { Exercise, ExerciseSubmission } = require("../models/Exercise");
const { Enrollment } = require("../models/Enrollment");
const User = require("../models/User");
const { protect, checkRole } = require("../middleware/auth");
const { uploadExercise, toPublicUploadPath } = require("../config/cloudinary");

// POST /api/v1/exercises
router.post("/", protect, checkRole("instructor"), async (req, res, next) => {
  try {
    const exercise = await Exercise.create(req.body);
    res.status(201).json({ success: true, data: exercise });
  } catch (error) { next(error); }
});

// POST /api/v1/exercises/:id/submit — Étudiant soumet une réponse
router.post("/:id/submit", protect, checkRole("student"), uploadExercise.single("file"), async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ success: false, message: "Exercice introuvable." });

    const enrollment = await Enrollment.findOne({ student: req.user._id, course: exercise.course });
    if (!enrollment) return res.status(403).json({ success: false, message: "Non inscrit à ce cours." });

    const submissionData = {
      exercise: exercise._id, student: req.user._id,
      course: exercise.course, status: "pending",
    };

    if (exercise.submissionType === "text") {
      submissionData.answer = req.body.answer;
    } else {
      if (!req.file) return res.status(400).json({ success: false, message: "Fichier requis." });
      submissionData.fileUrl = toPublicUploadPath(req.file.path);
      submissionData.fileName = req.file.originalname;
    }

    const existing = await ExerciseSubmission.findOne({ exercise: exercise._id, student: req.user._id });
    let submission;
    if (existing) {
      Object.assign(existing, submissionData);
      submission = await existing.save();
    } else {
      submission = await ExerciseSubmission.create(submissionData);
    }

    res.status(201).json({ success: true, message: "Réponse soumise.", data: submission });
  } catch (error) { next(error); }
});

// GET /api/v1/exercises/:id/submissions — Instructeur voit les soumissions
router.get("/:id/submissions", protect, checkRole("instructor"), async (req, res, next) => {
  try {
    const submissions = await ExerciseSubmission.find({ exercise: req.params.id })
      .populate("student", "firstName lastName avatar email")
      .sort("-createdAt");
    res.status(200).json({ success: true, data: submissions });
  } catch (error) { next(error); }
});

// PATCH /api/v1/exercises/submissions/:id/grade — Corriger
router.patch("/submissions/:id/grade", protect, checkRole("instructor"), async (req, res, next) => {
  try {
    const { score, feedback, status } = req.body;
    const submission = await ExerciseSubmission.findById(req.params.id).populate("exercise");
    if (!submission) return res.status(404).json({ success: false, message: "Soumission introuvable." });

    submission.score = score;
    submission.feedback = feedback;
    submission.status = status || "graded";
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id;
    await submission.save();

    if (score > 0) {
      await User.findByIdAndUpdate(submission.student, { $inc: { totalPoints: score } });
    }

    res.status(200).json({ success: true, message: "Correction enregistrée.", data: submission });
  } catch (error) { next(error); }
});

// GET /api/v1/exercises/my/:courseId — Soumissions de l'étudiant
router.get("/my/:courseId", protect, checkRole("student"), async (req, res, next) => {
  try {
    const submissions = await ExerciseSubmission.find({
      student: req.user._id, course: req.params.courseId,
    }).populate("exercise", "title maxPoints");
    res.status(200).json({ success: true, data: submissions });
  } catch (error) { next(error); }
});

module.exports = router;
