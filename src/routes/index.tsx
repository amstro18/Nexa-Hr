import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { retrieve, type Source } from "@/lib/retrieve";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NexaHR — AI HR Helpdesk" },
      { name: "description", content: "Instant, policy-grounded answers to your HR questions." },
      { property: "og:title", content: "NexaHR — AI HR Helpdesk" },
      { property: "og:description", content: "Instant, policy-grounded answers to your HR questions." },
    ],
  }),
  component: Index,
});

function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  if (!ready) return <div className="min-h-screen" />;
  return user ? <Chat user={user} /> : <Login />;
}

function Logo() {
  return (
    <div className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-glow">✦</span>
      NexaHR
    </div>
  );
}

function Login() {
  const [err, setErr] = useState("");
  const signIn = async () => {
    setErr("");
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setErr(r.error.message ?? "Sign-in failed");
  };
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="glass w-full max-w-sm rounded-2xl p-8 text-center shadow-glow">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">HR answers, instantly.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Grounded in approved company policy. Sign in to continue.</p>
        <button
          onClick={signIn}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition hover:opacity-90"
        >
          <svg viewBox="0 0 24 24" className="size-4"><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.68 4.4-5.35 4.4a5.96 5.96 0 0 1 0-11.92c1.84 0 3.07.78 3.78 1.46l2.58-2.48C16.7 4.02 14.56 3 12 3a9 9 0 1 0 0 18c5.2 0 8.64-3.65 8.64-8.8 0-.6-.07-1.05-.15-1.5z" /></svg>
          Continue with Google
        </button>
        {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
        <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Secure · Policy-grounded · Private</p>
      </div>
    </main>
  );
}

const SUGGESTIONS = ["How many annual leave days do I get?", "Can I carry forward unused leave?", "How do I apply for sick leave?", "What is the bereavement leave policy?"];

function Chat({ user }: { user: User }) {
  const [input, setInput] = useState("");
  const [meta, setMeta] = useState<Record<string, { sources: Source[]; confidence: number }>>({});
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          return { Authorization: `Bearer ${data.session?.access_token ?? ""}` };
        },
      }),
    [],
  );
  const { messages, sendMessage, status, error, stop } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const ask = (text: string) => {
    if (!text.trim() || busy) return;
    setInput("");
    const r = retrieve(text);
    const n = messages.length + 1; // index of upcoming assistant reply
    setMeta((m) => ({ ...m, [n]: r }));
    sendMessage({ text });
  };
  const name = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4">
      <header className="sticky top-0 z-10 flex items-center justify-between py-4 backdrop-blur">
        <Logo />
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{user.email}</span>
          <button onClick={() => supabase.auth.signOut()} className="rounded-lg border px-3 py-1.5 transition hover:bg-accent hover:text-accent-foreground">Sign out</button>
        </div>
      </header>

      <main className="flex-1 space-y-6 py-6">
        {messages.length === 0 && (
          <div className="pt-16 text-center">
            <h1 className="text-4xl font-semibold tracking-tight">Hi {name}, <span className="text-primary">ask HR anything.</span></h1>
            <p className="mt-3 text-muted-foreground">Answers come only from approved policies, with citations.</p>
            <div className="mt-10 grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)} className="glass rounded-xl px-4 py-3 text-left text-sm transition hover:border-primary/50 hover:text-primary">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          if (m.role === "user")
            return <div key={m.id} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground">{text}</div>;
          const info = meta[i];
          return (
            <div key={m.id} className="glass rounded-2xl rounded-bl-sm p-5">
              <div className="prose-sm space-y-2 leading-relaxed [&_li]:ml-5 [&_strong]:text-primary [&_ul]:list-disc">
                <ReactMarkdown>{text || "…"}</ReactMarkdown>
              </div>
              {info && info.sources.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span>Sources</span>
                    <span>Retrieval confidence {Math.round(info.confidence * 100)}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {info.sources.slice(0, 3).map((s) => (
                      <span key={s.id} title={s.text} className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">{s.cite} · {s.title}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {status === "submitted" && <div className="font-mono text-xs text-primary animate-pulse">Searching policies…</div>}
        {error && <div className="rounded-xl border border-destructive/40 p-3 text-sm text-destructive">Something went wrong: {error.message}</div>}
        <div ref={end} />
      </main>

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="sticky bottom-0 pb-6 pt-2">
        <div className="glass flex items-center gap-2 rounded-2xl p-2 shadow-glow focus-within:border-primary/50">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about leave, policies, forms…" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground" />
          {busy ? (
            <button type="button" onClick={stop} className="rounded-xl border px-4 py-2 text-sm">Stop</button>
          ) : (
            <button disabled={!input.trim()} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition disabled:opacity-40">Send</button>
          )}
        </div>
      </form>
    </div>
  );
}
