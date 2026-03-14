const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "La note est obligatoire"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    instructorReply: { type: String, default: null },
    instructorRepliedAt: { type: Date, default: null },
    isModerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Un étudiant = une seule review par cours
reviewSchema.index({ course: 1, student: 1 }, { unique: true });

// Recalcule la moyenne du cours après chaque review
async function recalculateCourseRating(courseId) {
  const Course = require("./Course");
  const stats = await mongoose.model("Review").aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId), isModerated: false } },
    { $group: { _id: "$course", averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].reviewCount,
    });
  } else {
    await Course.findByIdAndUpdate(courseId, { averageRating: 0, reviewCount: 0 });
  }
}

reviewSchema.post("save", function () {
  recalculateCourseRating(this.course);
});

reviewSchema.post("findOneAndDelete", function (doc) {
  if (doc) recalculateCourseRating(doc.course);
});

module.exports = mongoose.model("Review", reviewSchema);