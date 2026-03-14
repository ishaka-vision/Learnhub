const mongoose = require("mongoose");

// Un bloc = une unité de contenu dans la leçon
const blockSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["text", "video", "example", "note", "exercise", "quiz"],
    // text     = texte normal (fond blanc)
    // video    = vidéo YouTube/Vimeo intégrée
    // example  = exemple remarquable (fond violet)
    // note     = note importante (fond orange)
    // exercise = exercice pratique (fond vert)
    // quiz     = quiz de leçon (fond bleu)
  },
  order: { type: Number, required: true },
  content: { type: String, default: null },       // Pour text, example, note
  videoUrl: { type: String, default: null },       // Pour video
  videoTitle: { type: String, default: null },     // Pour video
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exercise",
    default: null,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    default: null,
  },
});

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Le titre de la leçon est obligatoire"],
      trim: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    order: { type: Number, default: 0 },
    pointsReward: { type: Number, default: 5 },
    duration: { type: Number, default: 10 }, // en minutes
    blocks: [blockSchema],
  },
  { timestamps: true }
);

lessonSchema.index({ module: 1, order: 1 });

module.exports = mongoose.model("Lesson", lessonSchema);