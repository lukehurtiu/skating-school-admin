"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { askAssistant } from "@/app/(protected)/assistant/actions";

type Message = { role: "user" | "assistant" | "error"; content: string };

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isPending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInput("");
    startTransition(async () => {
      const result = await askAssistant(q);
      if ("error" in result) {
        setMessages((prev) => [...prev, { role: "error", content: result.error }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: result.answer }]);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-700"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Ask AI</div>
              <div className="text-xs text-slate-500">Powered by Groq · Llama 3.3</div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 && (
              <div className="text-slate-500">
                Ask about students, classes, schedules, or attendance. Example: &ldquo;What classes are on Monday?&rdquo;
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-lg bg-slate-900 px-3 py-2 text-white"
                    : m.role === "error"
                    ? "mr-8 rounded-lg bg-red-50 px-3 py-2 text-red-700"
                    : "mr-8 whitespace-pre-wrap rounded-lg bg-slate-100 px-3 py-2 text-slate-900"
                }
              >
                {m.content}
              </div>
            ))}
            {isPending && (
              <div className="mr-8 rounded-lg bg-slate-100 px-3 py-2 text-slate-500">Thinking…</div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              disabled={isPending}
              maxLength={500}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
