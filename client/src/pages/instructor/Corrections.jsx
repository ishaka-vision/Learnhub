import { useEffect, useState } from "react";
import {
  CheckCircle, Clock, ChevronDown, ChevronUp,
  User, Award, Send, FileText, Download, RotateCcw
} from "lucide-react";
import API from "../../services/api";
import toast from "react-hot-toast";

// ─── Badge statut ─────────────────────────────────────────────────────────────
function SubmissionBadge({ status }) {
  const config = {
    pending:        { label: "En attente", cls: "bg-yellow-100 text-yellow-700", Icon: Clock },
    graded:         { label: "Corrigé",    cls: "bg-green-100 text-green-700",   Icon: CheckCircle },
    needs_revision: { label: "À réviser",  cls: "bg-orange-100 text-orange-700", Icon: RotateCcw },
  };
  const s = config[status] || config.pending;
  const Icon = s.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${s.cls}`}>
      <Icon size={11} /> {s.label}
    </span>
  );
}

// ─── Formulaire de correction ─────────────────────────────────────────────────
function GradeForm({ submission, maxPoints, onGraded }) {
  const [score,    setScore]    = useState(submission.score ?? "");
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [status,   setStatus]   = useState(
    submission.status === "needs_revision" ? "needs_revision" : "graded"
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (score === "" || Number(score) < 0 || Number(score) > maxPoints) {
      toast.error(`La note doit être entre 0 et ${maxPoints}.`);
      return;
    }
    setSaving(true);
    try {
      await API.patch(`/exercises/submissions/${submission._id}/grade`, {
        score: Number(score),
        feedback,
        status,
      });
      toast.success("Correction enregistrée !");
      onGraded();
    } catch {
      toast.error("Erreur lors de la correction.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-violet-50 rounded-xl p-5 space-y-4 border border-violet-100">
      <h4 className="font-bold text-violet-800 flex items-center gap-2">
        <Award size={16} /> Corriger cet exercice
      </h4>

      {/* Note */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Note <span className="text-gray-400 font-normal">/ {maxPoints} points</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            min={0}
            max={maxPoints}
            required
            className="w-28 border border-violet-300 rounded-xl px-4 py-2.5 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-300"
              style={{ width: score !== "" ? `${Math.min((Number(score) / maxPoints) * 100, 100)}%` : "0%" }}
            />
          </div>
          <span className="text-sm text-gray-500 w-12 text-right">
            {score !== "" ? `${Math.round((Number(score) / maxPoints) * 100)}%` : "—"}
          </span>
        </div>
      </div>

      {/* Statut */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "graded",         label: "Corrigé ✓",   cls: "border-green-400 bg-green-50 text-green-700" },
            { value: "needs_revision", label: "À réviser ↺", cls: "border-orange-400 bg-orange-50 text-orange-700" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition ${
                status === opt.value ? opt.cls : "border-gray-200 text-gray-500 hover:border-violet-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Feedback personnalisé
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder="Expliquez vos corrections, encouragez l'étudiant..."
          className="w-full border border-violet-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-violet-700 text-white py-3 rounded-xl font-bold hover:bg-violet-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving
          ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <><Send size={16} /> Enregistrer la correction</>
        }
      </button>
    </form>
  );
}

// ─── Carte soumission ─────────────────────────────────────────────────────────
function SubmissionCard({ submission, onRefresh }) {
  const [open, setOpen] = useState(submission.status === "pending");

  return (
    <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">

      {/* Header cliquable */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-violet-50 transition text-left"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {submission.student?.firstName?.[0]}
          {submission.student?.lastName?.[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800 text-sm">
              {submission.student?.firstName} {submission.student?.lastName}
            </p>
            <SubmissionBadge status={submission.status} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {submission.exercise?.title} · Soumis le{" "}
            {new Date(submission.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>

        {submission.status === "graded" && submission.score != null && (
          <div className="text-right flex-shrink-0 mr-2">
            <p className="text-2xl font-black text-violet-700">{submission.score}</p>
            <p className="text-xs text-gray-400">/ {submission.exercise?.maxPoints || 20} pts</p>
          </div>
        )}

        {open
          ? <ChevronUp size={18} className="text-violet-400 flex-shrink-0" />
          : <ChevronDown size={18} className="text-violet-400 flex-shrink-0" />
        }
      </button>

      {/* Corps dépliable */}
      {open && (
        <div className="border-t border-violet-100 p-5 space-y-5">

          {/* Réponse étudiant */}
          <div>
            <h4 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <User size={15} className="text-violet-500" />
              Réponse de l'étudiant
            </h4>

            {submission.fileUrl ? (
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 hover:bg-violet-100 transition"
              >
                <FileText size={20} className="text-violet-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-violet-700 truncate">
                    {submission.fileName || "Fichier soumis"}
                  </p>
                  <p className="text-xs text-gray-400">Cliquer pour télécharger</p>
                </div>
                <Download size={16} className="text-violet-500 flex-shrink-0" />
              </a>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {submission.answer || "Aucune réponse fournie."}
                </p>
              </div>
            )}
          </div>

          {/* Feedback précédent */}
          {submission.feedback && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
                <CheckCircle size={12} /> Votre feedback précédent
              </p>
              <p className="text-sm text-gray-700">{submission.feedback}</p>
            </div>
          )}

          <GradeForm
            submission={submission}
            maxPoints={submission.exercise?.maxPoints || 20}
            onGraded={onRefresh}
          />
        </div>
      )}
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function Corrections() {
  const [submissions,    setSubmissions]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [filterStatus,   setFilterStatus]   = useState("pending");
  const [myCourses,      setMyCourses]      = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await API.get("/courses/instructor/my-courses");
        setMyCourses(res.data.data);
        if (res.data.data.length > 0) setSelectedCourse(res.data.data[0]._id);
      } catch (err) { console.error(err); }
    };
    fetchCourses();
  }, []);

  const fetchSubmissions = async () => {
    if (!selectedCourse) { setLoading(false); return; }
    setLoading(true);
    try {
      const courseRes = await API.get(`/courses/${selectedCourse}`);
      const modules   = courseRes.data.data?.modules || [];
      const all       = [];

      for (const mod of modules) {
        for (const lesson of mod.lessons || []) {
          try {
            const lessonRes = await API.get(`/modules/lessons/${lesson._id}`);
            const blocks    = lessonRes.data.data?.blocks || [];
            const exBlocks  = blocks.filter((b) => b.type === "exercise" && b.exercise);
            for (const block of exBlocks) {
              const exId   = block.exercise?._id || block.exercise;
              const subRes = await API.get(`/exercises/${exId}/submissions`);
              all.push(...subRes.data.data.map((s) => ({
                ...s,
                exercise: { ...s.exercise, maxPoints: block.exercise?.maxPoints || 20 },
              })));
            }
          } catch { /* leçon sans exercice */ }
        }
      }
      setSubmissions(all);
    } catch (err) {
      console.error(err);
      toast.error("Erreur chargement des soumissions.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSubmissions(); }, [selectedCourse]);

  const filtered     = submissions.filter((s) => filterStatus === "all" || s.status === filterStatus);
  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <div className="min-h-screen bg-violet-50">

      <div className="bg-gradient-to-r from-violet-900 to-purple-800 px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
            <CheckCircle size={28} className="text-violet-300" />
            Corrections des exercices
          </h1>
          <p className="text-sm mt-1">
            {pendingCount > 0
              ? <span className="text-yellow-300 font-semibold">{pendingCount} soumission{pendingCount > 1 ? "s" : ""} en attente</span>
              : <span className="text-violet-300">Toutes les soumissions sont corrigées ✓</span>
            }
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Filtres */}
        <div className="bg-white rounded-2xl border border-violet-100 p-4 flex flex-col md:flex-row gap-3">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="flex-1 border border-violet-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white text-gray-700"
          >
            <option value="">Choisir un cours</option>
            {myCourses.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>

          <div className="flex gap-2 flex-wrap">
            {[
              { value: "pending", label: `En attente (${pendingCount})` },
              { value: "graded",  label: "Corrigés" },
              { value: "all",     label: "Tous" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  filterStatus === value
                    ? "bg-violet-700 text-white"
                    : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-violet-100" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((s) => (
              <SubmissionCard key={s._id} submission={s} onRefresh={fetchSubmissions} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-violet-200">
            <CheckCircle size={48} className="text-violet-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              {filterStatus === "pending" ? "Aucune soumission en attente" : "Aucune soumission trouvée"}
            </h3>
            <p className="text-gray-400">
              {filterStatus === "pending" ? "Tout est corrigé ! Bravo 🎉" : "Les étudiants n'ont pas encore soumis."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}