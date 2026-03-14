const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ["single", "multiple", "truefalse"],
    required: true,
  },
  options: [
    {
      text: { type: String, required: true },
      isCorrect: { type: Boolean, default: false },
    },
  ],
  points: { type: Number, default: 5 },
  explanation: { type: String, default: null },
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    questions: [questionSchema],
    passingScore: { type: Number, default: 70 }, // % minimum pour valider
    maxAttempts: { type: Number, default: null }, // null = illimité
    timeLimit: { type: Number, default: null },   // minutes, null = pas de limite
  },
  { timestamps: true }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        selectedOptions: [mongoose.Schema.Types.ObjectId],
      },
    ],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    pointsEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ student: 1, quiz: 1 });

const Quiz = mongoose.model("Quiz", quizSchema);
const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);

module.exports = { Quiz, QuizAttempt };