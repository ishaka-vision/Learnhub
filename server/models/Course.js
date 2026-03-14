const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Le titre est obligatoire"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "La description est obligatoire"],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Développement Web",
        "Développement Mobile",
        "Data Science",
        "Design",
        "Marketing",
        "Business",
        "Langues",
        "Musique",
        "Photographie",
        "Autre",
      ],
    },
    customCategory: {
      type: String,
      default: null,
      trim: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    thumbnail: {
      type: String,
      default: null,
    },
    // draft → pending → published ou rejected
    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected"],
      default: "draft",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    modules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
      },
    ],
    enrollmentCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    requirements: [String],
    whatYouWillLearn: [String],
  },
  { timestamps: true }
);

courseSchema.index({ status: 1, category: 1 });
courseSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Course", courseSchema);
