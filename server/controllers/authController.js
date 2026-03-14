const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Cet email est déjà utilisé." });
    }

    const allowedRoles = ["student", "instructor"];
    const userRole = allowedRoles.includes(role) ? role : "student";

    const user = await User.create({ firstName, lastName, email, password, role: userRole });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Compte créé avec succès.",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        totalPoints: user.totalPoints,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email et mot de passe requis." });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Email ou mot de passe incorrect." });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Compte suspendu. Contactez l'administrateur." });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        totalPoints: user.totalPoints,
        badges: user.badges,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/auth/update-profile
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, bio } = req.body;
    const updateData = { firstName, lastName, bio };

    if (req.file) {
      updateData.avatar = req.file.path;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: "Profil mis à jour.", user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isCorrect = await user.comparePassword(currentPassword);
    if (!isCorrect) {
      return res.status(400).json({ success: false, message: "Mot de passe actuel incorrect." });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Mot de passe mis à jour." });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };