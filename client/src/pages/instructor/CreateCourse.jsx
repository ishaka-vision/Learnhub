import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BookOpen, ArrowLeft, Upload, Save,
  Plus, X, AlertCircle, CheckCircle
} from "lucide-react";
import API from "../../services/api";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Développement Web", "Développement Mobile", "Data Science",
  "Design", "Marketing", "Business", "Langues", "Musique",
  "Photographie", "Autre",
];

const LEVELS = [
  { value: "beginner",     label: "Débutant",       desc: "Pour les débutants complets" },
  { value: "intermediate", label: "Intermédiaire",   desc: "Quelques bases requises" },
  { value: "advanced",     label: "Avancé",          desc: "Expérience significative" },
];

export default function CreateCourse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    customCategory: "",
    level: "beginner",
    requirements: [""],
    whatYouWillLearn: [""],
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      category: value,
      customCategory: value === "Autre" ? prev.customCategory : "",
    }));
  };

  const handleThumbnail = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  // Gérer les listes dynamiques (prérequis / objectifs)
  const handleListChange = (field, index, value) => {
    const updated = [...formData[field]];
    updated[index] = value;
    setFormData({ ...formData, [field]: updated });
  };

  const addListItem = (field) => {
    setFormData({ ...formData, [field]: [...formData[field], ""] });
  };

  const removeListItem = (field, index) => {
    const updated = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: updated.length > 0 ? updated : [""] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (formData.category === "Autre" && !formData.customCategory.trim()) {
      toast.error("Veuillez préciser la catégorie personnalisée.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      if (formData.category === "Autre") {
        data.append("customCategory", formData.customCategory.trim());
      }
      data.append("level", formData.level);

      // Filtrer les lignes vides
      const cleanRequirements = formData.requirements.filter((r) => r.trim());
      const cleanObjectives = formData.whatYouWillLearn.filter((o) => o.trim());

      cleanRequirements.forEach((r) => data.append("requirements[]", r));
      cleanObjectives.forEach((o) => data.append("whatYouWillLearn[]", o));

      if (thumbnailFile) data.append("thumbnail", thumbnailFile);

      const res = await API.post("/courses", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Cours créé avec succès !");
      navigate(`/instructor/courses/${res.data.data._id}/edit`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-violet-50">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-violet-900 to-purple-800 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/instructor/dashboard"
            className="inline-flex items-center gap-2 text-violet-300 hover:text-white mb-4 transition text-sm"
          >
            <ArrowLeft size={16} /> Retour au dashboard
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <BookOpen size={28} className="text-violet-300" />
            Créer un nouveau cours
          </h1>
          <p className="text-violet-300 text-sm mt-1">
            Remplissez les informations. Vous pourrez ajouter les modules et leçons ensuite.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Informations principales ── */}
          <div className="bg-white rounded-2xl border border-violet-100 p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
              <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-white text-xs font-black">1</div>
              Informations principales
            </h2>

            <div className="space-y-5">

              {/* Titre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titre du cours <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Maîtriser React.js de zéro à expert"
                  required
                  maxLength={150}
                  className="w-full border border-violet-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-800"
                />
                <p className="text-xs text-gray-400 mt-1">{formData.title.length}/150 caractères</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez votre cours en détail : contenu, public cible, ce que les étudiants vont apprendre..."
                  required
                  rows={5}
                  maxLength={2000}
                  className="w-full border border-violet-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-800 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{formData.description.length}/2000 caractères</p>
              </div>

              {/* Catégorie + Niveau */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    required
                    className="w-full border border-violet-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-800 bg-white"
                  >
                    <option value="">Choisir une catégorie</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {formData.category === "Autre" && (
                    <input
                      type="text"
                      name="customCategory"
                      value={formData.customCategory}
                      onChange={handleChange}
                      placeholder="Précisez votre catégorie"
                      className="w-full mt-3 border border-violet-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-800"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Niveau
                  </label>
                  <div className="space-y-2">
                    {LEVELS.map((lvl) => (
                      <label
                        key={lvl.value}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                          formData.level === lvl.value
                            ? "border-violet-600 bg-violet-50"
                            : "border-gray-200 hover:border-violet-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="level"
                          value={lvl.value}
                          checked={formData.level === lvl.value}
                          onChange={handleChange}
                          className="accent-violet-600"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{lvl.label}</p>
                          <p className="text-xs text-gray-500">{lvl.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Image de couverture ── */}
          <div className="bg-white rounded-2xl border border-violet-100 p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
              <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-white text-xs font-black">2</div>
              Image de couverture
            </h2>

            <div className="flex flex-col md:flex-row gap-5 items-start">
              {/* Preview */}
              <div className="w-full md:w-64 h-36 bg-violet-100 rounded-xl overflow-hidden flex-shrink-0 border-2 border-dashed border-violet-300 flex items-center justify-center">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Upload size={28} className="text-violet-400 mx-auto mb-2" />
                    <p className="text-violet-400 text-xs">Aperçu</p>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="block">
                  <div className="border-2 border-dashed border-violet-300 rounded-xl p-6 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-50 transition">
                    <Upload size={24} className="text-violet-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-violet-700">
                      Cliquer pour uploader une image
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG, WEBP — Max 5 MB — Recommandé : 1280x720px
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnail}
                    className="hidden"
                  />
                </label>
                {thumbnailPreview && (
                  <button
                    type="button"
                    onClick={() => { setThumbnailPreview(null); setThumbnailFile(null); }}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <X size={12} /> Supprimer l'image
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Ce que les étudiants apprendront ── */}
          <div className="bg-white rounded-2xl border border-violet-100 p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
              <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-white text-xs font-black">3</div>
              Objectifs pédagogiques
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              Listez ce que les étudiants sauront faire après votre cours.
            </p>

            <div className="space-y-3">
              {formData.whatYouWillLearn.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-2.5">
                    <CheckCircle size={13} className="text-violet-600" />
                  </div>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleListChange("whatYouWillLearn", i, e.target.value)}
                    placeholder={`Objectif ${i + 1}`}
                    className="flex-1 border border-violet-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  {formData.whatYouWillLearn.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeListItem("whatYouWillLearn", i)}
                      className="w-9 h-9 mt-0.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition flex items-center justify-center flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addListItem("whatYouWillLearn")}
                className="flex items-center gap-2 text-violet-600 text-sm font-semibold hover:text-violet-800 transition mt-2"
              >
                <Plus size={16} /> Ajouter un objectif
              </button>
            </div>
          </div>

          {/* ── Prérequis ── */}
          <div className="bg-white rounded-2xl border border-violet-100 p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
              <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-white text-xs font-black">4</div>
              Prérequis
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              Quelles connaissances faut-il avoir avant de suivre ce cours ?
            </p>

            <div className="space-y-3">
              {formData.requirements.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-2.5">
                    <AlertCircle size={13} className="text-violet-600" />
                  </div>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleListChange("requirements", i, e.target.value)}
                    placeholder={`Prérequis ${i + 1} (ex: Connaissances de base en HTML)`}
                    className="flex-1 border border-violet-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeListItem("requirements", i)}
                      className="w-9 h-9 mt-0.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition flex items-center justify-center flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addListItem("requirements")}
                className="flex items-center gap-2 text-violet-600 text-sm font-semibold hover:text-violet-800 transition"
              >
                <Plus size={16} /> Ajouter un prérequis
              </button>
            </div>
          </div>

          {/* ── Bouton submit ── */}
          <div className="flex gap-4 pb-8">
            <Link
              to="/instructor/dashboard"
              className="flex-1 md:flex-none bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition text-center"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-violet-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-violet-800 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Créer le cours et ajouter les leçons →
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
