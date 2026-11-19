import React, { useState } from "react";
import { Package, Plus, Trash2, CheckCircle2, DollarSign, Tag, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Modal } from "../components/Modal";
import { Product } from "../types";

export const ProductManagement: React.FC = () => {
  const { activeCompany, products, activeProduct, setActiveProduct, refreshData, addToast, setActiveView } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [valueProp, setValueProp] = useState("");
  const [targetCust, setTargetCust] = useState("");
  const [pricing, setPricing] = useState("$99/mo per seat");
  const [painPointsRaw, setPainPointsRaw] = useState("");
  const [featuresRaw, setFeaturesRaw] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;

    try {
      const painPoints = painPointsRaw.split("\n").map((s) => s.trim()).filter(Boolean);
      const features = featuresRaw.split("\n").map((s) => s.trim()).filter(Boolean);

      const created = await api.createProduct({
        company_id: activeCompany.id,
        name,
        category,
        description,
        value_proposition: valueProp,
        target_customer_summary: targetCust,
        pricing_model: pricing,
        pain_points_solved: painPoints,
        features: features,
      });

      await refreshData();
      setActiveProduct(created);
      setIsModalOpen(false);
      addToast(`Product '${created.name}' registered!`, "success");

      // Reset
      setName("");
      setCategory("");
      setDescription("");
      setValueProp("");
      setTargetCust("");
      setPainPointsRaw("");
      setFeaturesRaw("");
    } catch (err: any) {
      addToast(`Failed to register product: ${err.message}`, "error");
    }
  };

  const handleDelete = async (id: number, prodName: string) => {
    if (!confirm(`Are you sure you want to delete ${prodName}?`)) return;
    try {
      await api.deleteProduct(id);
      await refreshData();
      addToast(`Deleted ${prodName}`, "info");
    } catch (err: any) {
      addToast(`Delete failed: ${err.message}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Product Portfolio</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure multiple products under <span className="text-slate-200 font-semibold">{activeCompany?.name}</span>. Each product drives its own dedicated ICP, buying signals, and outreach messaging.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p) => {
          const isActive = activeProduct?.id === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setActiveProduct(p)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? "bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm tracking-tight">{p.name}</h3>
                      <span className="text-[11px] text-emerald-400 font-mono">{p.category || "General Solution"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.is_sample && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                        Sample
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 font-mono border border-emerald-700">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed">{p.description}</p>

                {p.value_proposition && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Value Proposition</div>
                    <div className="text-slate-200">{p.value_proposition}</div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  {p.pricing_model || "Contact Sales"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveProduct(p);
                      setActiveView("icp");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 flex items-center gap-1 text-[11px] font-medium transition-colors"
                  >
                    <span>View ICP</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(p.id, p.name);
                    }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Product Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Product">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. KubeGuard AI"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Cloud Security"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Pricing Model</label>
              <input
                type="text"
                value={pricing}
                onChange={(e) => setPricing(e.target.value)}
                placeholder="e.g. $49/node/mo"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Product Description *</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of product capabilities..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Value Proposition</label>
            <input
              type="text"
              value={valueProp}
              onChange={(e) => setValueProp(e.target.value)}
              placeholder="Core hook (e.g. Save 35% on cluster compute with zero code changes)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Pain Points Solved (1 per line)</label>
            <textarea
              rows={2}
              value={painPointsRaw}
              onChange={(e) => setPainPointsRaw(e.target.value)}
              placeholder="Over-provisioned pods&#10;Manual incident triage&#10;Silent cluster CVEs"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
