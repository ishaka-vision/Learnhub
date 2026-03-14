import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import { getCourseCategory, resolveMediaUrl } from "../../utils/media";

// ─── Composant : Carte de cours ───────────────────────────────────────────────
function CourseCard({ course }) {
  const levelLabels = {
    beginner: "Débutant",
    intermediate: "Intermédiaire",
    advanced: "Avancé",
  };
  const levelColors = {
    beginner: "bg-green-100 text-green-700",
    intermediate: "bg-violet-100 text-violet-700",
    advanced: "bg-orange-100 text-orange-700",
  };

  return (
    <Link
      to={`/courses/${course._id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-violet-100"
    >
      {/* Image de couverture */}
      <div className="relative h-44 bg-gradient-to-br from-violet-400 to-purple-600 overflow-hidden">
        {course.thumbnail ? (
          <img
            src={resolveMediaUrl(course.thumbnail)}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">
            📚
          </div>
        )}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full ${levelColors[course.level]}`}>
          {levelLabels[course.level]}
        </span>
      </div>

      {/* Contenu de la carte */}
      <div className="p-5">
        <p className="text-xs text-violet-500 font-semibold uppercase tracking-wide mb-1">
          {getCourseCategory(course)}
        </p>
        <h3 className="font-bold text-gray-800 text-base leading-snug mb-2 line-clamp-2 group-hover:text-violet-700 transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Instructeur + Note */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
              {course.instructor?.firstName?.[0]}{course.instructor?.lastName?.[0]}
            </div>
            <span className="text-xs text-gray-500">
              {course.instructor?.firstName} {course.instructor?.lastName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">★</span>
            <span className="text-xs font-semibold text-gray-700">
              {course.averageRating > 0
                ? course.averageRating.toFixed(1)
                : "Nouveau"}
            </span>
            {course.reviewCount > 0 && (
              <span className="text-xs text-gray-400">
                ({course.reviewCount})
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Composant : Skeleton de chargement ──────────────────────────────────────
function CourseSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-violet-100 animate-pulse">
      <div className="h-44 bg-violet-100" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-violet-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
      </div>
    </div>
  );
}

// ─── PAGE HOME ────────────────────────────────────────────────────────────────
export default function Home() {
  const [popularCourses, setPopularCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Charger les cours populaires (triés par inscriptions)
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await API.get("/courses?limit=6&sort=-enrollmentCount");
        setPopularCourses(res.data.data);

        // Extraire les catégories uniques des cours reçus
        const cats = [...new Set(res.data.data.map((c) => getCourseCategory(c)))];
        setCategories(cats);
      } catch (err) {
        console.error("Erreur chargement cours:", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Charger les statistiques globales (nombre d'étudiants, cours, etc.)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/admin/stats");
        setStats(res.data.data);
      } catch {
        // Les stats ne sont visibles que si connecté en admin
        // On met des valeurs vides sinon
        setStats(null);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="bg-white">

      {}
      <section className="relative min-h-screen bg-gradient-to-br from-violet-950 via-violet-800 to-purple-700 overflow-hidden flex items-center">

        {/* Cercles décoratifs */}
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-violet-500 opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-150px] left-[-100px] w-[600px] h-[600px] bg-purple-400 opacity-10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Colonne gauche — texte */}
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-800 bg-opacity-60 border border-violet-500 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-violet-200 text-sm font-medium">
                Plateforme d'apprentissage 100% gratuite
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Apprenez sans{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-pink-300">
                limites
              </span>
              , progressez sans frontières
            </h1>

            <p className="text-violet-200 text-xl leading-relaxed mb-10 max-w-xl">
              Des cours professionnels avec vidéos intégrées, exercices pratiques
              corrigés et système de points — entièrement gratuit.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link
                to="/register"
                className="bg-white text-violet-700 font-bold px-8 py-4 rounded-xl hover:bg-violet-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg"
              >
                Commencer gratuitement →
              </Link>
              <Link
                to="/courses"
                className="border-2 border-violet-400 text-white font-semibold px-8 py-4 rounded-xl hover:bg-violet-800 transition-all duration-200 text-lg"
              >
                Explorer les cours
              </Link>
            </div>
          </div>

          {/* Colonne droite — cartes dynamiques */}
          <div className="hidden lg:flex flex-col gap-4 items-end">

            {/* Carte : stats dynamiques */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 w-80 shadow-2xl">
              <p className="text-violet-200 text-sm font-semibold mb-4 uppercase tracking-wide">
                Plateforme en chiffres
              </p>
              {loadingStats ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-violet-700 rounded" />
                  ))}
                </div>
              ) : stats ? (
                <div className="space-y-3">
                  {[
                    { label: "Étudiants inscrits", value: stats.users?.students || 0 },
                    { label: "Cours publiés", value: stats.courses?.published || 0 },
                    { label: "Instructeurs", value: stats.users?.instructors || 0 },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className="text-violet-300 text-sm">{item.label}</span>
                      <span className="text-white font-bold text-lg">{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {["Rejoignez la communauté", "Apprenez à votre rythme", "100% gratuit"].map((txt) => (
                    <div key={txt} className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span className="text-violet-200 text-sm">{txt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Carte : dernier cours populaire dynamique */}
            {!loadingCourses && popularCourses.length > 0 && (
              <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-2xl p-4 w-72 flex items-center gap-3">
                <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  📚
                </div>
                <div className="overflow-hidden">
                  <p className="text-white text-sm font-semibold truncate">
                    {popularCourses[0].title}
                  </p>
                  <p className="text-violet-300 text-xs">
                    {popularCourses[0].enrollmentCount} inscrits
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vague de séparation */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 55 720 0 0 40L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS DYNAMIQUES
      ══════════════════════════════════════════ */}
      {stats && (
        <section className="bg-gradient-to-r from-violet-800 to-purple-700 py-14">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: stats.users?.total || 0, label: "Utilisateurs" },
              { value: stats.courses?.published || 0, label: "Cours publiés" },
              { value: stats.enrollments?.total || 0, label: "Inscriptions" },
              { value: stats.users?.instructors || 0, label: "Instructeurs" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-violet-200 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          FONCTIONNALITÉS DE LA PLATEFORME
          (ces infos décrivent la plateforme,
          pas du contenu BD — c'est ok static)
      ══════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-violet-100 text-violet-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
              Pourquoi LearnHub ?
            </span>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Une expérience d'apprentissage{" "}
              <span className="text-violet-700">unique</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Nous combinons le meilleur de Coursera, OpenClassrooms et bien plus,
              dans une plateforme entièrement gratuite.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "📖", title: "Théorie + Vidéo intégrée", desc: "Les vidéos s'intègrent directement dans les leçons entre les paragraphes. Comme OpenClassrooms, mais en mieux.", gradient: "from-violet-500 to-purple-600" },
              { icon: "💡", title: "Exemples remarquables", desc: "Les instructeurs mettent en valeur leurs exemples clés dans des blocs visuels distinctifs — impossible à manquer.", gradient: "from-purple-500 to-pink-500" },
              { icon: "✏️", title: "Exercices corrigés", desc: "Soumettez vos exercices et recevez une correction personnalisée de votre instructeur avec des points.", gradient: "from-violet-600 to-indigo-600" },
              { icon: "🏆", title: "Système de points", desc: "Gagnez des points à chaque leçon, quiz et exercice. Débloquez des badges et suivez votre progression.", gradient: "from-amber-500 to-orange-500" },
              { icon: "⭐", title: "Reviews & Notation", desc: "Notez les cours de 1 à 5 étoiles. Les meilleurs cours remontent naturellement dans le catalogue.", gradient: "from-yellow-500 to-amber-500" },
              { icon: "🚀", title: "100% Gratuit", desc: "Aucun abonnement, aucun frais caché. Tous les cours, exercices et certifications sont gratuits pour toujours.", gradient: "from-green-500 to-teal-500" },
            ].map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${f.gradient} rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CATÉGORIES DYNAMIQUES
          (extraites des vrais cours en BD)
      ══════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="py-24 bg-violet-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="inline-block bg-violet-100 text-violet-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
                Nos domaines
              </span>
              <h2 className="text-4xl font-black text-gray-900">
                Explorez par catégorie
              </h2>
              <p className="text-gray-500 mt-3">
                {categories.length} catégorie{categories.length > 1 ? "s" : ""} disponible{categories.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat) => {
                // Compter les cours de cette catégorie
                const count = popularCourses.filter((c) => c.category === cat).length;
                return (
                  <Link
                    key={cat}
                    to={`/courses?category=${encodeURIComponent(cat)}`}
                    className="group bg-white rounded-2xl p-5 text-center hover:bg-violet-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-violet-100"
                  >
                    <p className="text-gray-800 font-semibold text-sm group-hover:text-white transition-colors">
                      {cat}
                    </p>
                    {count > 0 && (
                      <p className="text-gray-400 text-xs mt-1 group-hover:text-violet-200 transition-colors">
                        {count} cours
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          COURS POPULAIRES DYNAMIQUES
      ══════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-14">
            <div>
              <span className="inline-block bg-violet-100 text-violet-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
                Tendances
              </span>
              <h2 className="text-4xl font-black text-gray-900">
                Cours populaires
              </h2>
            </div>
            <Link
              to="/courses"
              className="hidden md:flex items-center gap-2 text-violet-600 font-semibold hover:gap-3 transition-all"
            >
              Voir tout →
            </Link>
          </div>

          {/* Chargement */}
          {loadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <CourseSkeleton key={i} />)}
            </div>

          /* Cours chargés */
          ) : popularCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>

          /* Aucun cours encore — invitation à créer */
          ) : (
            <div className="text-center py-20 bg-violet-50 rounded-3xl border-2 border-dashed border-violet-200">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                Aucun cours publié pour l'instant
              </h3>
              <p className="text-gray-500 mb-6">
                Les instructeurs n'ont pas encore publié de cours.
                Soyez le premier !
              </p>
              <Link
                to="/register"
                className="bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-violet-800 transition"
              >
                Devenir instructeur →
              </Link>
            </div>
          )}

          {popularCourses.length > 0 && (
            <div className="text-center mt-10">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 bg-violet-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-violet-800 transition hover:shadow-lg hover:-translate-y-0.5"
              >
                Voir tous les cours →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COMMENT ÇA MARCHE
      ══════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-br from-violet-950 to-purple-900">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-violet-800 text-violet-200 text-sm font-semibold px-4 py-2 rounded-full mb-4">
              Simple et rapide
            </span>
            <h2 className="text-4xl font-black text-white">
              Comment ça marche ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: "🔐", title: "Créez un compte", desc: "Inscription gratuite en 30 secondes. Choisissez votre rôle : étudiant ou instructeur." },
              { step: "02", icon: "🎯", title: "Choisissez un cours", desc: "Parcourez le catalogue, filtrez par catégorie et inscrivez-vous en un clic." },
              { step: "03", icon: "🚀", title: "Apprenez & Progressez", desc: "Suivez les leçons, faites les exercices, gagnez des points et obtenez votre certificat." },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="w-20 h-20 bg-violet-800 border-2 border-violet-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 group-hover:bg-violet-700 group-hover:scale-110 transition-all duration-300">
                  {item.icon}
                </div>
                <span className="text-violet-400 text-xs font-bold tracking-widest">
                  ÉTAPE {item.step}
                </span>
                <h3 className="text-white font-bold text-xl mt-2 mb-3">{item.title}</h3>
                <p className="text-violet-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-br from-violet-700 to-purple-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500 opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-400 opacity-20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
            Prêt à transformer votre avenir ?
          </h2>
          <p className="text-violet-200 text-lg mb-10 leading-relaxed">
            Rejoignez des milliers d'apprenants qui ont déjà fait confiance
            à LearnHub pour développer leurs compétences.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-violet-700 font-bold px-10 py-4 rounded-xl text-lg hover:bg-violet-50 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Rejoindre gratuitement →
            </Link>
            <Link
              to="/courses"
              className="border-2 border-violet-300 text-white font-semibold px-10 py-4 rounded-xl text-lg hover:bg-violet-800 transition-all"
            >
              Parcourir les cours
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="bg-violet-950 text-violet-300 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <h3 className="text-2xl font-black text-white mb-3">
                Learn<span className="text-violet-400">Hub</span>
              </h3>
              <p className="text-sm leading-relaxed text-violet-400">
                La plateforme d'apprentissage gratuite qui donne accès
                aux meilleures compétences du monde.
              </p>
            </div>
            {[
              {
                title: "Apprendre",
                links: ["Catalogue des cours", "Catégories", "Instructeurs"],
              },
              {
                title: "Enseigner",
                links: ["Devenir instructeur", "Créer un cours", "Guide pédagogique"],
              },
              {
                title: "Plateforme",
                links: ["À propos", "Contact", "Politique de confidentialité"],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-bold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link
                        to="/courses"
                        className="text-sm text-violet-400 hover:text-violet-200 transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-violet-800 pt-6 text-center text-violet-500 text-sm">
            © 2026 LearnHub — Fait avec 💜 pour l'éducation universelle.
          </div>
        </div>
      </footer>

    </div>
  );
}
