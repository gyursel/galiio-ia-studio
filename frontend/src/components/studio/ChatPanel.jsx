import React, { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, User } from "lucide-react";

const MODE_LABELS = {
  plan: { label: "Plan", hint: "Outline a structure first" },
  build: { label: "Build", hint: "Generate the full site" },
  debug: { label: "Debug", hint: "Find & fix issues" },
  refine: { label: "Refine", hint: "Edit copy, colors, sections" },
  publish: { label: "Publish", hint: "Export or deploy" },
};

export default function ChatPanel({ modes, mode, onModeChange, messages, onSend, generating, disabled }) {
  const [text, setText] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, generating]);

  const submit = () => {
    if (!text.trim() || generating || disabled) return;
    onSend(text);
    setText("");
  };

  return (
    <aside
      className="flex flex-col min-h-0 flex-1"
      data-testid="chat-panel"
    >
      {/* Mode tabs */}
      <div className="p-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-1 p-1 bg-zinc-900/60 rounded-md">
          {modes.map((m) => {
            const active = m === mode;
            const disabled = m === "publish"; // publish handled by header dropdown
            return (
              <button
                key={m}
                data-testid={`mode-${m}-btn`}
                onClick={() => !disabled && onModeChange(m)}
                disabled={disabled}
                className={`flex-1 text-[11px] font-medium uppercase tracking-wider py-1.5 rounded transition-colors ${
                  active
                    ? "bg-white text-zinc-950"
                    : "text-zinc-400 hover:text-white"
                } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {MODE_LABELS[m]?.label || m}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-zinc-500 mt-2 px-1">
          {MODE_LABELS[mode]?.hint}
        </p>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-5"
        data-testid="chat-messages"
      >
        {messages.length === 0 && !generating && (
          <div className="text-center mt-8 px-4">
            <div className="mx-auto w-10 h-10 rounded-lg bg-zinc-900 grid place-items-center mb-3">
              <Sparkles className="w-4 h-4 text-zinc-400" />
            </div>
            <h3 className="text-sm font-medium tracking-tight">Describe your website</h3>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              e.g. “A premium camera shop landing page for the new Galio X1 mirrorless camera with hero, specs, gallery and a buy CTA.”
            </p>
          </div>
        )}
        {messages.map((m) => (
          <Message key={m.message_id} msg={m} />
        ))}
        {generating && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-md bg-white grid place-items-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-zinc-950 ai-pulse" />
            </div>
            <div className="text-sm text-zinc-400 ai-pulse" data-testid="ai-thinking">
              Galio is thinking…
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-zinc-800/60">
        <div className="rounded-lg border border-zinc-800 focus-within:border-zinc-600 bg-zinc-900/40 transition-colors">
          <Textarea
            data-testid="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={disabled ? "Read-only — request editor access" : `Ask Galio to ${mode}…`}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-sm placeholder:text-zinc-600 min-h-[70px] disabled:opacity-60"
          />
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              {mode}
            </span>
            <button
              data-testid="chat-send-btn"
              onClick={submit}
              disabled={!text.trim() || generating || disabled}
              className="h-7 px-2.5 rounded-md bg-white text-zinc-950 text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200 active:scale-95 transition-all"
            >
              <Send className="w-3 h-3" /> Send
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Message({ msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex gap-3 justify-end" data-testid={`msg-user-${msg.message_id}`}>
        <div className="bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 max-w-[90%] leading-relaxed">
          {msg.content}
        </div>
        <div className="w-6 h-6 rounded-md bg-zinc-800 grid place-items-center shrink-0">
          <User className="w-3.5 h-3.5 text-zinc-300" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3" data-testid={`msg-ai-${msg.message_id}`}>
      <div className="w-6 h-6 rounded-md bg-white grid place-items-center shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
      </div>
      <div className="text-sm text-zinc-300 leading-relaxed border-l-2 border-white/30 pl-3 max-w-[90%] whitespace-pre-wrap">
        {msg.content}
      </div>
    </div>
  );
}
