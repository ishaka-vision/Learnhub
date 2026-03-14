const express = require("express");
const router = express.Router();
const { Quiz, QuizAttempt } = require("../models/Quiz");
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

module.exports = router;
