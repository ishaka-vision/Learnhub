const express = require("express");
const router = express.Router();
const { Quiz, QuizAttempt } = require("../models/Quiz");
const Review = require("../models/Review");
const { Enrollment } = require("../models/Enrollment");
const User = require("../models/User");
const { protect, checkRole } = require("../middleware/auth");

// POST /api/v1/quizzes
router.post("/", protect, checkRole("instructor"), async (req, res, next) => {
  try {
    const quiz = await Quiz.create(req.body);
    res.status(201).json({ success: true, data: quiz });
  } catch (error) { next(error); }
});

// GET /api/v1/quizzes/:id
router.get("/:id", protect, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz introuvable." });

    let quizData = quiz.toObject();
    if (req.user.role === "student") {
      quizData.questions = quizData.questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({ _id: o._id, text: o.text })),
      }));
    }

    const attemptCount = req.user.role === "student"
      ? await QuizAttempt.countDocuments({ student: req.user._id, quiz: quiz._id })
      : null;

    res.status(200).json({ success: true, data: quizData, attemptCount });
  } catch (error) { next(error); }
});

// POST /api/v1/quizzes/:id/attempt — Soumettre les réponses
router.post("/:id/attempt", protect, checkRole("student"), async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz introuvable." });

    if (quiz.maxAttempts) {
      const attempts = await QuizAttempt.countDocuments({ student: req.user._id, quiz: quiz._id });
      if (attempts >= quiz.maxAttempts) {
        return res.status(400).json({ success: false, message: `Nombre max de tentatives atteint.` });
      }
    }

    const { answers } = req.body;
    let score = 0;
    let maxScore = 0;
    const detailedResults = [];

    for (const question of quiz.questions) {
      maxScore += question.points;
      const studentAnswer = answers.find((a) => a.questionId.toString() === question._id.toString());
      const selectedIds = studentAnswer?.selectedOptions?.map(String) || [];
      const correctIds = question.options.filter((o) => o.isCorrect).map((o) => o._id.toString());
      const isCorrect = selectedIds.length === correctIds.length && selectedIds.every((id) => correctIds.includes(id));

      if (isCorrect) score += question.points;
      detailedResults.push({
        questionId: question._id,
        isCorrect,
        correctOptions: correctIds,
        explanation: question.explanation,
      });
    }

    const percentage = Math.round((score / maxScore) * 100);
    const passed = percentage >= quiz.passingScore;
    const pointsEarned = passed ? score : Math.floor(score * 0.5);

    await QuizAttempt.create({
      student: req.user._id, quiz: quiz._id, course: quiz.course,
      answers, score, maxScore, percentage, passed, pointsEarned,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalPoints: pointsEarned } });

    res.status(200).json({
      success: true,
      data: { score, maxScore, percentage, passed, pointsEarned, passingScore: quiz.passingScore, detailedResults },
    });
  } catch (error) { next(error); }
});

// GET /api/v1/reviews/course/:courseId
router.get("/reviews/course/:courseId", async (req, res, next) => {
  try {
    const mongoose = require("mongoose");
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total, distribution] = await Promise.all([
      Review.find({ course: req.params.courseId, isModerated: false })
        .populate("student", "firstName lastName avatar")
        .sort("-createdAt").skip(skip).limit(parseInt(limit)),
      Review.countDocuments({ course: req.params.courseId, isModerated: false }),
      Review.aggregate([
        { $match: { course: new mongoose.Types.ObjectId(req.params.courseId), isModerated: false } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
      ]),
    ]);

    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.forEach((d) => { dist[d._id] = d.count; });

    res.status(200).json({ success: true, data: reviews, distribution: dist, total });
  } catch (error) { next(error); }
});

// POST /api/v1/reviews/course/:courseId — Laisser un avis
router.post("/reviews/course/:courseId", protect, checkRole("student"), async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: "Inscrivez-vous au cours avant de laisser un avis." });
    }

    const { rating, comment } = req.body;
    const review = await Review.findOneAndUpdate(
      { course: req.params.courseId, student: req.user._id },
      { rating, comment },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: review });
  } catch (error) { next(error); }
});

// DELETE /api/v1/reviews/:id
router.delete("/reviews/:id", protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Avis introuvable." });

    const isOwner = review.student.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Non autorisé." });
    }

    await review.deleteOne();
    res.status(200).json({ success: true, message: "Avis supprimé." });
  } catch (error) { next(error); }
});

module.exports = router;