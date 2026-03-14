import { useEffect, useState } from "react";
import {
  Users, Search, Shield, GraduationCap,
  BookOpen, UserX, UserCheck, Trash2,
  ChevronLeft, ChevronRight, AlertCircle
} from "lucide-react";
import API from "../../services/api";
import toast from "react-hot-toast";

// ─── Badge rôle ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const config = {
    admin:      { label: "Admin",       class: "bg-violet-100 text-violet-700",  icon: Shield },
    instructor: { label: "Instructeur", class: "bg-purple-100 text-purple-700",  icon: BookOpen },
    student:    { label: "Étudiant",    class: "bg-indigo-100 text-indigo-700",  icon: GraduationCap },
  };
  const s = config[role] || config.student;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${s.class}`}>
      <Icon size={11} /> {s.label}
    </span>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const LIMIT = 15;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage);
      params.set("limit", LIMIT);
      if (search) params.set("search", search);
      if (selectedRole) params.set("role", selectedRole);

      const res = await API.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      toast.error("Erreur chargement utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, selectedRole, currentPage]);

  // Activer / Suspendre un compte
  const handleToggle = async (userId, currentStatus) => {
    try {
      await API.patch(`/admin/users/${userId}/toggle`);
      setUsers((prev) =>
        prev.map((u) => u._id === userId ? { ...u, isActive: !u.isActive } : u)
      );
      toast.success(currentStatus ? "Compte suspendu." : "Compte réactivé.");
    } catch {
      toast.error("Erreur lors de l'action.");
    }
  };

  // Supprimer un utilisateur
  const handleDelete = async (userId) => {
    try {
      await API.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setTotal((prev) => prev - 1);
      setConfirmDelete(null);
      toast.success("Utilisateur supprimé.");
    } catch {
      toast.error("Impossible de supprimer cet utilisateur.");
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-violet-50">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-violet-900 to-purple-800 px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
            <Users size={30} className="text-violet-300" />
            Gestion des utilisateurs
          </h1>
          <p className="text-violet-300 text-sm">
            {total} utilisateur{total > 1 ? "s" : ""} inscrits sur la plateforme
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Filtres ── */}
        <div className="bg-white rounded-2xl border border-violet-100 p-4 mb-6 flex flex-col md:flex-row gap-3">

          {/* Recherche */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Rechercher par nom ou email..."
              className="w-full pl-9 pr-4 py-2.5 border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {/* Filtre rôle */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "",           label: "Tous",          icon: Users },
              { value: "student",    label: "Étudiants",     icon: GraduationCap },
              { value: "instructor", label: "Instructeurs",  icon: BookOpen },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => { setSelectedRole(value); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  selectedRole === value
                    ? "bg-violet-700 text-white"
                    : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-violet-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-violet-50 border-b border-violet-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-bold text-violet-700 uppercase tracking-wide">Utilisateur</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-violet-700 uppercase tracking-wide hidden md:table-cell">Rôle</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-violet-700 uppercase tracking-wide hidden lg:table-cell">Points</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-violet-700 uppercase tracking-wide hidden lg:table-cell">Inscrit le</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-violet-700 uppercase tracking-wide">Statut</th>
                      <th className="text-right px-5 py-3 text-xs font-bold text-violet-700 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-violet-50 transition-colors">

                        {/* Avatar + Nom */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Rôle */}
                        <td className="px-5 py-4 hidden md:table-cell">
                          <RoleBadge role={user.role} />
                        </td>

                        {/* Points */}
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="text-sm font-semibold text-violet-600">
                            {user.totalPoints || 0} pts
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </td>

                        {/* Statut actif */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            user.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}>
                            {user.isActive ? (
                              <><UserCheck size={11} /> Actif</>
                            ) : (
                              <><UserX size={11} /> Suspendu</>
                            )}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {user.role !== "admin" && (
                              <>
                                <button
                                  onClick={() => handleToggle(user._id, user.isActive)}
                                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                                    user.isActive
                                      ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                      : "bg-green-100 text-green-700 hover:bg-green-200"
                                  }`}
                                >
                                  {user.isActive
                                    ? <><UserX size={12} /> Suspendre</>
                                    : <><UserCheck size={12} /> Activer</>
                                  }
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(user)}
                                  className="flex items-center gap-1 bg-red-50 text-red-600 text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-semibold"
                                >
                                  <Trash2 size={12} /> Supprimer
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-violet-100">
                  <p className="text-sm text-gray-500">
                    Page {currentPage} sur {totalPages} — {total} utilisateurs
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
              <Users size={48} className="text-violet-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucun utilisateur trouvé.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal confirmation suppression ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Supprimer cet utilisateur ?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Vous allez supprimer définitivement le compte de{" "}
              <span className="font-semibold text-gray-800">
                {confirmDelete.firstName} {confirmDelete.lastName}
              </span>
              . Cette action est irréversible.
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
