const mongoose = require("mongoose");

// Inscription d'un étudiant à un cours
const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
    completedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Un étudiant ne peut s'inscrire qu'une seule fois par cours
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Progression leçon par leçon
const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

progressSchema.index({ student: 1, lesson: 1 }, { unique: true });
progressSchema.index({ student: 1, course: 1 });

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
const Progress = mongoose.model("Progress", progressSchema);

module.exports = { Enrollment, Progress };