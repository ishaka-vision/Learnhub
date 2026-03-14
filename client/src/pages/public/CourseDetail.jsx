import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star, Users, BookOpen, Clock, Award, ChevronDown,
  ChevronUp, Play, CheckCircle, Lock, ArrowLeft,
  User, MessageSquare, ThumbsUp
} from "lucide-react";
import API from "../../services/api";
import useAuthStore from "../../context/authStore";
import toast from "react-hot-toast";
import RichTextContent from "../../components/common/RichTextContent";
import { getCourseCategory, resolveMediaUrl } from "../../utils/media";

// ─── Composant : Étoiles interactives ────────────────────────────────────────
function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <Star
            size={24}
            className={`transition-colors ${
              star <= (hover || value)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Composant : Module accordéon ────────────────────────────────────────────
function getEmbedUrl(url) {
  if (!url) return null;
  if (url.includes("youtube.com/watch")) {
    const id = url.split("v=")[1]?.split("&")[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (url.includes("vimeo.com/")) {
    const id = url.split("vimeo.com/")[1]?.split("?")[0];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return url;
}

function ModuleAccordion({ module, index, canPreviewContent = false }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="border border-violet-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-violet-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center text-sm font-bold">
            {index + 1}
          </div>
          <span className="font-semibold text-gray-800">{module.title}</span>
          <span className="text-xs text-gray-400">
            {module.lessons?.length || 0} leçon{module.lessons?.length > 1 ? "s" : ""}
          </span>
        </div>
        {open
          ? <ChevronUp size={18} className="text-violet-500" />
          : <ChevronDown size={18} className="text-violet-500" />
        }
      </button>
      {open && (
        <div className="border-t border-violet-100 divide-y divide-gray-50">
          {module.lessons?.map((lesson) => (
            <div key={lesson._id} className="px-5 py-3 bg-gray-50">
              <div className="flex items-center gap-3">
                <Play size={14} className="text-violet-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1">{lesson.title}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={11} />
                  {lesson.duration || 10} min
                </span>
                {canPreviewContent ? (
                  <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">
                    Contenu visible
                  </span>
                ) : (
                  <Lock size={13} className="text-gray-300 flex-shrink-0" />
                )}
              </div>

              {canPreviewContent && lesson.blocks?.length > 0 && (
                <div className="mt-3 space-y-3 border-t border-violet-100 pt-3">
                  {lesson.blocks
                    .slice()
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((block, blockIndex) => {
                      if (block.type === "video") {
                        const embedUrl = getEmbedUrl(block.videoUrl);
                        return (
                          <div key={`${lesson._id}-video-${blockIndex}`} className="rounded-lg overflow-hidden border border-violet-200 bg-white">
                            <div className="px-3 py-2 text-xs font-semibold text-violet-700 bg-violet-50">
                              {block.videoTitle || "Vidéo"}
                            </div>
                            {embedUrl ? (
                              <div className="aspect-video">
                                <iframe
                                  src={embedUrl}
                                  className="w-full h-full"
                                  allowFullScreen
                                  title={block.videoTitle || "Vidéo"}
                                />
                              </div>
                            ) : (
                              <div className="px-3 py-2 text-xs text-gray-400">URL vidéo invalide</div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={`${lesson._id}-text-${blockIndex}`} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                            {block.type || "contenu"}
                          </p>
                          <RichTextContent text={block.content} className="text-sm text-gray-700 leading-relaxed space-y-2" />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [distribution, setDistribution] = useState({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Formulaire review
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Charger le cours
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await API.get(`/courses/${id}`);
        setCourse(res.data.data);
        setIsEnrolled(res.data.isEnrolled || false);
      } catch {
        toast.error("Cours introuvable.");
        navigate("/courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  // Charger les reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await API.get(`/reviews/course/${id}`);
        setReviews(res.data.data);
        setDistribution(res.data.distribution || {});
      } catch (err) {
        console.error(err);
      }
    };
    fetchReviews();
  }, [id]);

  // S'inscrire au cours
  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour vous inscrire !");
      navigate("/login");
      return;
    }
    setEnrolling(true);
    try {
      await API.post(`/enrollments/${id}`);
      setIsEnrolled(true);
      setCourse((prev) => ({ ...prev, enrollmentCount: (prev.enrollmentCount || 0) + 1 }));
      toast.success("Inscription réussie ! Bonne formation 🎉");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setEnrolling(false);
    }
  };

  // Soumettre une review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (myRating === 0) {
      toast.error("Veuillez choisir une note.");
      return;
    }
    setSubmittingReview(true);
    try {
      await API.post(`/reviews/course/${id}`, { rating: myRating, comment: myComment });
      toast.success("Avis publié avec succès !");
      // Recharger les reviews
      const res = await API.get(`/reviews/course/${id}`);
      setReviews(res.data.data);
      setDistribution(res.data.distribution || {});
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-violet-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const canPreviewContent = user?.role === "admin" || user?.role === "instructor" || isEnrolled;
  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const totalDuration = course.modules?.reduce((acc, m) =>
    acc + (m.lessons?.reduce((a, l) => a + (l.duration || 10), 0) || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-violet-50">

      {/* ── Header du cours ── */}
      <div className="bg-gradient-to-br from-violet-950 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-violet-300 hover:text-white mb-6 transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Retour au catalogue
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Info gauche */}
            <div className="lg:col-span-2">
              <span className="inline-block bg-violet-700 text-violet-200 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                {getCourseCategory(course)}
              </span>
              <h1 className="text-3xl lg:text-4xl font-black mb-4 leading-tight">
                {course.title}
              </h1>
              <p className="text-violet-200 text-lg leading-relaxed mb-6">
                {course.description}
              </p>

              {/* Méta-données */}
              <div className="flex flex-wrap gap-5 text-sm text-violet-200">
                <span className="flex items-center gap-2">
                  <Star size={15} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold">
                    {course.averageRating > 0 ? course.averageRating.toFixed(1) : "Nouveau"}
                  </span>
                  {course.reviewCount > 0 && `(${course.reviewCount} avis)`}
                </span>
                <span className="flex items-center gap-2">
                  <Users size={15} className="text-violet-300" />
                  {course.enrollmentCount} inscrits
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen size={15} className="text-violet-300" />
                  {totalLessons} leçons
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={15} className="text-violet-300" />
                  {Math.round(totalDuration / 60)}h{totalDuration % 60 > 0 ? ` ${totalDuration % 60}min` : ""}
                </span>
              </div>

              {/* Instructeur */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-violet-700">
                <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold">
                  {course.instructor?.firstName?.[0]}{course.instructor?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-xs text-violet-300">Instructeur</p>
                  <p className="font-semibold">
                    {course.instructor?.firstName} {course.instructor?.lastName}
                  </p>
                </div>
              </div>
            </div>

            {/* Carte d'inscription droite */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-2xl text-gray-800 sticky top-20">
                {/* Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-violet-400 to-purple-600 rounded-xl mb-5 overflow-hidden">
                  {course.thumbnail ? (
                    <img src={resolveMediaUrl(course.thumbnail)} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={40} className="text-white opacity-40" />
                    </div>
                  )}
                </div>

                <p className="text-3xl font-black text-violet-700 mb-1">Gratuit</p>
                <p className="text-gray-500 text-sm mb-5">Accès à vie · Certificat inclus</p>

                {isEnrolled ? (
                  <Link
                    to={`/learn/${course._id}`}
                    className="w-full bg-violet-700 text-white py-3 px-4 rounded-xl font-bold hover:bg-violet-800 transition flex items-center justify-center gap-2"
                  >
                    <Play size={18} /> Continuer le cours
                  </Link>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full bg-violet-700 text-white py-3 px-4 rounded-xl font-bold hover:bg-violet-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {enrolling ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Award size={18} /> S'inscrire gratuitement
                      </>
                    )}
                  </button>
                )}

                <div className="mt-5 space-y-2 text-sm text-gray-600">
                  {[
                    { icon: CheckCircle, text: "Accès illimité à tous les contenus" },
                    { icon: CheckCircle, text: "Exercices pratiques corrigés" },
                    { icon: CheckCircle, text: "Certificat de complétion" },
                    { icon: CheckCircle, text: "Communauté d'apprenants" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2">
                      <Icon size={14} className="text-violet-500 flex-shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Corps de la page ── */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">

          {/* Ce que vous apprendrez */}
          {course.whatYouWillLearn?.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-violet-100">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Award size={20} className="text-violet-600" />
                Ce que vous apprendrez
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.whatYouWillLearn.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Programme du cours */}
          <div className="bg-white rounded-2xl p-6 border border-violet-100">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <BookOpen size={20} className="text-violet-600" />
              Programme du cours
              <span className="text-sm font-normal text-gray-500 ml-2">
                {course.modules?.length} modules · {totalLessons} leçons · {totalDuration} min
              </span>
            </h2>
            <div className="space-y-3">
              {course.modules?.length > 0 ? (
                course.modules.map((module, i) => (
                  <ModuleAccordion key={module._id} module={module} index={i} canPreviewContent={canPreviewContent} />
                ))
              ) : (
                <p className="text-gray-400 text-center py-6">
                  Le programme sera bientôt disponible.
                </p>
              )}
            </div>
          </div>

          {/* Section Reviews */}
          <div className="bg-white rounded-2xl p-6 border border-violet-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Star size={20} className="text-violet-600" />
              Avis des étudiants
            </h2>

            {/* Résumé des notes */}
            {course.reviewCount > 0 && (
              <div className="flex flex-col md:flex-row gap-6 mb-8 p-5 bg-violet-50 rounded-xl">
                <div className="text-center flex-shrink-0">
                  <div className="text-6xl font-black text-violet-700">
                    {course.averageRating.toFixed(1)}
                  </div>
                  <StarRating value={Math.round(course.averageRating)} readonly />
                  <p className="text-gray-500 text-sm mt-1">{course.reviewCount} avis</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = distribution[star] || 0;
                    const percent = course.reviewCount > 0
                      ? Math.round((count / course.reviewCount) * 100)
                      : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-3">{star}</span>
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formulaire review (étudiant inscrit seulement) */}
            {isAuthenticated && isEnrolled && user?.role === "student" && (
              <div className="mb-8 p-5 bg-violet-50 rounded-xl border border-violet-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MessageSquare size={16} className="text-violet-600" />
                  Laisser votre avis
                </h3>
                <form onSubmit={handleReviewSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-2">Votre note</label>
                    <StarRating value={myRating} onChange={setMyRating} />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-2">
                      Commentaire (optionnel)
                    </label>
                    <textarea
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      rows={3}
                      placeholder="Partagez votre expérience avec ce cours..."
                      className="w-full border border-violet-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview || myRating === 0}
                    className="bg-violet-700 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-violet-800 disabled:opacity-50 transition"
                  >
                    {submittingReview ? "Publication..." : "Publier l'avis"}
                  </button>
                </form>
              </div>
            )}

            {/* Liste des reviews */}
            <div className="space-y-5">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-100 pb-5 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {review.student?.firstName?.[0]}{review.student?.lastName?.[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-800 text-sm">
                            {review.student?.firstName} {review.student?.lastName}
                          </p>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <StarRating value={review.rating} readonly />
                        {review.comment && (
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                        {/* Réponse instructeur */}
                        {review.instructorReply && (
                          <div className="mt-3 pl-4 border-l-4 border-violet-300 bg-violet-50 p-3 rounded-r-lg">
                            <p className="text-xs font-bold text-violet-700 mb-1 flex items-center gap-1">
                              <User size={11} /> Réponse de l'instructeur
                            </p>
                            <p className="text-sm text-gray-600">{review.instructorReply}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare size={32} className="mx-auto mb-2 text-violet-200" />
                  <p>Aucun avis pour l'instant. Soyez le premier !</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar — Prérequis */}
        <div className="lg:col-span-1">
          {course.requirements?.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-violet-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-violet-600" />
                Prérequis
              </h3>
              <ul className="space-y-2">
                {course.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mt-2 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
