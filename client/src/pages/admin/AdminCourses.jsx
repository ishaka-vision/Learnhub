import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Search, Eye, ThumbsUp,
  ThumbsDown, Trash2, Users, Star,
  Filter, ChevronLeft, ChevronRight, AlertCircle
} from "lucide-react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { getCourseCategory, resolveMediaUrl } from "../../utils/media";

function StatusBadge({ status }) {
  const config = {
    draft:     { label: "Brouillon",   class: "bg-gray-100 text-gray-600" },
    pending:   { label: "En attente",  class: "bg-yellow-100 text-yellow-700" },
    published: { label: "Publié",      class: "bg-green-100 text-green-700" },
    rejected:  { label: "Rejeté",      class: "bg-red-100 text-red-600" },
  };
  const s = config[status] || config.draft;
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.class}`}>
      {s.label}
    </span>
  );
}

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const LIMIT = 12;

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage);
      params.set("limit", LIMIT);
      if (search) params.set("search", search);

      // Selon le filtre statut, utiliser l'endpoint approprié
      let res;
      if (selectedStatus === "pending") {
        res = await API.get("/admin/courses/pending");
        setCourses(res.data.data);
        setTotal(res.data.data.length);
      } else {
        res = await API.get(`/courses?${params.toString()}&status=${selectedStatus || "published"}`);
        setCourses(res.data.data);
        setTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, [search, selectedStatus, currentPage]);

  const handleApprove = async (courseId, action) => {
    let reason = undefined;
    if (action === "reject") {
      reason = window.prompt("Entrez la raison du rejet :");
      if (reason === null) return;
      if (!reason.trim()) {
        toast.error("La raison du rejet est obligatoire.");
        return;
      }
    }

    try {
      await API.patch(`/courses/${courseId}/approve`, { action, reason });
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      toast.success(action === "approve" ? "Cours publié !" : "Cours rejeté.");
    } catch {
      toast.error("Erreur lors de l'action.");
    }
  };

  const handleDelete = async (courseId) => {
    try {
      await API.delete(`/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      setTotal((prev) => prev - 1);
      setConfirmDelete(null);
      toast.success("Cours supprimé.");
    } catch {
      toast.error("Impossible de supprimer ce cours.");
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-violet-50">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-violet-900 to-purple-800 px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
            <BookOpen size={30} className="text-violet-300" />
            Gestion des cours
          </h1>
          <p className="text-violet-300 text-sm">
            {total} cours — gérez les publications et approbations
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Filtres ── */}
        <div className="bg-white rounded-2xl border border-violet-100 p-4 mb-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Rechercher un cours..."
              className="w-full pl-9 pr-4 py-2.5 border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "",          label: "Publiés" },
              { value: "pending",   label: "En attente" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setSelectedStatus(value); setCurrentPage(1); }}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  selectedStatus === value
                    ? "bg-violet-700 text-white"
                    : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Liste des cours ── */}
        <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-violet-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : courses.length > 0 ? (
            <>
              <div className="divide-y divide-gray-50">
                {courses.map((course) => (
                  <div
                    key={course._id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-violet-50 transition"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-purple-600 rounded-xl flex-shrink-0 overflow-hidden">
                      {course.thumbnail ? (
                        <img src={resolveMediaUrl(course.thumbnail)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen size={20} className="text-white opacity-50" />
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 text-sm line-clamp-1">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <StatusBadge status={course.status || "published"} />
                        <span className="text-xs text-violet-500 font-medium">
                          {getCourseCategory(course)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Users size={10} className="text-violet-400" />
                          {course.enrollmentCount || 0} inscrits
                        </span>
                        {course.averageRating > 0 && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            {course.averageRating.toFixed(1)}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          Par {course.instructor?.firstName} {course.instructor?.lastName}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/courses/${course._id}`}
                        className="flex items-center gap-1 bg-violet-100 text-violet-700 text-xs px-3 py-1.5 rounded-lg hover:bg-violet-200 transition font-semibold"
                      >
                        <Eye size={12} /> Voir
                      </Link>
                      {(course.status === "pending" || !course.status) && (
                        <>
                          <button
                            onClick={() => handleApprove(course._id, "approve")}
                            className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-lg hover:bg-green-200 transition font-semibold"
                          >
                            <ThumbsUp size={12} /> Approuver
                          </button>
                          <button
                            onClick={() => handleApprove(course._id, "reject")}
                            className="flex items-center gap-1 bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded-lg hover:bg-red-200 transition font-semibold"
                          >
                            <ThumbsDown size={12} /> Rejeter
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setConfirmDelete(course)}
                        className="flex items-center gap-1 bg-red-50 text-red-600 text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-semibold"
                      >
                        <Trash2 size={12} /> Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-violet-100">
                  <p className="text-sm text-gray-500">
                    Page {currentPage} sur {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-violet-200 hover:bg-violet-50 disabled:opacity-40 transition"
                    >
                      <ChevronLeft size={16} className="text-violet-600" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-violet-200 hover:bg-violet-50 disabled:opacity-40 transition"
                    >
                      <ChevronRight size={16} className="text-violet-600" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <BookOpen size={48} className="text-violet-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucun cours trouvé.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal suppression ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer ce cours ?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Vous allez supprimer définitivement{" "}
              <span className="font-semibold text-gray-800">"{confirmDelete.title}"</span>.
              Tous les modules et leçons seront supprimés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete._id)}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
