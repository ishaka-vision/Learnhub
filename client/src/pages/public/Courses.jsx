import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, Filter, Star, Users, BookOpen,
  ChevronDown, X, SlidersHorizontal, Award
} from "lucide-react";
import API from "../../services/api";
import { getCourseCategory, resolveMediaUrl } from "../../utils/media";

const LEVELS = [
  { value: "", label: "Tous niveaux" },
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
];

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Plus récents" },
  { value: "-enrollmentCount", label: "Plus populaires" },
  { value: "-averageRating", label: "Mieux notés" },
];

function CourseCard({ course }) {
  const levelLabels = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé" };
  const levelColors = {
    beginner: "bg-green-100 text-green-700",
    intermediate: "bg-violet-100 text-violet-700",
    advanced: "bg-orange-100 text-orange-700",
  };

  return (
    <Link
      to={`/courses/${course._id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-violet-100 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-gradient-to-br from-violet-500 to-purple-700 overflow-hidden flex-shrink-0">
        {course.thumbnail ? (
          <img
            src={resolveMediaUrl(course.thumbnail)}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={48} className="text-white opacity-30" />
          </div>
        )}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full ${levelColors[course.level]}`}>
          {levelLabels[course.level]}
        </span>
        {course.averageRating >= 4.5 && (
          <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Award size={10} /> Top
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs text-violet-500 font-semibold uppercase tracking-wide mb-1">
          {getCourseCategory(course)}
        </p>
        <h3 className="font-bold text-gray-800 text-base leading-snug mb-2 line-clamp-2 group-hover:text-violet-700 transition-colors flex-1">
          {course.title}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users size={12} className="text-violet-400" />
            {course.enrollmentCount} inscrits
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={12} className="text-violet-400" />
            {course.modules?.length || 0} modules
          </span>
        </div>

        {/* Instructeur + Note */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-white text-xs font-bold">
              {course.instructor?.firstName?.[0]}{course.instructor?.lastName?.[0]}
            </div>
            <span className="text-xs text-gray-500">
              {course.instructor?.firstName} {course.instructor?.lastName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={13} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-gray-700">
              {course.averageRating > 0 ? course.averageRating.toFixed(1) : "Nouveau"}
            </span>
            {course.reviewCount > 0 && (
              <span className="text-xs text-gray-400">({course.reviewCount})</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function CourseSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-violet-100 animate-pulse">
      <div className="h-44 bg-violet-100" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-violet-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-8 bg-gray-50 rounded mt-4" />
      </div>
    </div>
  );
}

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });

  // Filtres depuis l'URL
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedLevel, setSelectedLevel] = useState(searchParams.get("level") || "");
  const [selectedSort, setSelectedSort] = useState(searchParams.get("sort") || "-createdAt");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Charger les catégories disponibles depuis l'API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get("/courses?limit=100");
        const cats = [...new Set(res.data.data.map((c) => getCourseCategory(c)))].filter(Boolean);
        setCategories(cats);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Charger les cours avec filtres
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", currentPage);
        params.set("limit", "12");
        params.set("sort", selectedSort);
        if (search) params.set("search", search);
        if (selectedCategory) params.set("category", selectedCategory);
        if (selectedLevel) params.set("level", selectedLevel);

        const res = await API.get(`/courses?${params.toString()}`);
        setCourses(res.data.data);
        setPagination(res.data.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [search, selectedCategory, selectedLevel, selectedSort, currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedLevel("");
    setSelectedSort("-createdAt");
    setCurrentPage(1);
  };

  const hasActiveFilters = search || selectedCategory || selectedLevel || selectedSort !== "-createdAt";

  return (
    <div className="min-h-screen bg-violet-50">

      {/* ── En-tête de page ── */}
      <div className="bg-gradient-to-r from-violet-900 to-purple-800 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-black text-white mb-3 flex items-center gap-3">
            <BookOpen size={36} className="text-violet-300" />
            Catalogue des cours
          </h1>
          <p className="text-violet-200 text-lg">
            {pagination.total > 0
              ? `${pagination.total} cours disponibles — apprenez à votre rythme`
              : "Explorez tous nos cours gratuits"}
          </p>

          {/* Barre de recherche */}
          <form onSubmit={handleSearch} className="mt-8 flex gap-3 max-w-2xl">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un cours, une technologie..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white bg-opacity-10 border border-violet-500 text-white placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-opacity-20"
              />
            </div>
            <button
              type="submit"
              className="bg-white text-violet-700 font-bold px-6 py-3 rounded-xl hover:bg-violet-50 transition"
            >
              Rechercher
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Barre de filtres latérale ── */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-violet-100 p-5 sticky top-20">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-violet-600" />
                  Filtres
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <X size={12} /> Effacer
                  </button>
                )}
              </div>

              {/* Filtre Catégorie */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Catégorie
                </label>
                <div className="space-y-1">
                  <button
                    onClick={() => { setSelectedCategory(""); setCurrentPage(1); }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                      !selectedCategory
                        ? "bg-violet-100 text-violet-700 font-semibold"
                        : "text-gray-600 hover:bg-violet-50"
                    }`}
                  >
                    Toutes les catégories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                        selectedCategory === cat
                          ? "bg-violet-100 text-violet-700 font-semibold"
                          : "text-gray-600 hover:bg-violet-50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre Niveau */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Niveau
                </label>
                <div className="space-y-1">
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl.value}
                      onClick={() => { setSelectedLevel(lvl.value); setCurrentPage(1); }}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                        selectedLevel === lvl.value
                          ? "bg-violet-100 text-violet-700 font-semibold"
                          : "text-gray-600 hover:bg-violet-50"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tri */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Trier par
                </label>
                <div className="space-y-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSelectedSort(opt.value); setCurrentPage(1); }}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                        selectedSort === opt.value
                          ? "bg-violet-100 text-violet-700 font-semibold"
                          : "text-gray-600 hover:bg-violet-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ── Grille de cours ── */}
          <div className="flex-1">

            {/* Résultats header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 text-sm">
                {loading ? "Chargement..." : (
                  <>
                    <span className="font-bold text-violet-700">{pagination.total}</span> cours trouvés
                    {selectedCategory && <span className="ml-1">dans <span className="font-semibold">{selectedCategory}</span></span>}
                  </>
                )}
              </p>
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedCategory && (
                    <span className="bg-violet-100 text-violet-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      {selectedCategory}
                      <button onClick={() => setSelectedCategory("")}><X size={10} /></button>
                    </span>
                  )}
                  {selectedLevel && (
                    <span className="bg-violet-100 text-violet-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      {LEVELS.find(l => l.value === selectedLevel)?.label}
                      <button onClick={() => setSelectedLevel("")}><X size={10} /></button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Cours */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => <CourseSkeleton key={i} />)}
              </div>
            ) : courses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <CourseCard key={course._id} course={course} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl font-semibold text-sm transition ${
                          currentPage === i + 1
                            ? "bg-violet-700 text-white"
                            : "bg-white text-gray-600 border border-violet-200 hover:bg-violet-50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-violet-200">
                <BookOpen size={48} className="text-violet-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  Aucun cours trouvé
                </h3>
                <p className="text-gray-500 mb-6">
                  {hasActiveFilters
                    ? "Essayez de modifier vos filtres."
                    : "Aucun cours publié pour l'instant."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-800 transition"
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
