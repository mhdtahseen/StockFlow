import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Smartphone,
  Palette,
  HardDrive,
  MemoryStick,
  X,
  Check,
  ArrowLeft,
  Database,
  Package,
  AlertTriangle,
} from "lucide-react";

/* ──────────────────────── Types ──────────────────────── */

type ColorRow = {
  id: string;
  model_id: string;
  label: string;
  hex: string;
};

type ModelRow = {
  id: string;
  brand: string;
  model: string;
  storage: string[];
  ram: string[];
  created_at: string;
  colors?: ColorRow[];
};

type BrandSummary = {
  brand: string;
  modelCount: number;
  colorCount: number;
};

/* ──────────────────────── Main Component ──────────────────────── */

export default function AdminCatalog() {
  const [models, setModels] = useState<ModelRow[]>([]);
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // View states
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelRow | null>(null);

  // Modal states
  const [showModelModal, setShowModelModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    type: "model" | "color";
    id: string;
    name: string;
  } | null>(null);
  const [editingModel, setEditingModel] = useState<ModelRow | null>(null);
  const [editingColor, setEditingColor] = useState<ColorRow | null>(null);
  const [showBrandModal, setShowBrandModal] = useState(false);

  /* ── Fetch all data ──────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);

    // Models: unlikely to exceed 1000, but set explicit limit
    const modelsRes = await supabase
      .from("catalog_models")
      .select("*")
      .order("brand")
      .order("model")
      .limit(2000);

    // Colors: can exceed default 1000-row limit, so paginate
    let allColors: ColorRow[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase
        .from("catalog_model_colors")
        .select("*")
        .order("label")
        .range(from, from + batchSize - 1);
      if (error) {
        toast.error("Failed to load colors", { description: error.message });
        break;
      }
      allColors = allColors.concat((data as ColorRow[]) || []);
      hasMore = (data?.length || 0) === batchSize;
      from += batchSize;
    }

    if (modelsRes.error) {
      toast.error("Failed to load models", {
        description: modelsRes.error.message,
      });
    }

    setModels((modelsRes.data as ModelRow[]) || []);
    setColors(allColors);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Derived data ──────────────────────────────────────── */
  const brands: BrandSummary[] = useMemo(() => {
    const map = new Map<string, { models: number; colors: number }>();
    for (const m of models) {
      const entry = map.get(m.brand) || { models: 0, colors: 0 };
      entry.models++;
      entry.colors += colors.filter((c) => c.model_id === m.id).length;
      map.set(m.brand, entry);
    }
    return Array.from(map.entries())
      .map(([brand, data]) => ({
        brand,
        modelCount: data.models,
        colorCount: data.colors,
      }))
      .sort((a, b) => a.brand.localeCompare(b.brand));
  }, [models, colors]);

  const filteredBrands = useMemo(() => {
    if (!search) return brands;
    const q = search.toLowerCase();
    return brands.filter((b) => b.brand.toLowerCase().includes(q));
  }, [brands, search]);

  const brandModels = useMemo(() => {
    if (!selectedBrand) return [];
    return models
      .filter((m) => m.brand === selectedBrand)
      .filter(
        (m) => !search || m.model.toLowerCase().includes(search.toLowerCase()),
      );
  }, [models, selectedBrand, search]);

  const modelColors = useMemo(() => {
    if (!selectedModel) return [];
    return colors.filter((c) => c.model_id === selectedModel.id);
  }, [colors, selectedModel]);

  /* ── CRUD: Models (with full JSON support) ────────────── */
  const saveModel = async (data: {
    brand: string;
    model: string;
    storage: string[];
    ram: string[];
    colors: { label: string; hex: string }[];
  }) => {
    if (editingModel) {
      // Update model fields
      const { error } = await supabase
        .from("catalog_models")
        .update({
          brand: data.brand,
          model: data.model,
          storage: data.storage,
          ram: data.ram,
        })
        .eq("id", editingModel.id);
      if (error) {
        toast.error("Failed to update model", { description: error.message });
        return;
      }
      // Replace all colors: delete old, insert new
      await supabase
        .from("catalog_model_colors")
        .delete()
        .eq("model_id", editingModel.id);
      if (data.colors.length > 0) {
        const { error: cErr } = await supabase
          .from("catalog_model_colors")
          .insert(
            data.colors.map((c) => ({
              model_id: editingModel.id,
              label: c.label,
              hex: c.hex,
            })),
          );
        if (cErr) {
          toast.error("Model saved, but colors failed", {
            description: cErr.message,
          });
          return;
        }
      }
      toast.success("Model updated (with colors)");
    } else {
      // Insert new model
      const { data: newRow, error } = await supabase
        .from("catalog_models")
        .insert({
          brand: data.brand,
          model: data.model,
          storage: data.storage,
          ram: data.ram,
        })
        .select("id")
        .single();
      if (error) {
        toast.error("Failed to add model", { description: error.message });
        return;
      }
      // Insert colors
      if (data.colors.length > 0) {
        const { error: cErr } = await supabase
          .from("catalog_model_colors")
          .insert(
            data.colors.map((c) => ({
              model_id: newRow.id,
              label: c.label,
              hex: c.hex,
            })),
          );
        if (cErr) {
          toast.error("Model added, but colors failed", {
            description: cErr.message,
          });
        }
      }
      toast.success("Model added");
    }
    setShowModelModal(false);
    setEditingModel(null);
    fetchData();
  };

  const deleteModel = async (id: string) => {
    // Delete colors first (cascade)
    await supabase.from("catalog_model_colors").delete().eq("model_id", id);
    const { error } = await supabase
      .from("catalog_models")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Failed to delete model", { description: error.message });
      return;
    }
    toast.success("Model deleted");
    if (selectedModel?.id === id) setSelectedModel(null);
    setShowDeleteConfirm(null);
    fetchData();
  };

  /* ── CRUD: Colors ──────────────────────────────────────── */
  const saveColor = async (data: {
    model_id: string;
    label: string;
    hex: string;
  }) => {
    if (editingColor) {
      const { error } = await supabase
        .from("catalog_model_colors")
        .update({ label: data.label, hex: data.hex })
        .eq("id", editingColor.id);
      if (error) {
        toast.error("Failed to update color", { description: error.message });
        return;
      }
      toast.success("Color updated");
    } else {
      const { error } = await supabase
        .from("catalog_model_colors")
        .insert(data);
      if (error) {
        toast.error("Failed to add color", { description: error.message });
        return;
      }
      toast.success("Color added");
    }
    setShowColorModal(false);
    setEditingColor(null);
    fetchData();
  };

  const deleteColor = async (id: string) => {
    const { error } = await supabase
      .from("catalog_model_colors")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Failed to delete color", { description: error.message });
      return;
    }
    toast.success("Color deleted");
    setShowDeleteConfirm(null);
    fetchData();
  };

  /* ── Stats bar ──────────────────────────────────────── */
  const stats = useMemo(
    () => ({
      brands: brands.length,
      models: models.length,
      colors: colors.length,
    }),
    [brands, models, colors],
  );

  /* ── Render ──────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Database
                  className="text-blue-600 dark:text-blue-400"
                  size={22}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Device Catalog Manager
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Super Admin • Internal Tool
                </p>
              </div>
            </div>
            <a
              href="/"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors"
            >
              ← Back to App
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Stats Row ──────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Brands",
              value: stats.brands,
              icon: Package,
              color: "text-violet-600 dark:text-violet-400",
              bg: "bg-violet-50 dark:bg-violet-900/20",
            },
            {
              label: "Models",
              value: stats.models,
              icon: Smartphone,
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-50 dark:bg-blue-900/20",
            },
            {
              label: "Colors",
              value: stats.colors,
              icon: Palette,
              color: "text-rose-600 dark:text-rose-400",
              bg: "bg-rose-50 dark:bg-rose-900/20",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center gap-3"
            >
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={s.color} size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Actions ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                selectedModel
                  ? "Search colors..."
                  : selectedBrand
                    ? `Search ${selectedBrand} models...`
                    : "Search brands..."
              }
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {!selectedBrand && !selectedModel && (
            <button
              onClick={() => setShowBrandModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Plus size={16} />
              Add Brand
            </button>
          )}
          <button
            onClick={() => {
              if (selectedModel) {
                setEditingColor(null);
                setShowColorModal(true);
              } else {
                setEditingModel(null);
                setShowModelModal(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <Plus size={16} />
            {selectedModel ? "Add Color" : "Add Model"}
          </button>
        </div>

        {/* ── Breadcrumb ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <button
            onClick={() => {
              setSelectedBrand(null);
              setSelectedModel(null);
              setSearch("");
            }}
            className={`font-semibold transition-colors ${!selectedBrand ? "text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"}`}
          >
            All Brands
          </button>
          {selectedBrand && (
            <>
              <ChevronRight size={14} className="text-slate-400" />
              <button
                onClick={() => {
                  setSelectedModel(null);
                  setSearch("");
                }}
                className={`font-semibold transition-colors ${!selectedModel ? "text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"}`}
              >
                {selectedBrand}
              </button>
            </>
          )}
          {selectedModel && (
            <>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {selectedModel.model}
              </span>
            </>
          )}
        </div>

        {/* ── Content ──────────────────────────────────────── */}
        {selectedModel ? (
          <ModelDetailView
            model={selectedModel}
            colors={modelColors}
            onBack={() => setSelectedModel(null)}
            onEditModel={() => {
              setEditingModel(selectedModel);
              setShowModelModal(true);
            }}
            onEditColor={(c) => {
              setEditingColor(c);
              setShowColorModal(true);
            }}
            onDeleteColor={(c) =>
              setShowDeleteConfirm({
                type: "color",
                id: c.id,
                name: c.label,
              })
            }
            onAddColor={() => {
              setEditingColor(null);
              setShowColorModal(true);
            }}
          />
        ) : selectedBrand ? (
          <ModelListView
            brand={selectedBrand}
            models={brandModels}
            colors={colors}
            onSelectModel={(m) => {
              setSelectedModel(m);
              setSearch("");
            }}
            onEditModel={(m) => {
              setEditingModel(m);
              setShowModelModal(true);
            }}
            onDeleteModel={(m) =>
              setShowDeleteConfirm({
                type: "model",
                id: m.id,
                name: `${m.brand} ${m.model}`,
              })
            }
            onBack={() => {
              setSelectedBrand(null);
              setSearch("");
            }}
          />
        ) : (
          <BrandListView
            brands={filteredBrands}
            onSelectBrand={(b) => {
              setSelectedBrand(b);
              setSearch("");
            }}
          />
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────── */}
      {showModelModal && (
        <JsonModelEditor
          model={editingModel}
          existingColors={
            editingModel
              ? colors.filter((c) => c.model_id === editingModel.id)
              : []
          }
          defaultBrand={selectedBrand || ""}
          onSave={saveModel}
          onClose={() => {
            setShowModelModal(false);
            setEditingModel(null);
          }}
        />
      )}

      {showBrandModal && (
        <BrandFormModal
          onSave={(brandName) => {
            setShowBrandModal(false);
            setSelectedBrand(brandName);
            setSelectedModel(null);
            setSearch("");
          }}
          onClose={() => setShowBrandModal(false)}
        />
      )}

      {showColorModal && selectedModel && (
        <ColorFormModal
          color={editingColor}
          modelId={selectedModel.id}
          onSave={saveColor}
          onClose={() => {
            setShowColorModal(false);
            setEditingColor(null);
          }}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          name={showDeleteConfirm.name}
          type={showDeleteConfirm.type}
          onConfirm={() => {
            if (showDeleteConfirm.type === "model") {
              deleteModel(showDeleteConfirm.id);
            } else {
              deleteColor(showDeleteConfirm.id);
            }
          }}
          onClose={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Sub-views
   ══════════════════════════════════════════════════════════════ */

function BrandListView({
  brands,
  onSelectBrand,
}: {
  brands: BrandSummary[];
  onSelectBrand: (b: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {brands.map((b) => (
        <button
          key={b.brand}
          onClick={() => onSelectBrand(b.brand)}
          className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group text-left"
        >
          <div>
            <h3 className="font-bold text-base">{b.brand}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {b.modelCount} models • {b.colorCount} colors
            </p>
          </div>
          <ChevronRight
            size={18}
            className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors"
          />
        </button>
      ))}
      {brands.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-400">
          No brands found
        </div>
      )}
    </div>
  );
}

function ModelListView({
  models,
  colors,
  onSelectModel,
  onEditModel,
  onDeleteModel,
  onBack,
}: {
  brand: string;
  models: ModelRow[];
  colors: ColorRow[];
  onSelectModel: (m: ModelRow) => void;
  onEditModel: (m: ModelRow) => void;
  onDeleteModel: (m: ModelRow) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 font-medium mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        All Brands
      </button>
      <div className="space-y-2">
        {models.map((m) => {
          const mc = colors.filter((c) => c.model_id === m.id);
          return (
            <div
              key={m.id}
              className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
            >
              <button
                onClick={() => onSelectModel(m)}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-bold text-sm">{m.model}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <HardDrive size={10} />
                        {m.storage?.join(", ") || "–"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MemoryStick size={10} />
                        {m.ram?.join(", ") || "–"}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Color dots */}
              <div className="flex items-center gap-1 mr-4">
                {mc.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700"
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
                {mc.length > 6 && (
                  <span className="text-[10px] text-slate-400 ml-1">
                    +{mc.length - 6}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditModel(m);
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Pencil size={14} className="text-slate-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteModel(m);
                  }}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
                <ChevronRight
                  size={16}
                  className="text-slate-300 dark:text-slate-600 ml-1"
                />
              </div>
            </div>
          );
        })}
        {models.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No models found
          </div>
        )}
      </div>
    </div>
  );
}

function ModelDetailView({
  model,
  colors,
  onBack,
  onEditModel,
  onEditColor,
  onDeleteColor,
  onAddColor,
}: {
  model: ModelRow;
  colors: ColorRow[];
  onBack: () => void;
  onEditModel: () => void;
  onEditColor: (c: ColorRow) => void;
  onDeleteColor: (c: ColorRow) => void;
  onAddColor: () => void;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 font-medium mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to models
      </button>

      {/* Model info card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {model.brand} {model.model}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <HardDrive size={14} />
                {model.storage?.join(", ") || "None"}
              </span>
              <span className="flex items-center gap-1.5">
                <MemoryStick size={14} />
                {model.ram?.join(", ") || "None"}
              </span>
              <span className="flex items-center gap-1.5">
                <Palette size={14} />
                {colors.length} colors
              </span>
            </div>
          </div>
          <button
            onClick={onEditModel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Pencil size={12} />
            Edit
          </button>
        </div>
      </div>

      {/* Colors grid */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Colors ({colors.length})
        </h3>
        <button
          onClick={onAddColor}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <Plus size={12} />
          Add Color
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {colors.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 group"
          >
            <div
              className="w-10 h-10 rounded-lg border-2 border-slate-200 dark:border-slate-700 flex-shrink-0"
              style={{ backgroundColor: c.hex }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{c.label}</p>
              <p className="text-xs text-slate-400 font-mono">{c.hex}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEditColor(c)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Pencil size={12} className="text-slate-500" />
              </button>
              <button
                onClick={() => onDeleteColor(c)}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={12} className="text-red-500" />
              </button>
            </div>
          </div>
        ))}
        {colors.length === 0 && (
          <div className="col-span-full text-center py-8 text-slate-400 text-sm">
            No colors added yet
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Modals
   ══════════════════════════════════════════════════════════════ */

function JsonModelEditor({
  model,
  existingColors,
  defaultBrand,
  onSave,
  onClose,
}: {
  model: ModelRow | null;
  existingColors: ColorRow[];
  defaultBrand: string;
  onSave: (data: {
    brand: string;
    model: string;
    storage: string[];
    ram: string[];
    colors: { label: string; hex: string }[];
  }) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"form" | "json">("form");
  const [brand, setBrand] = useState(model?.brand || defaultBrand);
  const [modelName, setModelName] = useState(model?.model || "");
  const [saving, setSaving] = useState(false);

  // ── Predefined chip options ──
  const STORAGE_OPTIONS = [
    "16GB",
    "32GB",
    "64GB",
    "128GB",
    "256GB",
    "512GB",
    "1TB",
  ];
  const RAM_OPTIONS = [
    "2GB",
    "3GB",
    "4GB",
    "6GB",
    "8GB",
    "12GB",
    "16GB",
    "18GB",
  ];

  // ── Form mode state (arrays) ──
  const [selectedStorage, setSelectedStorage] = useState<string[]>(
    model?.storage || [],
  );
  const [selectedRam, setSelectedRam] = useState<string[]>(model?.ram || []);
  const [formColors, setFormColors] = useState<
    { label: string; hex: string }[]
  >(existingColors.map((c) => ({ label: c.label, hex: c.hex })));
  const [newColorLabel, setNewColorLabel] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

  // ── JSON mode state ──
  const [jsonError, setJsonError] = useState<string | null>(null);
  const buildJson = () =>
    JSON.stringify(
      {
        storage: model?.storage || [],
        ram: model?.ram || [],
        colors: existingColors.map((c) => ({ label: c.label, hex: c.hex })),
      },
      null,
      2,
    );
  const [jsonStr, setJsonStr] = useState(buildJson);

  // ── Chip toggle helpers ──
  const toggleChip = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  // Sync form → JSON when switching tabs
  const switchToJson = () => {
    try {
      const prev = JSON.parse(jsonStr);
      setJsonStr(
        JSON.stringify(
          {
            storage: selectedStorage,
            ram: selectedRam,
            colors: formColors.length > 0 ? formColors : prev.colors || [],
          },
          null,
          2,
        ),
      );
    } catch {
      setJsonStr(
        JSON.stringify(
          { storage: selectedStorage, ram: selectedRam, colors: formColors },
          null,
          2,
        ),
      );
    }
    setMode("json");
  };

  // Sync JSON → form when switching tabs
  const switchToForm = () => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.storage)) setSelectedStorage(parsed.storage);
      if (Array.isArray(parsed.ram)) setSelectedRam(parsed.ram);
      if (Array.isArray(parsed.colors))
        setFormColors(
          parsed.colors.map((c: any) => ({
            label: c.label || "",
            hex: c.hex || "#000000",
          })),
        );
    } catch {
      /* keep current form values */
    }
    setMode("form");
  };

  // ── Save handlers ──
  const handleFormSave = async () => {
    if (!brand.trim() || !modelName.trim()) {
      toast.error("Brand and Model name are required");
      return;
    }
    setSaving(true);
    await onSave({
      brand: brand.trim(),
      model: modelName.trim(),
      storage: selectedStorage,
      ram: selectedRam,
      colors: formColors,
    });
    setSaving(false);
  };

  const handleJsonSave = async () => {
    if (!brand.trim() || !modelName.trim()) {
      toast.error("Brand and Model name are required");
      return;
    }
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed.storage))
        throw new Error('"storage" must be an array of strings');
      if (!Array.isArray(parsed.ram))
        throw new Error('"ram" must be an array of strings');
      if (!Array.isArray(parsed.colors))
        throw new Error('"colors" must be an array');
      for (let i = 0; i < parsed.colors.length; i++) {
        const c = parsed.colors[i];
        if (!c.label || typeof c.label !== "string")
          throw new Error(`colors[${i}] is missing a "label" string`);
        if (!c.hex || typeof c.hex !== "string")
          throw new Error(`colors[${i}] is missing a "hex" string`);
      }
      setJsonError(null);
      setSaving(true);
      await onSave({
        brand: brand.trim(),
        model: modelName.trim(),
        storage: parsed.storage,
        ram: parsed.ram,
        colors: parsed.colors.map((c: any) => ({
          label: c.label,
          hex: c.hex,
        })),
      });
      setSaving(false);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
        {/* Header with tabs */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {model ? "Edit Model" : "Add Model"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-5 w-fit">
          <button
            onClick={() => (mode === "json" ? switchToForm() : null)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === "form"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Form
          </button>
          <button
            onClick={() => (mode === "form" ? switchToJson() : null)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === "json"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            JSON
          </button>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
          {/* Shared: Brand + Model name */}
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Brand">
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="modal-input"
                placeholder="e.g. Samsung"
              />
            </FieldGroup>
            <FieldGroup label="Model Name">
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="modal-input"
                placeholder="e.g. Galaxy S24 Ultra"
              />
            </FieldGroup>
          </div>

          {mode === "form" ? (
            <>
              {/* ── Storage Chips ── */}
              <FieldGroup label="Storage" hint="Click to toggle">
                <div className="flex flex-wrap gap-2">
                  {STORAGE_OPTIONS.map((opt) => {
                    const active = selectedStorage.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          toggleChip(opt, selectedStorage, setSelectedStorage)
                        }
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          active
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {selectedStorage.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                    Selected: {selectedStorage.join(", ")}
                  </p>
                )}
              </FieldGroup>

              {/* ── RAM Chips ── */}
              <FieldGroup label="RAM" hint="Click to toggle">
                <div className="flex flex-wrap gap-2">
                  {RAM_OPTIONS.map((opt) => {
                    const active = selectedRam.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          toggleChip(opt, selectedRam, setSelectedRam)
                        }
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          active
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {selectedRam.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                    Selected: {selectedRam.join(", ")}
                  </p>
                )}
              </FieldGroup>

              {/* ── Colors Section ── */}
              <FieldGroup label={`Colors (${formColors.length})`}>
                {/* Existing colors with remove */}
                {formColors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formColors.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 group"
                      >
                        <div
                          className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-xs font-medium">{c.label}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormColors((prev) =>
                              prev.filter((_, j) => j !== i),
                            )
                          }
                          className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors ml-0.5"
                        >
                          <X size={10} className="text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new color */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newColorLabel}
                      onChange={(e) => setNewColorLabel(e.target.value)}
                      className="modal-input text-xs"
                      placeholder="Color name, e.g. Midnight Black"
                    />
                  </div>
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-10 h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer flex-shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newColorLabel.trim()) {
                        toast.error("Enter a color name");
                        return;
                      }
                      setFormColors((prev) => [
                        ...prev,
                        { label: newColorLabel.trim(), hex: newColorHex },
                      ]);
                      setNewColorLabel("");
                      setNewColorHex("#000000");
                    }}
                    className="flex items-center gap-1 px-3 h-[38px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                </div>
              </FieldGroup>
            </>
          ) : (
            <>
              {/* ── JSON mode ── */}
              <FieldGroup
                label="Model Spec (JSON)"
                hint="Paste or edit the full { storage, ram, colors } object"
              >
                <textarea
                  value={jsonStr}
                  onChange={(e) => {
                    setJsonStr(e.target.value);
                    setJsonError(null);
                  }}
                  spellCheck={false}
                  className="modal-input font-mono text-xs leading-relaxed min-h-[260px] resize-y"
                />
              </FieldGroup>

              {jsonError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle
                    className="text-red-500 flex-shrink-0 mt-0.5"
                    size={14}
                  />
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {jsonError}
                  </p>
                </div>
              )}

              {/* Live color preview */}
              {(() => {
                try {
                  const parsed = JSON.parse(jsonStr);
                  if (
                    Array.isArray(parsed.colors) &&
                    parsed.colors.length > 0
                  ) {
                    return (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Color Preview ({parsed.colors.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {parsed.colors.map((c: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-md"
                            >
                              <div
                                className="w-4 h-4 rounded border border-slate-200 dark:border-slate-600"
                                style={{ backgroundColor: c.hex || "#ccc" }}
                              />
                              <span className="text-xs font-medium">
                                {c.label || "?"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch {
                  /* skip */
                }
                return null;
              })()}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={mode === "form" ? handleFormSave : handleJsonSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {model ? "Save Changes" : "Add Model"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BrandFormModal({
  onSave,
  onClose,
}: {
  onSave: (brand: string) => void;
  onClose: () => void;
}) {
  const [brand, setBrand] = useState("");

  return (
    <ModalShell title="Add Brand" onClose={onClose}>
      <div className="space-y-4">
        <FieldGroup label="Brand Name">
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="modal-input"
            placeholder="e.g. Google, Motorola, Nothing"
            autoFocus
          />
        </FieldGroup>
        <p className="text-xs text-slate-400">
          This navigates to the brand view so you can add models under it.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!brand.trim()) {
                toast.error("Brand name is required");
                return;
              }
              onSave(brand.trim());
            }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Check size={14} />
            Go to Brand
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ColorFormModal({
  color,
  modelId,
  onSave,
  onClose,
}: {
  color: ColorRow | null;
  modelId: string;
  onSave: (data: { model_id: string; label: string; hex: string }) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(color?.label || "");
  const [hex, setHex] = useState(color?.hex || "#000000");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) {
      toast.error("Color name is required");
      return;
    }
    setSaving(true);
    await onSave({
      model_id: modelId,
      label: label.trim(),
      hex: hex,
    });
    setSaving(false);
  };

  return (
    <ModalShell title={color ? "Edit Color" : "Add Color"} onClose={onClose}>
      <div className="space-y-4">
        <FieldGroup label="Color Name">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="modal-input"
            placeholder="e.g. Midnight Black"
          />
        </FieldGroup>
        <FieldGroup label="Color Hex">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="w-12 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
            />
            <input
              type="text"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="modal-input flex-1 font-mono"
              placeholder="#000000"
            />
          </div>
        </FieldGroup>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div
            className="w-10 h-10 rounded-lg border-2 border-slate-200 dark:border-slate-700"
            style={{ backgroundColor: hex }}
          />
          <div>
            <p className="text-sm font-semibold">{label || "Color preview"}</p>
            <p className="text-xs text-slate-400 font-mono">{hex}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {color ? "Save Changes" : "Add Color"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function DeleteConfirmModal({
  name,
  type,
  onConfirm,
  onClose,
}: {
  name: string;
  type: "model" | "color";
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ModalShell title="Confirm Delete" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertTriangle
            className="text-red-500 flex-shrink-0 mt-0.5"
            size={18}
          />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Delete {type}: {name}?
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
              {type === "model"
                ? "This will permanently remove the model and all its associated colors."
                : "This color variant will be permanently removed."}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ══════════════════════════════════════════════════════════════
   Shared UI primitives
   ══════════════════════════════════════════════════════════════ */

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
        {hint && (
          <span className="font-medium normal-case tracking-normal text-slate-400 ml-1">
            ({hint})
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
