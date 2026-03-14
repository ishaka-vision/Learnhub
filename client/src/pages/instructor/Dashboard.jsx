import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Users, Star, Plus, Edit,
  Eye, TrendingUp, CheckCircle, Clock,
  AlertCircle, BarChart2, Award, Send
} from "lucide-react";
import API from "../../services/api";
import useAuthStore from "../../context/authStore";
import { resolveMediaUrl } from "../../utils/media";

// ─── Badge statut du cours ────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    draft:     { label: "Brouillon",   class: "bg-gray-100 text-gray-600" },
    pending:   { label: "En attente",  class: "bg-yellow-100 text-yellow-700" },
    published: { label: "Publié",      class: "bg-green-100 text-green-700" },
    rejected:  { label: "Rejeté",      class: "bg-red-100 text-red-700" },
  };
  const s = config[status] || config.draft;
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.class}`}>
      {s.label}
    </span>
  );
}

export default function InstructorDashboard() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await API.get("/courses/instructor/my-courses");
        setCourses(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Stats dynamiques calculées depuis les vrais cours
  const totalStudents = courses.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0);
  const publishedCourses = courses.filter((c) => c.status === "published").length;
  const pendingCourses = courses.filter((c) => c.status === "pending").length;
  const avgRating = courses.filter((c) => c.averageRating > 0).length > 0
    ? (courses.reduce((acc, c) => acc + (c.averageRating || 0), 0) /
       courses.filter((c) => c.averageRating > 0).length).toFixed(1)
    : "—";

  // Soumettre un cours pour approbation
  const handleSubmit = async (courseId) => {
    try {
      await API.patch(`/courses/${courseId}/submit`);
      setCourses((prev) =>
        prev.map((c) => c._id === courseId ? { ...c, status: "pending" } : c)
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-violet-50">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-violet-900 to-purple-800 px-6 py-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-violet-300 text-sm mb-1">Espace instructeur</p>
            <h1 className="text-3xl font-black text-white">
              Bonjour, {user?.firstName} 👋
            </h1>
            <p className="text-violet-300 mt-1 text-sm">
              Gérez vos cours et suivez vos étudiants
            </p>
          </div>
          <Link
            to="/instructor/courses/new"
            className="bg-white text-violet-700 font-bold px-6 py-3 rounded-xl hover:bg-violet-50 transition flex items-center gap-2 shadow-lg"
          >
            <Plus size={18} />
            Créer un cours
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BookOpen,   label: "Mes cours",        value: courses.length,   color: "bg-violet-600" },
            { icon: Users,      label: "Total étudiants",  value: totalStudents,    color: "bg-purple-600" },
            { icon: CheckCircle,label: "Cours publiés",    value: publishedCourses, color: "bg-green-500" },
            { icon: Star,       label: "Note moyenne",     value: avgRating,        color: "bg-yellow-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-violet-100 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={22} className="text-white" />
              </div>
              <p className="text-3xl font-black text-gray-900">{value}</p>
              <p className="text-gray-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Alerte cours en attente ── */}
        {pendingCourses > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0" />
            <p className="text-yellow-800 text-sm font-medium">
              {pendingCourses} cours en attente d'approbation par l'administrateur.
            </p>
          </div>
        )}

        {/* ── Liste des cours ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 text-xl flex items-center gap-2">
              <BookOpen size={20} className="text-violet-600" />
              Mes cours
            </h2>
            <Link
              to="/instructor/courses/new"
              className="bg-violet-700 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-violet-800 transition flex items-center gap-2"
            >
              <Plus size={16} /> Nouveau cours
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-violet-100" />
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-violet-50 border-b border-violet-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-bold text-violet-700 uppercase tracking-wide">Cours</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-violet-700 uppercase tracking-wide hidden md:table-cell">Statut</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-violet-700 uppercase tracking-wide hidden lg:table-cell">Étudiants</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-violet-700 uppercase tracking-wide hidden lg:table-cell">Note</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-violet-700 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {courses.map((course) => (
                    <tr key={course._id} className="hover:bg-violet-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            {course.thumbnail ? (
                              <img src={resolveMediaUrl(course.thumbnail)} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <BookOpen size={16} className="text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm line-clamp-1">{course.title}</p>
                            <p className="text-xs text-gray-400">{new Date(course.createdAt).toLocaleDateString("fr-FR")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <StatusBadge status={course.status} />
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <Users size={14} className="text-violet-400" />
                          {course.enrollmentCount || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <Star size={14} className="text-yellow-400 fill-yellow-400" />
                          {course.averageRating > 0 ? course.averageRating.toFixed(1) : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {course.status === "draft" && (
                            <button
                              onClick={() => handleSubmit(course._id)}
                              className="flex items-center gap-1 bg-violet-100 text-violet-700 text-xs px-3 py-1.5 rounded-lg hover:bg-violet-200 transition font-semibold"
                            >
                              <Send size={12} /> Soumettre
                            </button>
                          )}
                          <Link
                            to={`/instructor/courses/${course._id}/edit`}
                            className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-200 transition font-semibold"
                          >
                            <Edit size={12} /> Éditer
                          </Link>
                          {course.status === "published" && (
                            <Link
                              to={`/courses/${course._id}`}
                              className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-lg hover:bg-green-200 transition font-semibold"
                            >
                              <Eye size={12} /> Voir
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-violet-200">
              <BookOpen size={48} className="text-violet-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                Aucun cours créé
              </h3>
              <p className="text-gray-400 mb-6">
                Créez votre premier cours et partagez vos connaissances.
              </p>
              <Link
                to="/instructor/courses/new"
                className="bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-violet-800 transition inline-flex items-center gap-2"
              >
                <Plus size={18} /> Créer mon premier cours
              </Link>
            </div>
          )}
        </div>

        {/* ── Raccourcis ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/instructor/corrections"
            className="bg-white border border-violet-100 rounded-2xl p-5 hover:shadow-md transition group flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition">
              <CheckCircle size={22} className="text-violet-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Corriger les exercices</p>
              <p className="text-gray-500 text-sm">Voir les soumissions en attente</p>
            </div>
          </Link>
          <Link
            to="/instructor/courses/new"
            className="bg-white border border-violet-100 rounded-2xl p-5 hover:shadow-md transition group flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition">
              <Plus size={22} className="text-violet-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Créer un cours</p>
              <p className="text-gray-500 text-sm">Ajouter un nouveau cours</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
