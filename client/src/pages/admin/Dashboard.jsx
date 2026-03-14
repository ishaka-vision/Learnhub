import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, BookOpen, TrendingUp, CheckCircle,
  Clock, XCircle, Eye, ThumbsUp, ThumbsDown,
  BarChart2, Shield, AlertTriangle
} from "lucide-react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { getCourseCategory, resolveMediaUrl } from "../../utils/media";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, pendingRes] = await Promise.all([
          API.get("/admin/stats"),
          API.get("/admin/courses/pending"),
        ]);
        setStats(statsRes.data.data);
        setPendingCourses(pendingRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Approuver ou rejeter un cours
  const handleCourseAction = async (courseId, action) => {
    try {
      await API.patch(`/courses/${courseId}/approve`, {
        action,
        reason: action === "reject" ? "Ne respecte pas les standards de la plateforme." : undefined,
      });
      setPendingCourses((prev) => prev.filter((c) => c._id !== courseId));
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          courses: {
            ...prev.courses,
            pending: Math.max(0, (prev.courses?.pending || 0) - 1),
            published: action === "approve"
              ? (prev.courses?.published || 0) + 1
              : (prev.courses?.published || 0),
          },
        };
      });
      toast.success(action === "approve" ? "Cours publié !" : "Cours rejeté.");
    } catch (err) {
      toast.error("Erreur lors de l'action.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-violet-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-violet-50">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-violet-900 to-purple-800 px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={28} className="text-violet-300" />
            <h1 className="text-3xl font-black text-white">Dashboard Admin</h1>
          </div>
          <p className="text-violet-300 text-sm">
            Vue d'ensemble de la plateforme LearnHub
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Stats globales ── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users,      label: "Total utilisateurs",  value: stats.users?.total || 0,         color: "bg-violet-600" },
              { icon: BookOpen,   label: "Cours publiés",       value: stats.courses?.published || 0,   color: "bg-green-500" },
              { icon: TrendingUp, label: "Total inscriptions",  value: stats.enrollments?.total || 0,   color: "bg-purple-600" },
              { icon: Clock,      label: "Cours en attente",    value: stats.courses?.pending || 0,     color: "bg-yellow-500" },
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
        )}

        {/* ── Détails utilisateurs ── */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Étudiants",    value: stats.users?.students || 0,    color: "text-violet-600",  bg: "bg-violet-50" },
              { label: "Instructeurs", value: stats.users?.instructors || 0, color: "text-purple-600",  bg: "bg-purple-50" },
              { label: "Admins",       value: stats.users?.total - stats.users?.students - stats.users?.instructors || 0, color: "text-indigo-600", bg: "bg-indigo-50" },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-2xl p-5 border border-violet-100 flex items-center justify-between`}>
                <div>
                  <p className="text-gray-600 text-sm font-medium">{item.label}</p>
                  <p className={`text-4xl font-black ${item.color}`}>{item.value}</p>
                </div>
                <Users size={36} className={`${item.color} opacity-20`} />
              </div>
            ))}
          </div>
        )}

        {/* ── Cours en attente d'approbation ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 text-xl flex items-center gap-2">
              <AlertTriangle size={20} className="text-yellow-500" />
              Cours en attente d'approbation
              {pendingCourses.length > 0 && (
                <span className="bg-yellow-100 text-yellow-700 text-sm font-bold px-2.5 py-0.5 rounded-full">
                  {pendingCourses.length}
                </span>
              )}
            </h2>
          </div>

          {pendingCourses.length > 0 ? (
            <div className="space-y-4">
              {pendingCourses.map((course) => (
                <div
                  key={course._id}
                  className="bg-white rounded-2xl border border-yellow-200 p-5 flex flex-col md:flex-row items-start md:items-center gap-4"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-purple-600 rounded-xl flex-shrink-0 overflow-hidden">
                    {course.thumbnail ? (
                      <img src={resolveMediaUrl(course.thumbnail)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={24} className="text-white opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-base line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-1 mt-0.5">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users size={11} className="text-violet-400" />
                        {course.instructor?.firstName} {course.instructor?.lastName}
                      </span>
                      <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                        {getCourseCategory(course)}
                      </span>
                      <span>
                        Soumis le {new Date(course.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/courses/${course._id}`}
                      className="flex items-center gap-1 bg-violet-100 text-violet-700 text-sm px-4 py-2 rounded-xl hover:bg-violet-200 transition font-semibold"
                    >
                      <Eye size={14} /> Voir
                    </Link>
                    <button
                      onClick={() => handleCourseAction(course._id, "approve")}
                      className="flex items-center gap-1 bg-green-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-green-600 transition font-semibold"
                    >
                      <ThumbsUp size={14} /> Approuver
                    </button>
                    <button
                      onClick={() => handleCourseAction(course._id, "reject")}
                      className="flex items-center gap-1 bg-red-100 text-red-600 text-sm px-4 py-2 rounded-xl hover:bg-red-200 transition font-semibold"
                    >
                      <ThumbsDown size={14} /> Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-violet-100 p-10 text-center">
              <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                Aucun cours en attente. Tout est à jour !
              </p>
            </div>
          )}
        </div>

        {/* ── Top cours ── */}
        {stats?.topCourses?.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 text-xl flex items-center gap-2 mb-5">
              <BarChart2 size={20} className="text-violet-600" />
              Top cours par inscriptions
            </h2>
            <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">
              {stats.topCourses.map((course, i) => (
                <div
                  key={course._id}
                  className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-violet-50 transition"
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
                    i === 0 ? "bg-yellow-100 text-yellow-700" :
                    i === 1 ? "bg-gray-100 text-gray-600" :
                    i === 2 ? "bg-orange-100 text-orange-600" :
                    "bg-violet-100 text-violet-600"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm line-clamp-1">
                      {course.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      Par {course.instructor?.firstName} {course.instructor?.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm flex-shrink-0">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Users size={13} className="text-violet-400" />
                      {course.enrollmentCount}
                    </span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <BarChart2 size={13} className="text-violet-400" />
                      {course.averageRating > 0 ? course.averageRating.toFixed(1) : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Raccourcis admin ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin/users"
            className="bg-white border border-violet-100 rounded-2xl p-5 hover:shadow-md transition group flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition">
              <Users size={22} className="text-violet-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Gérer les utilisateurs</p>
              <p className="text-gray-500 text-sm">
                {stats?.users?.total || 0} utilisateurs inscrits
              </p>
            </div>
          </Link>
          <Link
            to="/admin/courses"
            className="bg-white border border-violet-100 rounded-2xl p-5 hover:shadow-md transition group flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition">
              <BookOpen size={22} className="text-violet-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Gérer les cours</p>
              <p className="text-gray-500 text-sm">
                {stats?.courses?.total || 0} cours au total
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
