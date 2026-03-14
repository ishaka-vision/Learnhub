const express = require("express");
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { uploadImage } = require("../config/cloudinary");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/update-profile", protect, uploadImage.single("avatar"), updateProfile);
router.put("/change-password", protect, changePassword);

module.exports = router;