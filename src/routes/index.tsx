import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import type { User } from '@supabase/supabase-js';
import { ArrowRight, BookOpen, ChevronDown, Eye, EyeOff, LogOut, Menu, MessageSquare, Moon, Plus, ShieldCheck, Square, Sun, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { retrieve, type Source } from '@/lib/retrieve';
import { getMyAccess, type AccessRole } from '@/lib/access.functions';
import demoAccounts from '@/lib/demo-accounts.json';
import kb from '@/lib/kb.json';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'NexaHR — Your HR workspace' },
    { name: 'description', content: 'Your company policies, leave information and HR answers in one considered workspace.' },
    { property: 'og:title', content: 'NexaHR — Your HR workspace' },
    { property: 'og:description', content: 'A clear, dependable place for company policies and HR questions.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});
const ROLE_LABELS: Record<AccessRole, string> = { employee: 'Employee', intern: 'Intern', hr: 'HR', ceo: 'CEO' };
const ROLES: AccessRole[] = ['employee', 'intern', 'hr', 'ceo'];
const fieldClass = 'w-full rounded-md border bg-card px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-ring';

function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && ['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data }) => { if (active) { setUser(data.user); setReady(true); } }).catch(() => { if (active) setReady(true); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  if (!ready) return <main className="grid min-h-svh place-items-center"><p className="text-sm text-muted-foreground">Opening NexaHR…</p></main>;
  return user ? <Workspace key={user.id} user={user} /> : <Login />;
}
function Logo() {
  return <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-sm bg-primary text-primary-foreground"><svg aria-hidden="true" className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3 20 21H4L12 3Z" /></svg></span><span className="text-2xl font-semibold">NexaHR</span></div>;
}
function ThemeToggle() {
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('nexahr-theme', next ? 'dark' : 'light'); } catch { /* private mode */ }
  };
  return <Button variant="ghost" size="icon" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <Sun /> : <Moon />}</Button>;
}
function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.68 4.4-5.35 4.4a5.96 5.96 0 0 1 0-11.92c1.84 0 3.07.78 3.78 1.46l2.58-2.48C16.7 4.02 14.56 3 12 3a9 9 0 1 0 0 18c5.2 0 8.64-3.65 8.64-8.8 0-.6-.07-1.05-.15-1.5z" /></svg>;
}
function Login() {
  const [role, setRole] = useState<AccessRole>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const checkAccess = useServerFn(getMyAccess);
  async function googleSignIn() {
    setError(''); setPending(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
      if (result.error) setError(result.error.message ?? 'Sign-in could not be completed.');
    } catch { setError('Sign-in could not be completed. Please try again.'); }
    finally { setPending(false); }
  }
  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setPending(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) { setError('Email or password is incorrect. Please try again.'); return; }
      if (data.session) {
        const access = await checkAccess();
        if (access.role !== role) {
          await supabase.auth.signOut();
          setError(`This account belongs to ${ROLE_LABELS[access.role]} access. Select that role and sign in again.`);
        }
      }
    } catch { await supabase.auth.signOut(); setError('Your access could not be verified. Please try again.'); }
    finally { setPending(false); }
  }
  return <div className="flex min-h-svh">
    <aside className="hidden w-[440px] shrink-0 flex-col justify-between border-r bg-sidebar p-16 lg:flex">
      <div><Logo /><div className="mt-24 space-y-8 animate-fade-up"><h1 className="max-w-xs text-5xl leading-[1.2]">HR answers,<br />without the<br />guesswork.</h1><p className="max-w-xs text-lg leading-relaxed text-muted-foreground">A little clarity for your working day.</p></div></div>
      <div className="mt-16 border-t pt-6"><div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>Company policies</span><span>People first</span><ShieldCheck className="size-4" aria-label="Secure sign-in" /></div></div>
    </aside>
    <main className="relative flex flex-1 items-center justify-center px-6 py-10 sm:px-12">
      <div className="absolute right-6 top-6"><ThemeToggle /></div>
      <div className="w-full max-w-[420px] animate-fade-up-delayed">
        <div className="mb-10 lg:hidden"><Logo /></div>
        <header className="mb-8"><h2 className="text-2xl leading-snug">Sign in to your workspace</h2><p className="mt-3 text-sm text-muted-foreground">Good to have you here.</p></header>
        <Button variant="outline" disabled={pending} onClick={googleSignIn} className="h-12 w-full shadow-none"><GoogleMark />Continue with Google</Button>
        <div className="my-7 flex items-center gap-4"><span className="flex-1 border-t" /><span className="text-xs text-muted-foreground">or use email</span><span className="flex-1 border-t" /></div>
        <form className="space-y-5" onSubmit={signIn}>
          <fieldset disabled={pending}><legend className="mb-2.5 text-xs font-semibold text-muted-foreground">Access role</legend><div className="grid grid-cols-4 gap-1 rounded-md bg-muted p-1">{ROLES.map(r => <Button key={r} type="button" variant={role === r ? 'outline' : 'ghost'} onClick={() => { setRole(r); setError(''); }} aria-pressed={role === r} className={`h-9 px-2 shadow-none ${role === r ? 'border-accent-strong text-accent-strong' : ''}`}>{ROLE_LABELS[r]}</Button>)}</div></fieldset>
          <div><label htmlFor="email" className="mb-2 block text-xs font-semibold text-muted-foreground">Work email</label><input id="email" type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className={fieldClass} disabled={pending} /></div>
          <div><label htmlFor="password" className="mb-2 block text-xs font-semibold text-muted-foreground">Password</label><div className="relative"><input id="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className={`${fieldClass} pr-12`} disabled={pending} /><Button variant="ghost" size="icon" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'} className="absolute right-1 top-1 text-muted-foreground">{showPassword ? <EyeOff /> : <Eye />}</Button></div></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} className="h-12 w-full shadow-none">{pending ? 'Signing in…' : 'Sign in to NexaHR'}<ArrowRight /></Button>
        </form>
        <div className="mt-8 border-t pt-5"><Button type="button" variant="ghost" onClick={() => setDemoOpen(!demoOpen)} aria-expanded={demoOpen} className="h-auto w-full justify-between px-0 py-2 text-sm text-muted-foreground hover:bg-transparent">Sample accounts<ChevronDown className={demoOpen ? 'rotate-180' : ''} /></Button>
          {demoOpen && <div className="mt-3 space-y-3 text-sm"><p className="text-xs leading-relaxed text-muted-foreground">Public demonstration accounts only. Do not share personal or confidential information.</p><ul className="divide-y rounded-md border bg-card">{demoAccounts.map(account => { const r = account.role as AccessRole; return <li key={r} className="space-y-1.5 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">{ROLE_LABELS[r]}</span><Button variant="outline" size="sm" type="button" className="h-7 shadow-none" onClick={() => { setRole(r); setEmail(account.email); setPassword(account.password); setError(''); }}>Use</Button></div><p className="break-all select-all text-xs">{account.email}</p><p className="break-all select-all text-xs text-muted-foreground">{account.password}</p></li>; })}</ul></div>}
        </div>
      </div>
    </main>
  </div>;
}
const SUGGESTIONS = [
  { category: 'Time off', text: 'How many annual leave days do I get?' },
  { category: 'Leave balance', text: 'Can I carry forward unused leave?' },
  { category: 'Health & wellbeing', text: 'How do I apply for sick leave?' },
  { category: 'Family matters', text: 'What is the bereavement leave policy?' },
];
function Workspace({ user }: { user: User }) {
  const [access, setAccess] = useState<{role: AccessRole; isDemo: boolean} | null>(null);
  const [accessError, setAccessError] = useState('');
  const [input, setInput] = useState('');
  const [view, setView] = useState<'conversation' | 'policies'>('conversation');
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [meta, setMeta] = useState<Record<string, { sources: Source[]; confidence: number }>>({});
  const readAccess = useServerFn(getMyAccess);
  useEffect(() => {
    let active = true;
    readAccess().then(value => { if (active) setAccess(value); }).catch(() => { if (active) setAccessError('Your account access could not be loaded.'); });
    return () => { active = false; };
  }, [readAccess]);
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat', headers: async () => {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token ?? ''}` };
  } }), []);
  const { messages, sendMessage, setMessages, status, error, stop } = useChat({ transport });
  const busy = status === 'submitted' || status === 'streaming';
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'end' }); }, [messages]);
  const ask = (text: string) => {
    if (!text.trim() || busy || !access) return;
    setInput(''); setView('conversation');
    setMeta(value => ({ ...value, [messages.length + 1]: retrieve(text) }));
    void sendMessage({ text });
  };
  const newConversation = () => { stop(); setMessages([]); setMeta({}); setInput(''); setView('conversation'); setMenuOpen(false); };
  const roleLabel = access ? ROLE_LABELS[access.role] : 'Loading access…';
  return <div className="flex min-h-svh">
    {menuOpen && <div className="fixed inset-0 z-20 bg-foreground/20 lg:hidden" onClick={() => setMenuOpen(false)} />}
    <aside className={`${menuOpen ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-30 w-[260px] shrink-0 flex-col border-r bg-sidebar p-7 lg:sticky lg:top-0 lg:flex lg:h-svh`}>
      <div className="flex items-center justify-between"><Logo /><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X /></Button></div>
      <nav className="mt-12 space-y-2" aria-label="Workspace"><p className="mb-4 text-xs text-muted-foreground">Your workspace</p><Button onClick={newConversation} variant="outline" className="w-full justify-start shadow-none"><Plus />New conversation</Button><Button variant={view === 'conversation' ? 'secondary' : 'ghost'} onClick={() => { setView('conversation'); setMenuOpen(false); }} className="w-full justify-start shadow-none"><MessageSquare />HR conversation</Button><Button variant={view === 'policies' ? 'secondary' : 'ghost'} onClick={() => { setView('policies'); setMenuOpen(false); }} className="w-full justify-start shadow-none"><BookOpen />Company policies</Button></nav>
      <div className="mt-auto pt-10"><div className="border-t pt-5"><p className="text-sm font-medium">{roleLabel}{access?.isDemo ? ' · Demo' : ''}</p><p className="mt-1 break-all text-xs text-muted-foreground">{user.email}</p><Button variant="ghost" className="mt-4 justify-start px-0 text-muted-foreground hover:bg-transparent" onClick={async () => { stop(); const { error } = await supabase.auth.signOut(); if (error) setSignOutError('Sign-out failed. Please try again.'); }}><LogOut />Sign out</Button>{signOutError && <p role="alert" className="text-xs text-destructive">{signOutError}</p>}</div></div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex min-h-20 items-center justify-between gap-3 border-b px-6 sm:px-10"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu /></Button><span className="text-sm">{view === 'policies' ? 'Company policies' : 'People & workplace'}</span></div><div className="flex items-center gap-1"><span className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4" />{access?.isDemo ? 'Demo workspace' : 'NexaHR'}</span><ThemeToggle /></div></header>
      {accessError && <div role="alert" className="mx-6 mt-5 flex flex-wrap items-center gap-3 text-sm text-destructive">{accessError}<Button variant="outline" onClick={() => { setAccessError(''); readAccess().then(setAccess).catch(() => setAccessError('Your account access could not be loaded.')); }}>Try again</Button></div>}
      {view === 'policies' ? <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-10"><h1 className="text-3xl">Company policies</h1><p className="mt-3 text-sm text-muted-foreground">The reference for your workplace questions.</p><div className="mt-10 divide-y border-y">{kb.policies.map(policy => <details key={policy.id} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4"><span><span className="block text-xs text-muted-foreground">{policy.name} · §{policy.section.split('-')[1] ?? policy.section}</span><span className="mt-1 block font-medium">{policy.title}</span></span><ChevronDown className="size-4 shrink-0 group-open:rotate-180" /></summary><div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground"><p>{policy.text}</p>{policy.rule && <p>{policy.rule}</p>}{policy.form && <p>Form: {policy.form}</p>}</div></details>)}</div></main> : <>
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-8 pt-12 sm:px-10">
          {!messages.length && <div className="py-8 sm:py-14 animate-fade-up"><p className="mb-5 text-sm text-muted-foreground">Your HR desk</p><h1 className="max-w-xl text-3xl leading-snug sm:text-4xl">A clearer answer.<br />A simpler working day.</h1><p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground">What would you like to know about your company policies?</p><div className="mt-10 grid gap-3 sm:grid-cols-2">{SUGGESTIONS.map(s => <Button key={s.text} variant="outline" disabled={busy || !access} onClick={() => ask(s.text)} className="h-auto min-h-28 justify-between whitespace-normal px-5 py-5 text-left shadow-none transition-all hover:border-accent-strong hover:bg-accent-soft"><span><span className="mb-2 block text-xs font-normal text-muted-foreground">{s.category}</span><span className="block text-sm font-medium leading-relaxed">{s.text}</span></span><ArrowRight className="ml-3" /></Button>)}</div></div>}
          <div className="space-y-8">{messages.map((message, index) => {
            const text = message.parts.map(p => p.type === 'text' ? p.text : '').join('');
            if (message.role === 'user') return <div key={message.id} className="ml-auto w-fit max-w-[90%] rounded-md bg-muted px-5 py-3 text-sm leading-relaxed animate-fade-up">{text}</div>;
            const info = meta[index];
            return <article key={message.id} className="py-2 animate-fade-up"><p className="mb-4 text-xs font-semibold text-muted-foreground">NexaHR · HR desk</p><div className="space-y-3 text-sm leading-relaxed [&_li]:ml-5 [&_p]:mb-3 [&_ul]:list-disc"><ReactMarkdown>{text || 'Looking into your question…'}</ReactMarkdown></div>{info && info.sources.length > 0 && <div className="mt-5 border-t pt-4"><div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>Policy references</span><span className="text-accent-strong">Retrieval confidence {Math.round(info.confidence * 100)}%</span></div><div className="mt-3 space-y-2">{info.sources.slice(0,3).map(source => <details key={source.id} className="text-xs"><summary className="cursor-pointer text-muted-foreground hover:text-accent-strong">{source.cite} · {source.title}</summary><p className="mt-2 leading-relaxed">{source.text}</p></details>)}</div></div>}</article>;
          })}{status === 'submitted' && <p role="status" className="text-sm text-muted-foreground">Checking company policies…</p>}{error && <p role="alert" className="text-sm text-destructive">We couldn’t complete that answer. Please try your question again.</p>}<div ref={end} /></div>
        </main>
        <form onSubmit={event => { event.preventDefault(); ask(input); }} className="sticky bottom-0 mx-auto w-full max-w-4xl bg-background px-6 pb-6 pt-3 sm:px-10"><div className="flex items-center gap-2 rounded-md border bg-card p-2 focus-within:border-foreground"><input aria-label="Your HR question" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask your HR question…" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground" disabled={!access} />{busy ? <Button type="button" variant="outline" size="icon" onClick={stop} aria-label="Stop answer" title="Stop answer"><Square /></Button> : <Button type="submit" size="icon" disabled={!input.trim() || !access} aria-label="Send question" title="Send question"><ArrowRight /></Button>}</div><p className="mt-3 text-center text-xs text-muted-foreground">{access?.isDemo ? 'Demo account · Please keep confidential information out of this conversation.' : 'For individual circumstances, contact your HR team.'}</p></form>
      </>}
    </div>
  </div>;
}
