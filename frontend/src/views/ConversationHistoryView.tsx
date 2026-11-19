import React, { useEffect, useState } from "react";
import { History, MessageSquare, Mail, User, Shield, Clock } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { ConversationReply } from "../types";

export const ConversationHistoryView: React.FC = () => {
  const { activeCompany } = useApp();
  const [replies, setReplies] = useState<ConversationReply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeCompany) {
      setLoading(true);
      api.getReplies(activeCompany.id)
        .then((data) => setReplies(data))
        .finally(() => setLoading(false));
    }
  }, [activeCompany?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Conversation & Outreach History</h2>
        <p className="text-xs text-slate-400 mt-1">
          Historical log of classified prospect replies, sentiment telemetry, and outbound suggestions for {activeCompany?.name}.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-5">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">Loading conversation history...</div>
        ) : replies.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No historical replies logged yet for this organization.
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((r) => (
              <div
                key={r.id}
                className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3 hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-brand-400" />
                    <span className="text-xs font-semibold text-white">Inbound Prospect Response</span>
                    <StatusBadge status={r.classification} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="capitalize text-slate-300">Sentiment: {r.detected_sentiment}</span>
                    <span>•</span>
                    <span>{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-200 font-sans leading-relaxed">
                  "{r.inbound_message}"
                </div>

                <div className="text-xs text-slate-400 leading-relaxed font-sans">
                  <strong className="text-slate-300">Analysis:</strong> {r.explanation}
                </div>

                {r.suggested_response && (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">
                      Suggested Rep Answer
                    </span>
                    <p className="text-slate-200 italic font-sans leading-relaxed">
                      "{r.suggested_response}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
