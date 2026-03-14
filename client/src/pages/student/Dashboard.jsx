import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Trophy, Star, Clock, CheckCircle,
  TrendingUp, Award, Play, BarChart2, Zap
} from "lucide-react";
import API from "../../services/api";
import useAuthStore from "../../context/authStore";
import { getCourseCategory, resolveMediaUrl } from "../../utils/media";

// ─── Composant : Carte stat ───────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-violet-100 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
        <Icon size={22} className="text-white" />
      </div>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      <p className="text-gray-500 text-sm font-medium mt-1">{label}</p>
      {sub && <p className="text-violet-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ─── Composant : Carte cours en cours ────────────────────────────────────────
function EnrollmentCard({ enrollment }) {
  const percent = enrollment.completionPercent || 0;
  return (
    <Link
      to={`/learn/${enrollment.course?._id}`}
      className="group bg-white rounded-2xl border border-violet-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
    >
      <div className="h-32 bg-gradient-to-br from-violet-500 to-purple-700 relative overflow-hidden">
        {enrollment.course?.thumbnail ? (
          <img
            src={resolveMediaUrl(enrollment.course.thumbnail)}
            alt={enrollment.course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={36} className="text-white opacity-30" />
          </div>
        )}
        {/* Badge complétion */}
        {percent === 100 && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle size={10} /> Terminé
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs text-violet-500 font-semibold mb-1">
          {getCourseCategory(enrollment.course)}
        </p>
        <h3 className="font-bold text-gray-800 text-sm line-clamp-2 mb-3 flex-1 group-hover:text-violet-700 transition-colors">
          {enrollment.course?.title}
        </h3>
        {/* Barre de progression */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progression</span>
            <span className="font-semibold text-violet-600">{percent}%</span>
          </div>
          <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/enrollments/my");
        setEnrollments(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculs dynamiques depuis les données réelles
  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.completionPercent === 100).length;
  const inProgressCourses = enrollments.filter(
    (e) => e.completionPercent > 0 && e.completionPercent < 100
  ).length;
  const avgProgress = totalCourses > 0
    ? Math.round(enrollments.reduce((acc, e) => acc + (e.completionPercent || 0), 0) / totalCourses)
    : 0;

  return (
    <div className="min-h-screen bg-violet-50">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-violet-900 to-purple-800 px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-violet-300 text-sm font-medium mb-1">Bonjour 👋</p>
              <h1 className="text-3xl font-black text-white">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-violet-300 mt-1 flex items-center gap-2">
                <Zap size={14} className="text-yellow-400" />
                <span className="font-bold text-yellow-400">{user?.totalPoints || 0}</span>
                points accumulés
              </p>
            </div>
            <Link
              to="/courses"
              className="bg-white text-violet-700 font-bold px-6 py-3 rounded-xl hover:bg-violet-50 transition flex items-center gap-2 shadow-lg"
            >
              <BookOpen size={18} />
              Découvrir des cours
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}
            label="Cours inscrits"
            value={totalCourses}
            color="bg-violet-600"
          />
          <StatCard
            icon={CheckCircle}
            label="Cours terminés"
            value={completedCourses}
            color="bg-green-500"
          />
          <StatCard
            icon={TrendingUp}
            label="En progression"
            value={inProgressCourses}
            color="bg-purple-600"
          />
          <StatCard
            icon={BarChart2}
            label="Progression moy."
            value={`${avgProgress}%`}
            color="bg-violet-800"
          />
        </div>

        {/* ── Badges ── */}
        {user?.badges?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-violet-100">
            <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-violet-600" />
              Mes badges
            </h2>
            <div className="flex flex-wrap gap-3">
              {user.badges.map((badge, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-violet-50 border border-violet-200 px-4 py-2 rounded-full"
                >
                  <Award size={16} className="text-violet-600" />
                  <span className="text-sm font-semibold text-violet-700">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Mes cours ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 text-xl flex items-center gap-2">
              <Play size={20} className="text-violet-600" />
              Mes cours
            </h2>
            <Link
              to="/courses"
              className="text-violet-600 text-sm font-semibold hover:text-violet-800 transition"
            >
              + Ajouter un cours
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-56 animate-pulse border border-violet-100" />
              ))}
            </div>
          ) : enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {enrollments.map((enrollment) => (
                <EnrollmentCard key={enrollment._id} enrollment={enrollment} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-violet-200">
              <BookOpen size={48} className="text-violet-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                Vous n'êtes inscrit à aucun cours
              </h3>
              <p className="text-gray-400 mb-6">
                Explorez notre catalogue et commencez à apprendre gratuitement.
              </p>
              <Link
                to="/courses"
                className="bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-violet-800 transition inline-flex items-center gap-2"
              >
                <BookOpen size={18} />
                Explorer le catalogue
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
