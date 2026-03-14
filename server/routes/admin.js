const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Course = require("../models/Course");
const { Enrollment } = require("../models/Enrollment");
const { protect, checkRole } = require("../middleware/auth");

router.use(protect, checkRole("admin"));

// GET /api/v1/admin/stats
router.get("/stats", async (req, res, next) => {
  try {
    const [totalUsers, totalStudents, totalInstructors, totalCourses, publishedCourses, pendingCourses, totalEnrollments] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "instructor" }),
        Course.countDocuments(),
        Course.countDocuments({ status: "published" }),
        Course.countDocuments({ status: "pending" }),
        Enrollment.countDocuments(),
      ]);

    const topCourses = await Course.find({ status: "published" })
      .sort("-enrollmentCount").limit(5)
      .select("title enrollmentCount averageRating")
      .populate("instructor", "firstName lastName");

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers, students: totalStudents, instructors: totalInstructors },
        courses: { total: totalCourses, published: publishedCourses, pending: pendingCourses },
        enrollments: { total: totalEnrollments },
        topCourses,
      },
    });
  } catch (error) { next(error); }
});

// GET /api/v1/admin/users
router.get("/users", async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort("-createdAt").skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, data: users, total });
  } catch (error) { next(error); }
});

// PATCH /api/v1/admin/users/:id/toggle — Activer/Suspendre
router.patch("/users/:id/toggle", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    if (user.role === "admin") return res.status(400).json({ success: false, message: "Impossible de suspendre un admin." });

    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ success: true, message: user.isActive ? "Compte réactivé." : "Compte suspendu.", data: user });
  } catch (error) { next(error); }
});

// DELETE /api/v1/admin/users/:id
router.delete("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    if (user.role === "admin") return res.status(400).json({ success: false, message: "Impossible de supprimer un admin." });
    await user.deleteOne();
    res.status(200).json({ success: true, message: "Utilisateur supprimé." });
  } catch (error) { next(error); }
});

// GET /api/v1/admin/courses/pending
router.get("/courses/pending", async (req, res, next) => {
  try {
    const courses = await Course.find({ status: "pending" })
      .populate("instructor", "firstName lastName email")
      .sort("createdAt");
    res.status(200).json({ success: true, data: courses });
  } catch (error) { next(error); }
});

module.exports = router;