import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Save, Trash2, ChevronDown,
  ChevronUp, GripVertical, BookOpen, Play,
  FileText, Lightbulb, AlertTriangle, PenTool,
  HelpCircle, Edit, Check, X, Upload
} from "lucide-react";
import API from "../../services/api";
import toast from "react-hot-toast";

// ─── Types de blocs disponibles ───────────────────────────────────────────────
const BLOCK_TYPES = [
  { type: "text",     label: "Texte",             icon: FileText,      color: "bg-gray-100 text-gray-600 border-gray-300" },
  { type: "video",    label: "Vidéo",             icon: Play,          color: "bg-violet-100 text-violet-700 border-violet-300" },
  { type: "example",  label: "Exemple remarquable",icon: Lightbulb,    color: "bg-purple-100 text-purple-700 border-purple-300" },
  { type: "note",     label: "Note importante",   icon: AlertTriangle, color: "bg-orange-100 text-orange-700 border-orange-300" },
  { type: "exercise", label: "Exercice",           icon: PenTool,       color: "bg-green-100 text-green-700 border-green-300" },
  { type: "quiz",     label: "Quiz",              icon: HelpCircle,    color: "bg-blue-100 text-blue-700 border-blue-300" },
];

// ─── Couleurs des blocs dans la leçon ────────────────────────────────────────
const BLOCK_STYLES = {
  text:     "bg-white border-gray-200",
  video:    "bg-violet-50 border-violet-200",
  example:  "bg-purple-50 border-purple-200",
  note:     "bg-orange-50 border-orange-200",
  exercise: "bg-green-50 border-green-200",
  quiz:     "bg-blue-50 border-blue-200",
};

const BLOCK_HEADER_STYLES = {
  text:     "text-gray-600",
  video:    "text-violet-700",
  example:  "text-purple-700",
  note:     "text-orange-700",
  exercise: "text-green-700",
  quiz:     "text-blue-700",
};

// ─── Composant : Éditeur d'un bloc ───────────────────────────────────────────
function BlockEditor({ block, index, onUpdate, onDelete }) {
  const blockType = BLOCK_TYPES.find((b) => b.type === block.type);
  const Icon = blockType?.icon || FileText;

  return (
    <div className={`rounded-xl border-2 ${BLOCK_STYLES[block.type]} overflow-hidden`}>
      {/* Header du bloc */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${BLOCK_STYLES[block.type]}`}>
        <div className={`flex items-center gap-2 font-semibold text-sm ${BLOCK_HEADER_STYLES[block.type]}`}>
          <Icon size={15} />
          {blockType?.label}
        </div>
        <button
          onClick={() => onDelete(index)}
          className="text-red-400 hover:text-red-600 transition p-1"
        >
          <X size={15} />
        </button>
      </div>

      {/* Contenu éditable selon le type */}
      <div className="p-4">
        {block.type === "video" ? (
          <div className="space-y-3">
            <input
              type="text"
              value={block.videoTitle || ""}
              onChange={(e) => onUpdate(index, { ...block, videoTitle: e.target.value })}
              placeholder="Titre de la vidéo"
              className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              type="url"
              value={block.videoUrl || ""}
              onChange={(e) => onUpdate(index, { ...block, videoUrl: e.target.value })}
              placeholder="URL YouTube ou Vimeo (ex: https://www.youtube.com/watch?v=...)"
              className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            {/* Preview vidéo */}
            {block.videoUrl && block.videoUrl.includes("youtube") && (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${block.videoUrl.split("v=")[1]?.split("&")[0]}`}
                  className="w-full h-full"
                  allowFullScreen
                  title={block.videoTitle}
                />
              </div>
            )}
          </div>
        ) : (
          <textarea
            value={block.content || ""}
            onChange={(e) => onUpdate(index, { ...block, content: e.target.value })}
            placeholder={
              block.type === "text"     ? "Rédigez votre contenu ici..." :
              block.type === "example"  ? "Décrivez votre exemple remarquable..." :
              block.type === "note"     ? "Écrivez votre note importante..." :
              block.type === "exercise" ? "Décrivez l'exercice pratique à réaliser..." :
              block.type === "quiz"     ? "Décrivez le quiz (les questions seront créées séparément)..." :
              "Contenu..."
            }
            rows={block.type === "text" ? 6 : 4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none bg-white"
          />
        )}
      </div>
    </div>
  );
}

// ─── Composant : Éditeur d'une leçon ────────────────────────────────────────
function LessonEditor({ lesson, onSave, onDelete }) {
  const [open, setOpen] = useState(false);
  const [blocks, setBlocks] = useState(lesson.blocks || []);
  const [title, setTitle] = useState(lesson.title || "");
  const [duration, setDuration] = useState(lesson.duration || 10);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const addBlock = (type) => {
    const newBlock = {
      type,
      order: blocks.length,
      content: "",
      videoUrl: "",
      videoTitle: "",
    };
    setBlocks([...blocks, newBlock]);
    setHasChanges(true);
  };

  const updateBlock = (index, updated) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updated;
    setBlocks(newBlocks);
    setHasChanges(true);
  };

  const deleteBlock = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.put(`/modules/lessons/${lesson._id}`, {
        title,
        duration: Number(duration),
        blocks: blocks.map((b, i) => ({ ...b, order: i })),
      });
      setHasChanges(false);
      toast.success("Leçon sauvegardée !");
      onSave();
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-violet-100 overflow-hidden">

      {/* Header de la leçon */}
      <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 border-b border-violet-100">
        <GripVertical size={16} className="text-violet-300 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {open ? (
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setHasChanges(true); }}
              className="w-full text-sm font-semibold bg-white border border-violet-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className="text-sm font-semibold text-gray-800 truncate">{title || "Sans titre"}</p>
          )}
        </div>

        {/* Durée */}
        <div className="hidden md:flex items-center gap-1 text-xs text-gray-500">
          <input
            type="number"
            value={duration}
            onChange={(e) => { setDuration(e.target.value); setHasChanges(true); }}
            className="w-14 text-center border border-violet-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
            min={1}
            onClick={(e) => e.stopPropagation()}
          />
          <span>min</span>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 bg-violet-700 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-violet-800 transition font-semibold"
            >
              {saving ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save size={12} /> Sauvegarder</>
              )}
            </button>
          )}
          <button
            onClick={() => onDelete(lesson._id)}
            className="text-red-400 hover:text-red-600 transition p-1"
          >
            <Trash2 size={15} />
          </button>
          <button onClick={() => setOpen(!open)} className="text-violet-500 p-1">
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Corps de la leçon */}
      {open && (
        <div className="p-5 space-y-4">

          {/* Blocs existants */}
          {blocks.length > 0 ? (
            <div className="space-y-3">
              {blocks.map((block, i) => (
                <BlockEditor
                  key={i}
                  block={block}
                  index={i}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-violet-200 rounded-xl">
              <BookOpen size={28} className="text-violet-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                Aucun bloc. Ajoutez du contenu ci-dessous.
              </p>
            </div>
          )}

          {/* Ajouter un bloc */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Ajouter un bloc de contenu
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {BLOCK_TYPES.map(({ type, label, icon: Icon, color }) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition hover:opacity-80 ${color}`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE PRINCIPALE EditCourse ───────────────────────────────────────────────
export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [addingLesson, setAddingLesson] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");

  // Charger le cours avec ses modules et leçons
  const fetchCourse = async () => {
    try {
      const res = await API.get(`/courses/${id}`);
      setCourse(res.data.data);
      setModules(res.data.data.modules || []);
    } catch {
      toast.error("Cours introuvable.");
      navigate("/instructor/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourse(); }, [id]);

  // Créer un module
  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      const res = await API.post("/modules", {
        courseId: id,
        title: newModuleTitle.trim(),
      });
      setModules([...modules, { ...res.data.data, lessons: [] }]);
      setNewModuleTitle("");
      setAddingModule(false);
      toast.success("Module créé !");
    } catch {
      toast.error("Erreur lors de la création du module.");
    }
  };

  // Supprimer un module
  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm("Supprimer ce module et toutes ses leçons ?")) return;
    try {
      await API.delete(`/modules/${moduleId}`);
      setModules(modules.filter((m) => m._id !== moduleId));
      toast.success("Module supprimé.");
    } catch {
      toast.error("Erreur suppression.");
    }
  };

  // Créer une leçon
  const handleAddLesson = async (moduleId) => {
    if (!newLessonTitle.trim()) return;
    try {
      const res = await API.post("/modules/lessons", {
        moduleId,
        title: newLessonTitle.trim(),
        duration: 10,
      });
      setModules(modules.map((m) =>
        m._id === moduleId
          ? { ...m, lessons: [...(m.lessons || []), res.data.data] }
          : m
      ));
      setNewLessonTitle("");
      setAddingLesson(null);
      toast.success("Leçon créée !");
    } catch {
      toast.error("Erreur lors de la création.");
    }
  };

  // Supprimer une leçon
  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Supprimer cette leçon ?")) return;
    try {
      await API.delete(`/modules/lessons/${lessonId}`);
      setModules(modules.map((m) => ({
        ...m,
        lessons: (m.lessons || []).filter((l) => l._id !== lessonId),
      })));
      toast.success("Leçon supprimée.");
    } catch {
      toast.error("Erreur suppression.");
    }
  };

  // Soumettre le cours pour approbation
  const handleSubmitForReview = async () => {
    const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
    if (modules.length === 0 || totalLessons === 0) {
      toast.error("Ajoutez au moins un module avec une leçon avant de soumettre.");
      return;
    }
    try {
      await API.patch(`/courses/${id}/submit`);
      toast.success("Cours soumis pour approbation !");
      navigate("/instructor/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la soumission.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-violet-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

  return (
    <div className="min-h-screen bg-violet-50">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-violet-900 to-purple-800 px-6 py-8 sticky top-16 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <Link
              to="/instructor/dashboard"
              className="inline-flex items-center gap-2 text-violet-300 hover:text-white mb-2 transition text-sm"
            >
              <ArrowLeft size={15} /> Dashboard
            </Link>
            <h1 className="text-xl font-black text-white line-clamp-1">
              {course?.title}
            </h1>
            <p className="text-violet-300 text-xs mt-1">
              {modules.length} module{modules.length > 1 ? "s" : ""} ·{" "}
              {totalLessons} leçon{totalLessons > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to={`/courses/${id}`}
              className="bg-violet-800 text-white text-sm px-4 py-2.5 rounded-xl hover:bg-violet-700 transition font-semibold"
            >
              Aperçu
            </Link>
            {course?.status === "draft" && (
              <button
                onClick={handleSubmitForReview}
                className="bg-white text-violet-700 text-sm px-5 py-2.5 rounded-xl hover:bg-violet-50 transition font-bold flex items-center gap-2 shadow-lg"
              >
                <Check size={15} /> Soumettre pour approbation
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── Modules et leçons ── */}
        {modules.length > 0 ? (
          modules.map((module, moduleIndex) => (
            <div key={module._id} className="bg-white rounded-2xl border border-violet-100 overflow-hidden">

              {/* Header module */}
              <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                <div className="w-8 h-8 bg-violet-700 rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {moduleIndex + 1}
                </div>
                <h3 className="font-bold text-gray-800 flex-1">{module.title}</h3>
                <span className="text-xs text-gray-400">
                  {module.lessons?.length || 0} leçon{module.lessons?.length > 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => handleDeleteModule(module._id)}
                  className="text-red-400 hover:text-red-600 transition p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Leçons du module */}
              <div className="p-4 space-y-3">
                {(module.lessons || []).map((lesson) => (
                  <LessonEditor
                    key={lesson._id}
                    lesson={lesson}
                    onSave={fetchCourse}
                    onDelete={handleDeleteLesson}
                  />
                ))}

                {/* Ajouter une leçon */}
                {addingLesson === module._id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLessonTitle}
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddLesson(module._id)}
                      placeholder="Titre de la leçon..."
                      autoFocus
                      className="flex-1 border border-violet-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <button
                      onClick={() => handleAddLesson(module._id)}
                      className="bg-violet-700 text-white px-4 py-2.5 rounded-xl hover:bg-violet-800 transition"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => { setAddingLesson(null); setNewLessonTitle(""); }}
                      className="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingLesson(module._id); setNewLessonTitle(""); }}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-violet-200 text-violet-500 py-3 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition text-sm font-semibold"
                  >
                    <Plus size={16} /> Ajouter une leçon
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-violet-200">
            <BookOpen size={48} className="text-violet-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              Aucun module pour l'instant
            </h3>
            <p className="text-gray-400 mb-6">
              Créez votre premier module pour commencer à structurer votre cours.
            </p>
          </div>
        )}

        {/* ── Ajouter un module ── */}
        {addingModule ? (
          <div className="bg-white rounded-2xl border border-violet-200 p-5">
            <p className="font-bold text-gray-800 mb-3">Nouveau module</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddModule()}
                placeholder="Titre du module (ex: Introduction à JavaScript)"
                autoFocus
                className="flex-1 border border-violet-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={handleAddModule}
                className="bg-violet-700 text-white px-5 py-3 rounded-xl hover:bg-violet-800 transition font-semibold flex items-center gap-2"
              >
                <Check size={16} /> Créer
              </button>
              <button
                onClick={() => { setAddingModule(false); setNewModuleTitle(""); }}
                className="bg-gray-100 text-gray-600 px-4 py-3 rounded-xl hover:bg-gray-200 transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingModule(true)}
            className="w-full flex items-center justify-center gap-2 bg-violet-700 text-white py-4 rounded-2xl hover:bg-violet-800 transition font-bold text-lg shadow-lg hover:shadow-xl"
          >
            <Plus size={20} /> Ajouter un module
          </button>
        )}
      </div>
    </div>
  );
}