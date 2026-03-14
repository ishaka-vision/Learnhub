import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import API from "../../services/api";
import useAuthStore from "../../context/authStore";

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useAuthStore();

  const [formData, setFormData]     = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!formData.email || !formData.password) {
      setErrorMessage("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/auth/login", formData);
      const { token, user } = res.data;

      // Sauvegarder dans le store Zustand + localStorage
      login(user, token);

      // Redirection selon le rôle
      if (user.role === "admin")      navigate("/admin/dashboard");
      else if (user.role === "instructor") navigate("/instructor/dashboard");
      else navigate("/dashboard");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-violet-50 flex items-center justify-center px-4 py-12">

      {/* Fond décoratif */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-200 opacity-30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 opacity-30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-md">

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
            Bon retour !
          </h1>
          <p className="text-gray-500">
            Connectez-vous pour continuer votre apprentissage
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="bg-white rounded-3xl shadow-xl border border-violet-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Email */}
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

            {/* Mot de passe */}
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
                  placeholder="Votre mot de passe"
                  required
                  autoComplete="current-password"
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
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-700 text-white py-3.5 rounded-xl font-bold text-base hover:bg-violet-800 disabled:opacity-50 transition-all hover:shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><LogIn size={18} /> Se connecter</>
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Lien inscription */}
          <p className="text-center text-sm text-gray-500">
            Pas encore de compte ?{" "}
            <Link
              to="/register"
              className="text-violet-700 font-bold hover:text-violet-900 transition"
            >
              Créer un compte gratuit →
            </Link>
          </p>
        </div>

        {/* Retour accueil */}
        <p className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-violet-500 hover:text-violet-700 transition"
          >
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
