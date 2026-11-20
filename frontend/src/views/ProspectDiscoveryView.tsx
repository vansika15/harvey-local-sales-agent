import React, { useEffect, useState } from "react";
import { Users, Upload, Plus, Search, Filter, Globe, Mail, Phone, ExternalLink, ArrowRight, CheckCircle2, Edit3, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { Prospect } from "../types";

export const ProspectDiscoveryView: React.FC = () => {
  const { activeCompany, activeProduct, setActiveView, addToast } = useApp();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // CSV Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Create Form State
  const [cName, setCName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("50-200 employees");
  const [location, setLocation] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Edit Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProspectId, setEditingProspectId] = useState<number | null>(null);
  const [editCName, setEditCName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editSize, setEditSize] = useState("50-200 employees");
  const [editLocation, setEditLocation] = useState("");
  const [editContactName, setEditContactName] = useState("");
  const [editContactRole, setEditContactRole] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");

  const startEditProspect = (p: Prospect) => {
    setEditingProspectId(p.id);
    setEditCName(p.company_name);
    setEditDomain(p.domain || "");
    setEditIndustry(p.industry || "");
    setEditSize(p.company_size || "50-200 employees");
    setEditLocation(p.location || "");
    setEditContactName(p.contact_name || "");
    setEditContactRole(p.contact_role || "");
    setEditContactEmail(p.contact_email || "");
    setIsEditModalOpen(true);
  };

  const handleUpdateProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProspectId) return;
    try {
      await api.updateProspect(editingProspectId, {
        company_id: activeCompany?.id,
        company_name: editCName,
        domain: editDomain,
        industry: editIndustry,
        company_size: editSize,
        location: editLocation,
        contact_name: editContactName,
        contact_role: editContactRole,
        contact_email: editContactEmail,
      });
      await loadProspects();
      setIsEditModalOpen(false);
      addToast(`Updated prospect ${editCName}`, "success");
    } catch (err: any) {
      addToast(`Update failed: ${err.message}`, "error");
    }
  };

  const handleDeleteProspect = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.deleteProspect(id);
      await loadProspects();
      addToast(`Deleted prospect ${name}`, "info");
    } catch (err: any) {
      addToast(`Delete failed: ${err.message}`, "error");
    }
  };

  const loadProspects = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const data = await api.getProspects({
        companyId: activeCompany.id,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setProspects(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProspects();
  }, [activeCompany?.id, statusFilter, searchTerm]);

  const handleUploadCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !selectedFile) return;

    setIsUploading(true);
    try {
      const res = await api.importCSV(activeCompany.id, selectedFile);
      addToast(`Imported ${res.imported} prospects (${res.skipped_duplicates} duplicates skipped)`, "success");
      setIsImportModalOpen(false);
      setSelectedFile(null);
      await loadProspects();
    } catch (err: any) {
      addToast(`CSV Import failed: ${err.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;

    try {
      await api.createProspect({
        company_id: activeCompany.id,
        product_id: activeProduct?.id,
        company_name: cName,
        domain,
        industry,
        company_size: size,
        location,
        contact_name: contactName,
        contact_role: contactRole,
        contact_email: contactEmail,
      });
      addToast(`Added prospect ${cName}`, "success");
      setIsCreateModalOpen(false);
      // Reset
      setCName("");
      setDomain("");
      setContactName("");
      setContactEmail("");
      await loadProspects();
    } catch (err: any) {
      addToast(`Failed to add prospect: ${err.message}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Prospect Discovery & Directory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Accounts discovered and loaded for <span className="text-slate-200 font-semibold">{activeCompany?.name}</span>. Import custom account lists or configure new leads.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4 text-brand-400" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-brand-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Prospect</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company, contact, or domain..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500 font-mono cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="researched">Researched</option>
            <option value="qualified">Qualified</option>
            <option value="replied">Replied</option>
          </select>
        </div>
      </div>

      {/* Prospects Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">Loading prospects...</div>
        ) : prospects.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <div>No prospects found matching criteria.</div>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="text-brand-400 hover:text-brand-300 font-semibold text-xs"
            >
              Import accounts via CSV
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Account / Domain</th>
                  <th className="py-3 px-4 font-semibold">Industry & Size</th>
                  <th className="py-3 px-4 font-semibold">Key Decision Maker</th>
                  <th className="py-3 px-4 font-semibold">Priority Score</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Outreach Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {prospects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm font-sans">{p.company_name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Globe className="w-3 h-3 text-brand-400" />
                        <span>{p.domain || "No domain"}</span>
                        {p.is_sample && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-500 border border-slate-700">
                            sample
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-200">{p.industry || "General B2B"}</div>
                      <div className="text-[11px] text-slate-500">{p.company_size || "50-200"} • {p.location || "US"}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-100 font-medium">{p.contact_name || "Unassigned"}</div>
                      <div className="text-[11px] text-slate-400">{p.contact_role || "Executive"}</div>
                      {p.contact_email && (
                        <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">{p.contact_email}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-sm font-bold font-mono text-emerald-400">{p.overall_score}/100</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Fit {p.fit_score} • Sig {p.signal_score}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={p.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setActiveView("research")}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
                          title="Open account research"
                        >
                          Research
                        </button>
                        <button
                          onClick={() => setActiveView("emails")}
                          className="px-2.5 py-1 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-[11px] font-semibold transition-colors"
                          title="Draft email"
                        >
                          Draft Email
                        </button>
                        <button
                          onClick={() => startEditProspect(p)}
                          className="p-1 rounded text-slate-500 hover:text-brand-400 transition-colors"
                          title="Edit prospect"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProspect(p.id, p.company_name)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete prospect"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CSV Import Modal */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Prospects from CSV">
        <form onSubmit={handleUploadCSV} className="space-y-4 text-xs">
          <p className="text-slate-400 leading-relaxed">
            Upload a CSV file containing company and prospect columns (Company Name, Domain, Industry, Size, Location, Contact Name, Role, Email, LinkedIn). Duplicates are skipped automatically.
          </p>

          <div className="p-6 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-center space-y-2">
            <Upload className="w-8 h-8 text-brand-400 mx-auto" />
            <div className="text-slate-300 font-medium">Select a CSV file to upload</div>
            <input
              type="file"
              accept=".csv"
              required
              onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              className="text-slate-400 text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-brand-600 file:text-white hover:file:bg-brand-500 cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold disabled:opacity-50"
            >
              {isUploading ? "Processing..." : "Import Accounts"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Add Prospect Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Single Prospect Account">
        <form onSubmit={handleCreateProspect} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="e.g. NextGen BioTech"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="nextgenbiotech.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. HealthTech"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Company Size</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="50-200 employees"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Contact Role</label>
              <input
                type="text"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
                placeholder="e.g. VP Infrastructure"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="sarah.jenkins@company.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold"
            >
              Add Prospect
            </button>
          </div>
        </form>
      </Modal>
      {/* Edit Prospect Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Prospect Details">
        <form onSubmit={handleUpdateProspect} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={editCName}
                onChange={(e) => setEditCName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Domain</label>
              <input
                type="text"
                value={editDomain}
                onChange={(e) => setEditDomain(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Industry</label>
              <input
                type="text"
                value={editIndustry}
                onChange={(e) => setEditIndustry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Company Size</label>
              <input
                type="text"
                value={editSize}
                onChange={(e) => setEditSize(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Location</label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Contact Name</label>
              <input
                type="text"
                value={editContactName}
                onChange={(e) => setEditContactName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Contact Role</label>
              <input
                type="text"
                value={editContactRole}
                onChange={(e) => setEditContactRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Contact Email</label>
            <input
              type="email"
              value={editContactEmail}
              onChange={(e) => setEditContactEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold"
            >
              Update Prospect
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
