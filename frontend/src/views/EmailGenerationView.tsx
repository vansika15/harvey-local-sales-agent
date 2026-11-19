import React, { useEffect, useState } from "react";
import { Mail, Sparkles, Copy, Check, Send, RotateCw, Quote, ShieldCheck, UserCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Prospect, GeneratedEmail } from "../types";

export const EmailGenerationView: React.FC = () => {
  const { activeCompany, activeProduct, addToast } = useApp();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [emails, setEmails] = useState<GeneratedEmail[]>([]);
  const [activeEmail, setActiveEmail] = useState<GeneratedEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sequenceStep, setSequenceStep] = useState(1);
  const [tone, setTone] = useState("consultative and punchy");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeCompany) {
      api.getProspects({ companyId: activeCompany.id }).then((data) => {
        setProspects(data);
        if (data.length > 0) setSelectedProspect(data[0]);
      });
    }
  }, [activeCompany?.id]);

  const loadEmails = async () => {
    if (!selectedProspect) return;
    setLoading(true);
    try {
      const data = await api.getProspectEmails(selectedProspect.id);
      setEmails(data);
      if (data.length > 0) {
        setActiveEmail(data[data.length - 1]);
      } else {
        setActiveEmail(null);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, [selectedProspect?.id]);

  const handleGenerate = async () => {
    if (!selectedProspect || !activeProduct) return;
    setIsGenerating(true);
    try {
      const res = await api.generateEmail(
        selectedProspect.id,
        activeProduct.id,
        sequenceStep,
        tone
      );
      await loadEmails();
      addToast(`Personalised Email generated for ${selectedProspect.contact_name || selectedProspect.company_name}!`, "success");
    } catch (err: any) {
      addToast(`Email generation failed: ${err.message}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!activeEmail) return;
    const fullText = `Subject: ${activeEmail.subject_line}\n\n${activeEmail.email_body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    addToast("Email copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Personalised Sales Email Generation</h2>
          <p className="text-xs text-slate-400 mt-1">
            Workflow 6: Crafts hyper-personalized outreach grounded strictly in actual observations and problems. Zero hallucinated claims.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3">
          <select
            value={selectedProspect?.id || ""}
            onChange={(e) => {
              const found = prospects.find((p) => p.id === Number(e.target.value));
              if (found) setSelectedProspect(found);
            }}
            className="bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 font-mono"
          >
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.contact_name || p.company_name} ({p.company_name})
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerate}
            disabled={!selectedProspect || !activeProduct || isGenerating}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-brand-600/20 disabled:opacity-50 transition-all shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Drafting Email..." : "Generate Email Sequence"}</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Sequence Step and Tone */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-wrap gap-4 items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300">Sequence Step:</span>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => setSequenceStep(step)}
                className={`px-3 py-1 rounded-lg font-mono font-medium transition-all ${
                  sequenceStep === step
                    ? "bg-brand-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Step {step}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Tone of Voice:</span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
          >
            <option value="consultative and punchy">Consultative & Punchy</option>
            <option value="executive and concise">Executive & Ultra-Concise</option>
            <option value="warm and curiosity-driven">Warm & Curiosity-Driven</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading email drafts...</div>
      ) : activeEmail ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Email Preview Canvas */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur p-6 space-y-5">
            {/* Subject Line */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs flex items-center justify-between">
              <div className="truncate">
                <span className="text-slate-500 uppercase mr-2 font-semibold">Subject:</span>
                <span className="text-white font-bold">{activeEmail.subject_line}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-brand-950 text-brand-400 border border-brand-800">
                Step {activeEmail.sequence_step}
              </span>
            </div>

            {/* Email Body Text */}
            <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-sm text-slate-100 font-sans leading-relaxed whitespace-pre-wrap selection:bg-brand-600">
              {activeEmail.email_body}
            </div>

            {/* Email Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Model: {activeEmail.model_used}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? "Copied!" : "Copy Email"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Strategic Outreach Breakdown */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Outreach Structure Breakdown</h4>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider block">
                  Opening Hook
                </span>
                <p className="text-slate-300 leading-relaxed">{activeEmail.hook_opening || "Grounded observation."}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  Value Proposition
                </span>
                <p className="text-slate-300 leading-relaxed">{activeEmail.value_proposition || "Product value mapping."}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">
                  Call to Action (CTA)
                </span>
                <p className="text-slate-300 leading-relaxed">{activeEmail.call_to_action || "Low friction intro window."}</p>
              </div>
            </div>

            {/* Sequence History */}
            {emails.length > 1 && (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur text-xs space-y-2">
                <div className="font-semibold text-slate-400 uppercase text-[10px]">Sequence Steps Drafted</div>
                <div className="space-y-1.5">
                  {emails.map((em) => (
                    <button
                      key={em.id}
                      onClick={() => setActiveEmail(em)}
                      className={`w-full text-left p-2 rounded-lg truncate transition-colors font-mono text-[11px] ${
                        activeEmail.id === em.id
                          ? "bg-brand-950 border border-brand-800 text-brand-300"
                          : "hover:bg-slate-800 text-slate-400"
                      }`}
                    >
                      Step {em.sequence_step}: {em.subject_line}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 text-xs space-y-2">
          <div>No outreach emails generated yet for {selectedProspect?.company_name}.</div>
          <button onClick={handleGenerate} className="text-brand-400 hover:text-brand-300 font-semibold">
            Generate cold email sequence now
          </button>
        </div>
      )}
    </div>
  );
};
