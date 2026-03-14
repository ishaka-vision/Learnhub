import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  LayoutDashboard,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import useAuthStore from "../../context/authStore";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (user?.role === "admin") return "/admin/dashboard";
    if (user?.role === "instructor") return "/instructor/dashboard";
    return "/dashboard";
  };

  return (
    <nav className="bg-white border-b border-violet-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-violet-700 rounded-xl flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="text-xl font-black text-gray-900">
            Learn<span className="text-violet-700">Hub</span>
          </span>
        </Link>

        {/* Liens centre — desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/courses"
            className="flex items-center gap-2 text-gray-600 hover:text-violet-700 font-medium transition-colors"
          >
            <BookOpen size={16} className="text-violet-500" />
            Catalogue
          </Link>
        </div>

        {/* Boutons droite — desktop */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardLink()}
                className="flex items-center gap-2 text-gray-700 hover:text-violet-700 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-violet-50"
              >
                <div className="w-8 h-8 bg-violet-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <span>{user?.firstName}</span>
                <LayoutDashboard size={15} className="text-violet-400" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 font-medium transition-colors text-sm"
              >
                <LogOut size={15} />
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 text-gray-600 hover:text-violet-700 font-medium px-4 py-2 rounded-lg hover:bg-violet-50 transition-colors"
              >
                <User size={16} className="text-violet-500" />
                Connexion
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 bg-violet-700 text-white px-5 py-2 rounded-xl hover:bg-violet-800 font-semibold transition-all hover:shadow-lg text-sm"
              >
                <GraduationCap size={16} />
                S'inscrire
              </Link>
            </>
          )}
        </div>

        {/* Bouton menu mobile */}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-violet-100 px-6 py-4 space-y-3">
          <Link
            to="/courses"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 text-gray-700 font-medium py-2"
          >
            <BookOpen size={18} className="text-violet-600" />
            Catalogue des cours
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardLink()}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-gray-700 font-medium py-2"
              >
                <LayoutDashboard size={18} className="text-violet-600" />
                Dashboard
              </Link>
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="flex items-center gap-2 text-red-600 font-medium py-2"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-gray-700 font-medium py-2">
                <User size={18} className="text-violet-600" />
                Connexion
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-violet-700 font-semibold py-2">
                <GraduationCap size={18} />
                S'inscrire gratuitement
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}