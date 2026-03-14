import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, CheckCircle, Circle,
  Play, FileText, Lightbulb, AlertTriangle, PenTool,
  HelpCircle, BookOpen, Menu, X, Trophy, Clock,
  Send, ArrowLeft, Award, Star
} from "lucide-react";
import API from "../../services/api";
import useAuthStore from "../../context/authStore";
import toast from "react-hot-toast";
import RichTextContent from "../../components/common/RichTextContent";

// ─── Styles des blocs de contenu ─────────────────────────────────────────────
const BLOCK_CONFIGS = {
  text: {
    wrapper: "bg-white border border-gray-100 rounded-xl p-6",
    header: null,
  },
  video: {
    wrapper: "bg-violet-50 border border-violet-200 rounded-xl overflow-hidden",
    header: { icon: Play, label: "Vidéo", class: "bg-violet-600 text-white px-4 py-2 flex items-center gap-2 text-sm font-semibold" },
  },
  example: {
    wrapper: "bg-purple-50 border-l-4 border-purple-500 rounded-r-xl p-6",
    header: { icon: Lightbulb, label: "Exemple remarquable", class: "flex items-center gap-2 text-purple-700 font-bold text-sm mb-3" },
  },
  note: {
    wrapper: "bg-orange-50 border-l-4 border-orange-400 rounded-r-xl p-6",
    header: { icon: AlertTriangle, label: "Note importante", class: "flex items-center gap-2 text-orange-700 font-bold text-sm mb-3" },
  },
  exercise: {
    wrapper: "bg-green-50 border border-green-200 rounded-xl p-6",
    header: { icon: PenTool, label: "Exercice pratique", class: "flex items-center gap-2 text-green-700 font-bold text-sm mb-3" },
  },
  quiz: {
    wrapper: "bg-blue-50 border border-blue-200 rounded-xl p-6",
    header: { icon: HelpCircle, label: "Quiz", class: "flex items-center gap-2 text-blue-700 font-bold text-sm mb-3" },
  },
};

// ─── Composant : Rendu d'un bloc vidéo ───────────────────────────────────────
function VideoBlock({ block }) {
  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("youtube.com/watch")) {
      const id = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("vimeo.com/")) {
      const id = url.split("vimeo.com/")[1];
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(block.videoUrl);

  return (
    <div className={BLOCK_CONFIGS.video.wrapper}>
      <div className={BLOCK_CONFIGS.video.header.class}>
        <Play size={14} />
        {block.videoTitle || "Vidéo"}
      </div>
      {embedUrl ? (
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={block.videoTitle || "Vidéo"}
          />
        </div>
      ) : (
        <div className="p-4 text-center text-gray-400 text-sm">
          URL de vidéo invalide.
        </div>
      )}
    </div>
  );
}

// ─── Composant : Bloc d'exercice avec soumission ─────────────────────────────
function ExerciseBlock({ block, courseId }) {
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mySubmission, setMySubmission] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);

  const exerciseId = block.exercise?._id || block.exercise;

  // Charger la soumission existante de l'étudiant
  useEffect(() => {
    if (!exerciseId || !courseId) {
      setLoadingSub(false);
      return;
    }
    const fetchSub = async () => {
      try {
        const res = await API.get(`/exercises/my/${courseId}`);
        const sub = res.data.data.find(
          (s) => s.exercise?._id === exerciseId || s.exercise === exerciseId
        );
        if (sub) setMySubmission(sub);
      } catch { /* pas de soumission */ }
      finally { setLoadingSub(false); }
    };
    fetchSub();
  }, [exerciseId, courseId]);

  const handleSubmit = async () => {
    if (!exerciseId) {
      toast.error("Aucun exercice associé à ce bloc.");
      return;
    }
    if (!answer.trim() && !file) {
      toast.error("Entrez une réponse ou joignez un fichier.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else {
        formData.append("answer", answer);
      }

      const res = await API.post(`/exercises/${exerciseId}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMySubmission(res.data.data);
      toast.success("Exercice soumis ! L'instructeur va le corriger.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la soumission.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSub) {
    return (
      <div className={BLOCK_CONFIGS.exercise.wrapper}>
        <div className="animate-pulse h-20 bg-green-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div className={BLOCK_CONFIGS.exercise.wrapper}>
      <div className={BLOCK_CONFIGS.exercise.header.class}>
        <PenTool size={15} />
        Exercice pratique
      </div>

      {/* Instructions */}
      {block.content && (
        <RichTextContent
          text={block.content}
          className="text-gray-700 text-sm leading-relaxed mb-4 space-y-2"
        />
      )}

      {/* Exercice texte simple (sans ressource Exercise liée) */}
      {!exerciseId && (
        <div className="bg-white rounded-xl border border-green-200 p-4">
          <p className="text-sm text-green-700 font-semibold mb-2">Exercice à réaliser</p>
          <p className="text-sm text-gray-600">
            Cet exercice ne demande pas de soumission fichier/texte dans la plateforme.
          </p>
        </div>
      )}

      {/* Soumission existante */}
      {exerciseId && (
      <>
      {mySubmission ? (
        <div className="space-y-3">
          <div className={`p-4 rounded-xl border ${
            mySubmission.status === "graded"
              ? "bg-green-50 border-green-200"
              : mySubmission.status === "needs_revision"
              ? "bg-orange-50 border-orange-200"
              : "bg-yellow-50 border-yellow-200"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm text-gray-800">Votre soumission</p>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                mySubmission.status === "graded"       ? "bg-green-100 text-green-700" :
                mySubmission.status === "needs_revision" ? "bg-orange-100 text-orange-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {mySubmission.status === "graded"          ? "✓ Corrigé" :
                 mySubmission.status === "needs_revision"  ? "↺ À réviser" :
                 "⏳ En attente"}
              </span>
            </div>

            {/* Score */}
            {mySubmission.score !== null && mySubmission.score !== undefined && (
              <div className="flex items-center gap-2 mb-2">
                <Award size={16} className="text-violet-600" />
                <span className="font-bold text-violet-700 text-lg">
                  {mySubmission.score} / {block.exercise?.maxPoints || 20} points
                </span>
              </div>
            )}

            {/* Feedback instructeur */}
            {mySubmission.feedback && (
              <div className="bg-white rounded-lg p-3 border border-green-200 mt-2">
                <p className="text-xs font-bold text-green-700 mb-1">
                  💬 Feedback de l'instructeur
                </p>
                <p className="text-sm text-gray-700">{mySubmission.feedback}</p>
              </div>
            )}
          </div>

          {/* Permettre resoumission si needs_revision */}
          {mySubmission.status === "needs_revision" && (
            <div>
              <p className="text-sm font-semibold text-orange-700 mb-2">
                Corrigez votre réponse et resoumettez :
              </p>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                placeholder="Votre nouvelle réponse..."
                className="w-full border border-green-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-2 bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition flex items-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Send size={14} /> Resoumette</>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Formulaire de soumission */
        <div className="space-y-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            placeholder="Rédigez votre réponse ici..."
            className="w-full border border-green-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none bg-white"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 bg-white border border-green-300 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:bg-green-50 transition">
              <PenTool size={14} />
              {file ? file.name : "Joindre un fichier"}
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
            </label>
            {file && (
              <button
                onClick={() => setFile(null)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting || (!answer.trim() && !file)}
              className="bg-green-600 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Send size={14} /> Soumettre</>
              )}
            </button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

// ─── Composant : Rendu d'un bloc selon son type ───────────────────────────────
function BlockRenderer({ block, courseId, lessonCompleted }) {
  const config = BLOCK_CONFIGS[block.type] || BLOCK_CONFIGS.text;

  if (block.type === "video") return <VideoBlock block={block} />;
  if (block.type === "exercise") {
    return <ExerciseBlock block={block} courseId={courseId} />;
  }

  const Icon = config.header?.icon;

  return (
    <div className={config.wrapper}>
      {config.header && Icon && (
        <div className={config.header.class}>
          <Icon size={15} />
          {config.header.label}
        </div>
      )}
      <RichTextContent
        text={block.content}
        className="text-gray-700 text-sm leading-relaxed space-y-2"
      />
    </div>
  );
}

// ─── PAGE PRINCIPALE Learn ────────────────────────────────────────────────────
export default function Learn() {
  const { courseId } = useParams();
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonContent, setLessonContent] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Charger le cours et la progression
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const [courseRes, progressRes] = await Promise.all([
          API.get(`/courses/${courseId}`),
          API.get(`/progress/${courseId}`),
        ]);

        const courseData = courseRes.data.data;
        setCourse(courseData);
        setModules(courseData.modules || []);
        setCompletedLessons(progressRes.data.data.completedLessonIds || []);
        setCompletionPercent(progressRes.data.data.completionPercent || 0);

        // Ouvrir la première leçon non terminée automatiquement
        let firstLesson = null;
        for (const module of courseData.modules || []) {
          for (const lesson of module.lessons || []) {
            if (!progressRes.data.data.completedLessonIds.includes(lesson._id)) {
              firstLesson = lesson;
              break;
            }
          }
          if (firstLesson) break;
        }

        // Si tout est terminé, ouvrir la première leçon
        if (!firstLesson && courseData.modules?.[0]?.lessons?.[0]) {
          firstLesson = courseData.modules[0].lessons[0];
        }

        if (firstLesson) loadLesson(firstLesson);
      } catch (err) {
        toast.error("Cours introuvable ou accès non autorisé.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  // Charger le contenu d'une leçon
  const loadLesson = async (lesson) => {
    setCurrentLesson(lesson);
    setLoadingLesson(true);
    try {
      const res = await API.get(`/modules/lessons/${lesson._id}`);
      setLessonContent(res.data.data);
    } catch {
      toast.error("Erreur chargement de la leçon.");
    } finally {
      setLoadingLesson(false);
    }
  };

  // Marquer la leçon comme terminée
  const handleComplete = async () => {
    if (!currentLesson || completing) return;
    setCompleting(true);
    try {
      const res = await API.post(`/progress/${currentLesson._id}/complete`);
      const newCompleted = [...completedLessons, currentLesson._id];
      setCompletedLessons(newCompleted);
      setCompletionPercent(res.data.completionPercent);

      // Mettre à jour les points dans le store
      if (user) {
        updateUser({
          ...user,
          totalPoints: (user.totalPoints || 0) + (currentLesson.pointsReward || 5),
        });
      }

      toast.success(`+${currentLesson.pointsReward || 5} points ! Leçon terminée 🎉`);

      // Passer à la leçon suivante automatiquement
      const nextLesson = getNextLesson();
      if (nextLesson) {
        setTimeout(() => loadLesson(nextLesson), 800);
      } else {
        toast.success("🏆 Félicitations ! Vous avez terminé ce cours !", { duration: 4000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur.");
    } finally {
      setCompleting(false);
    }
  };

  // Trouver la leçon suivante
  const getNextLesson = () => {
    const allLessons = modules.flatMap((m) => m.lessons || []);
    const idx = allLessons.findIndex((l) => l._id === currentLesson?._id);
    return idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
  };

  // Trouver la leçon précédente
  const getPrevLesson = () => {
    const allLessons = modules.flatMap((m) => m.lessons || []);
    const idx = allLessons.findIndex((l) => l._id === currentLesson?._id);
    return idx > 0 ? allLessons[idx - 1] : null;
  };

  const isCurrentLessonCompleted = completedLessons.includes(currentLesson?._id);
  const allLessons = modules.flatMap((m) => m.lessons || []);
  const currentIndex = allLessons.findIndex((l) => l._id === currentLesson?._id);

  if (loading) {
    return (
      <div className="min-h-screen bg-violet-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-violet-300">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ── Topbar ── */}
      <div className="bg-violet-900 text-white px-4 py-3 flex items-center gap-4 flex-shrink-0 border-b border-violet-800">

        {/* Bouton menu mobile */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-violet-300 hover:text-white transition"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Lien retour */}
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-violet-300 hover:text-white transition text-sm"
        >
          <ArrowLeft size={15} /> Dashboard
        </Link>

        <div className="w-px h-5 bg-violet-700" />

        {/* Titre cours */}
        <p className="font-bold text-sm truncate flex-1">
          {course?.title}
        </p>

        {/* Progression globale */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <div className="w-32 h-2 bg-violet-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-purple-400 rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <span className="text-violet-300 text-xs font-semibold whitespace-nowrap">
            {completionPercent}% terminé
          </span>
        </div>

        {/* Points */}
        <div className="hidden md:flex items-center gap-1.5 bg-violet-800 px-3 py-1.5 rounded-full flex-shrink-0">
          <Trophy size={13} className="text-yellow-400" />
          <span className="text-yellow-300 text-xs font-bold">
            {user?.totalPoints || 0} pts
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar — Plan du cours ── */}
        <aside className={`${
          sidebarOpen ? "w-72" : "w-0"
        } flex-shrink-0 bg-white border-r border-violet-100 overflow-y-auto transition-all duration-300 flex flex-col`}>

          {sidebarOpen && (
            <>
              {/* En-tête sidebar */}
              <div className="p-4 border-b border-violet-100 bg-violet-50">
                <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-1">
                  Plan du cours
                </p>
                <p className="text-xs text-gray-500">
                  {completedLessons.length} / {allLessons.length} leçons terminées
                </p>
                <div className="mt-2 h-1.5 bg-violet-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-600 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              {/* Modules et leçons */}
              <div className="flex-1 overflow-y-auto py-2">
                {modules.map((module, moduleIndex) => (
                  <div key={module._id} className="mb-1">

                    {/* Titre module */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-50">
                      <div className="w-5 h-5 bg-violet-700 rounded-md flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                        {moduleIndex + 1}
                      </div>
                      <p className="text-xs font-bold text-violet-800 line-clamp-1">
                        {module.title}
                      </p>
                    </div>

                    {/* Leçons du module */}
                    {(module.lessons || []).map((lesson, lessonIndex) => {
                      const isCompleted = completedLessons.includes(lesson._id);
                      const isCurrent = currentLesson?._id === lesson._id;

                      return (
                        <button
                          key={lesson._id}
                          onClick={() => loadLesson(lesson)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                            isCurrent
                              ? "bg-violet-100 border-r-2 border-violet-600"
                              : "hover:bg-violet-50"
                          }`}
                        >
                          {/* Icône état */}
                          {isCompleted ? (
                            <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                          ) : isCurrent ? (
                            <div className="w-4 h-4 rounded-full border-2 border-violet-600 flex-shrink-0 flex items-center justify-center">
                              <div className="w-2 h-2 bg-violet-600 rounded-full" />
                            </div>
                          ) : (
                            <Circle size={16} className="text-gray-300 flex-shrink-0" />
                          )}

                          <div className="flex-1 min-w-0">
                            <p className={`text-xs line-clamp-2 ${
                              isCurrent ? "font-bold text-violet-800" :
                              isCompleted ? "text-gray-500" : "text-gray-700"
                            }`}>
                              {lesson.title}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock size={10} />
                              {lesson.duration || 10} min
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* ── Zone de contenu principale ── */}
        <main className="flex-1 overflow-y-auto">

          {loadingLesson ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Chargement de la leçon...</p>
              </div>
            </div>

          ) : lessonContent ? (
            <div className="max-w-3xl mx-auto px-6 py-8">

              {/* ── En-tête de la leçon ── */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-violet-500 text-xs font-semibold mb-2">
                  <BookOpen size={13} />
                  <span>
                    Leçon {currentIndex + 1} sur {allLessons.length}
                  </span>
                  {isCurrentLessonCompleted && (
                    <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      <CheckCircle size={11} /> Terminée
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-3">
                  {lessonContent.title}
                </h1>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {lessonContent.duration || 10} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy size={12} className="text-yellow-500" />
                    +{lessonContent.pointsReward || 5} points
                  </span>
                </div>
              </div>

              {/* ── Blocs de contenu ── */}
              <div className="space-y-6">
                {(lessonContent.blocks || []).length > 0 ? (
                  lessonContent.blocks
                    .sort((a, b) => a.order - b.order)
                    .map((block, i) => (
                      <BlockRenderer
                        key={i}
                        block={block}
                        courseId={courseId}
                        lessonCompleted={isCurrentLessonCompleted}
                      />
                    ))
                ) : (
                  <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-violet-200">
                    <BookOpen size={36} className="text-violet-200 mx-auto mb-3" />
                    <p className="text-gray-400">
                      Le contenu de cette leçon sera bientôt disponible.
                    </p>
                  </div>
                )}
              </div>

              {/* ── Navigation bas de page ── */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">

                {/* Leçon précédente */}
                {getPrevLesson() ? (
                  <button
                    onClick={() => loadLesson(getPrevLesson())}
                    className="flex items-center gap-2 bg-white border border-violet-200 text-violet-700 px-5 py-3 rounded-xl hover:bg-violet-50 transition font-semibold text-sm"
                  >
                    <ChevronLeft size={16} /> Précédent
                  </button>
                ) : <div />}

                {/* Bouton Marquer comme terminée */}
                <button
                  onClick={handleComplete}
                  disabled={completing || isCurrentLessonCompleted}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition ${
                    isCurrentLessonCompleted
                      ? "bg-green-100 text-green-700 cursor-default"
                      : "bg-violet-700 text-white hover:bg-violet-800 hover:shadow-lg disabled:opacity-50"
                  }`}
                >
                  {completing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isCurrentLessonCompleted ? (
                    <><CheckCircle size={16} /> Terminée</>
                  ) : (
                    <><CheckCircle size={16} /> Marquer comme terminée</>
                  )}
                </button>

                {/* Leçon suivante */}
                {getNextLesson() ? (
                  <button
                    onClick={() => loadLesson(getNextLesson())}
                    className="flex items-center gap-2 bg-violet-700 text-white px-5 py-3 rounded-xl hover:bg-violet-800 transition font-semibold text-sm"
                  >
                    Suivant <ChevronRight size={16} />
                  </button>
                ) : isCurrentLessonCompleted ? (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700 transition font-semibold text-sm"
                  >
                    <Trophy size={16} /> Terminer
                  </Link>
                ) : <div />}
              </div>

              {/* ── Félicitations si cours terminé ── */}
              {completionPercent === 100 && (
                <div className="mt-8 bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-6 text-center text-white">
                  <Trophy size={40} className="mx-auto mb-3 text-yellow-400" />
                  <h3 className="text-xl font-black mb-2">
                    🏆 Cours terminé !
                  </h3>
                  <p className="text-violet-200 text-sm mb-4">
                    Félicitations ! Vous avez complété {course?.title}.
                  </p>
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 bg-white text-violet-700 px-6 py-3 rounded-xl font-bold hover:bg-violet-50 transition"
                  >
                    <BookOpen size={16} /> Découvrir d'autres cours
                  </Link>
                </div>
              )}
            </div>

          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen size={48} className="text-violet-200 mx-auto mb-4" />
                <p className="text-gray-400">Sélectionnez une leçon pour commencer.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
