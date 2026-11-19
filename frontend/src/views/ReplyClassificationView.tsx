import React, { useState } from "react";
import { MessageSquare, Sparkles, Send, CheckCircle2, AlertTriangle, XCircle, Clock, Calendar, HelpCircle, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";

interface PresetReply {
  label: string;
  category: string;
  message: string;
}

const PRESET_REPLIES: PresetReply[] = [
  {
    label: "Demo Booking Request",
    category: "meeting_requested",
    message: "Hi there, thanks for the note. Our AWS bills have indeed been ballooning since our multi-region rollout. How does KubeGuard handle latency-sensitive microservices? Can you share a calendar link for Tuesday afternoon?",
  },
  {
    label: "Pricing & Collateral Request",
    category: "interested",
    message: "Hey! This is quite timely. We are evaluating automated dispatch tooling right now for our field technicians. Can you send over a pricing breakdown and 2 customer case studies?",
  },
  {
    label: "Tech Stack & Budget Objection",
    category: "objection",
    message: "Appreciate the reach-out, but we just signed an annual enterprise renewal with Datadog and have absolutely zero budget to switch monitoring vendors this fiscal year.",
  },
  {
    label: "Deferred / Follow-up Later",
    category: "follow_up_required",
    message: "I am out of the office on medical leave until next month. Please circle back with me around late November once our quarterly planning commences.",
  },
  {
    label: "Firm Unsubscribe",
    category: "not_interested",
    message: "Not interested. Please immediately remove my email and company from your outbound contact list.",
  },
];

export const ReplyClassificationView: React.FC = () => {
  const { activeCompany, activeProduct, addToast } = useApp();
  const [inboundText, setInboundText] = useState(PRESET_REPLIES[0].message);
  const [classificationResult, setClassificationResult] = useState<any>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  const handleClassify = async () => {
    if (!activeProduct) return;
    setIsClassifying(true);
    try {
      // Use active prospect or fallback ID 1
      const res = await api.classifyReply(
        inboundText,
        1,
        activeProduct.id
      );
      setClassificationResult(res);
      addToast(`Reply classified as '${res.classification}' (${Math.round(res.confidence * 100)}%)!`, "success");
    } catch (err: any) {
      addToast(`Classification failed: ${err.message}`, "error");
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Conversation & Reply Classification</h2>
        <p className="text-xs text-slate-400 mt-1">
          Workflow 8: Local AI sentiment and intent triage. Classifies inbound prospect responses, extracts objections, and drafts context-aware responses.
        </p>
      </div>

      {/* Preset Pickers */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur space-y-2">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Quick Test Preset Responses
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_REPLIES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInboundText(preset.message);
                setClassificationResult(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700/80 transition-all font-mono text-[11px]"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reply Input Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-5 space-y-4 flex flex-col justify-between">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Inbound Prospect Email Message
            </label>
            <textarea
              rows={8}
              value={inboundText}
              onChange={(e) => setInboundText(e.target.value)}
              placeholder="Paste raw inbound email text from prospect here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-sans leading-relaxed focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Evaluated against: {activeProduct?.name || "Active Product"}
            </span>
            <button
              onClick={handleClassify}
              disabled={!inboundText.trim() || isClassifying}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-brand-600/20 disabled:opacity-50 transition-all"
            >
              <Sparkles className={`w-4 h-4 ${isClassifying ? "animate-spin" : ""}`} />
              <span>{isClassifying ? "Classifying Intent..." : "Classify Reply (Workflow 8)"}</span>
            </button>
          </div>
        </div>

        {/* Classification Triage Result */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-5 flex flex-col justify-between">
          {classificationResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Classification:</span>
                  <StatusBadge status={classificationResult.classification} />
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    {Math.round(classificationResult.confidence * 100)}%
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Confidence</div>
                </div>
              </div>

              {/* Sentiment & Objections */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Detected Sentiment
                  </span>
                  <span className="text-xs font-bold text-white capitalize mt-0.5 block">
                    {classificationResult.detected_sentiment}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Objections Found
                  </span>
                  <span className="text-xs text-amber-400 font-mono mt-0.5 block">
                    {classificationResult.detected_objections?.length > 0
                      ? classificationResult.detected_objections.join(", ")
                      : "None detected"}
                  </span>
                </div>
              </div>

              {/* AI Explanation */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider block">
                  Causal Explanation
                </span>
                <p className="text-slate-200 leading-relaxed">{classificationResult.explanation}</p>
              </div>

              {/* Auto-Drafted Sales Response */}
              {classificationResult.suggested_response && (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/50 text-xs space-y-1.5">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
                    Recommended Rep Reply Draft
                  </span>
                  <p className="text-slate-100 font-sans leading-relaxed italic">
                    "{classificationResult.suggested_response}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <div>No reply classification executed yet.</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Select a preset reply above or type custom prospect feedback, then click "Classify Reply".
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex justify-between">
            <span>Deterministic Preview / Ollama Fallback Active</span>
            <span>Zero Cloud APIs</span>
          </div>
        </div>
      </div>
    </div>
  );
};
