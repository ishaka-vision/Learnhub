const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    instructions: { type: String, required: true },
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
    submissionType: {
      type: String,
      enum: ["text", "file"],
      default: "text",
    },
    maxPoints: { type: Number, default: 20 },
    allowResubmit: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const exerciseSubmissionSchema = new mongoose.Schema(
  {
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },
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
    answer: { type: String, default: null },
    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "graded", "needs_revision"],
      default: "pending",
    },
    score: { type: Number, default: null },
    feedback: { type: String, default: null },
    gradedAt: { type: Date, default: null },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

exerciseSubmissionSchema.index({ exercise: 1, student: 1 });

const Exercise = mongoose.model("Exercise", exerciseSchema);
const ExerciseSubmission = mongoose.model("ExerciseSubmission", exerciseSubmissionSchema);

module.exports = { Exercise, ExerciseSubmission };