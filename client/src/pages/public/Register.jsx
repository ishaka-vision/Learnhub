import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Mail, Lock, Eye, EyeOff,
  User, BookOpen, UserCheck, CheckCircle
} from "lucide-react";
import API from "../../services/api";
import useAuthStore from "../../context/authStore";
import toast from "react-hot-toast";

// ─── Avantages selon le rôle ──────────────────────────────────────────────────
const ROLE_BENEFITS = {
  student: [
    "Accès à tous les cours gratuitement",
    "Exercices pratiques et corrections",
    "Système de points et badges",
    "Certificat de complétion",
  ],
  instructor: [
    "Créez et publiez vos cours",
    "Éditeur de leçons avec blocs riches",
    "Corrigez les exercices de vos étudiants",
    "Suivez vos statistiques en temps réel",
  ],
};

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [showPassword, setShowPassword]             = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading]                       = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validation en temps réel du mot de passe
  const passwordStrength = () => {
    const p = formData.password;
    if (!p) return null;
    if (p.length < 6)  return { level: 1, label: "Trop court",  color: "bg-red-400" };
    if (p.length < 8)  return { level: 2, label: "Faible",      color: "bg-orange-400" };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p))
                       return { level: 3, label: "Moyen",       color: "bg-yellow-400" };
    return              { level: 4, label: "Fort",       color: "bg-green-500" };
  };
  const strength = passwordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/register", {
        firstName: formData.firstName.trim(),
        lastName:  formData.lastName.trim(),
        email:     formData.email.trim().toLowerCase(),
        password:  formData.password,
        role:      formData.role,
      });

      const { token, user } = res.data;
      login(user, token);
      toast.success(`Bienvenue sur LearnHub, ${user.firstName} ! 🎉`);

      // Redirection selon le rôle
      if (user.role === "instructor") navigate("/instructor/dashboard");
      else navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-violet-50 flex items-center justify-center px-4 py-12">

      {/* Fond décoratif */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-200 opacity-30 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 opacity-30 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-lg">

        {/* Logo + titre */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-violet-700 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap size={26} className="text-white" />
            </div>
            <span className="text-2xl font-black text-gray-900">
              Learn<span className="text-violet-700">Hub</span>
            </span>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Créer un compte gratuit
          </h1>
          <p className="text-gray-500">
            Rejoignez des milliers d'apprenants dès aujourd'hui
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="bg-white rounded-3xl shadow-xl border border-violet-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── Choix du rôle ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Je veux...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "student",    label: "Apprendre",  sub: "Étudiant",    icon: BookOpen },
                  { value: "instructor", label: "Enseigner",  sub: "Instructeur", icon: UserCheck },
                ].map(({ value, label, sub, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: value })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition ${
                      formData.role === value
                        ? "border-violet-600 bg-violet-50"
                        : "border-gray-200 hover:border-violet-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      formData.role === value ? "bg-violet-600" : "bg-gray-100"
                    }`}>
                      <Icon size={20} className={formData.role === value ? "text-white" : "text-gray-500"} />
                    </div>
                    <div className="text-center">
                      <p className={`font-bold text-sm ${formData.role === value ? "text-violet-700" : "text-gray-700"}`}>
                        {label}
                      </p>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Avantages du rôle choisi */}
              <div className="mt-3 bg-violet-50 rounded-xl p-4 border border-violet-100">
                <p className="text-xs font-bold text-violet-700 mb-2">
                  {formData.role === "student" ? "En tant qu'étudiant :" : "En tant qu'instructeur :"}
                </p>
                <div className="space-y-1">
                  {ROLE_BENEFITS[formData.role].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2">
                      <CheckCircle size={12} className="text-violet-500 flex-shrink-0" />
                      <span className="text-xs text-gray-600">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Prénom + Nom ── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prénom
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Jean"
                    required
                    className="w-full pl-9 pr-3 py-3 border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-800 placeholder-gray-400 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Dupont"
                    required
                    className="w-full pl-9 pr-3 py-3 border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-800 placeholder-gray-400 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* ── Email ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {/* ── Mot de passe ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 caractères"
                  required
                  autoComplete="new-password"
                  className="w-full pl-11 pr-12 py-3 border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-800 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600 transition"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Indicateur de force */}
              {strength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          lvl <= strength.level ? strength.color : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* ── Confirmer mot de passe ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Répétez votre mot de passe"
                  required
                  autoComplete="new-password"
                  className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-800 placeholder-gray-400 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? "border-red-300 bg-red-50"
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? "border-green-300 bg-green-50"
                      : "border-violet-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600 transition"
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas.</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle size={11} /> Mots de passe identiques
                </p>
              )}
            </div>

            {/* ── Bouton inscription ── */}
            <button
              type="submit"
              disabled={loading || (formData.confirmPassword && formData.password !== formData.confirmPassword)}
              className="w-full bg-violet-700 text-white py-3.5 rounded-xl font-bold text-base hover:bg-violet-800 disabled:opacity-50 transition-all hover:shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><GraduationCap size={18} /> Créer mon compte gratuitement</>
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Lien connexion */}
          <p className="text-center text-sm text-gray-500">
            Déjà un compte ?{" "}
            <Link
              to="/login"
              className="text-violet-700 font-bold hover:text-violet-900 transition"
            >
              Se connecter →
            </Link>
          </p>
        </div>

        {/* Retour accueil */}
        <p className="text-center mt-6">
          <Link to="/" className="text-sm text-violet-500 hover:text-violet-700 transition">
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
}