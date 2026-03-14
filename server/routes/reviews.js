const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const { Enrollment } = require("../models/Enrollment");
const { protect, checkRole } = require("../middleware/auth");

// GET /api/v1/reviews/course/:courseId
router.get("/course/:courseId", async (req, res, next) => {
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
router.post("/course/:courseId", protect, checkRole("student"), async (req, res, next) => {
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
router.delete("/:id", protect, async (req, res, next) => {
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
