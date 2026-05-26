import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Code2,
  Rocket,
  Wand2,
  Bot,
  Layers,
  ArrowRight,
  CheckCircle2,
  Github,
  Triangle,
} from "lucide-react";

const HERO_BG =
  "https://static.prod-images.emergentagent.com/jobs/7603ccbe-97ca-4a50-a468-843d48ad91b0/images/2314d1d90f98bd6507a82b51e45142f29cecde935e3aa509352e0aa4c6e1af57.png";

const LOGO =
  "https://static.prod-images.emergentagent.com/jobs/7603ccbe-97ca-4a50-a468-843d48ad91b0/images/9e68df844fa2d6fe4e61fc68000dd724d05e2abe6cc4f86c205fc5110f8ee8cb.png";

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [user, loading, navigate]);

  const handleSignIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(
      redirectUrl
    )}`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950">
      {/* Top nav */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/70 border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5" data-testid="brand-logo">
            <div className="w-7 h-7 rounded-md bg-white grid place-items-center">
              <Sparkles className="w-4 h-4 text-zinc-950" />
            </div>
            <span className="text-sm font-medium tracking-tight">Galio AI Studio</span>
            <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              beta
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-white transition-colors">
              Workflow
            </a>
            <a href="#templates" className="hover:text-white transition-colors">
              Templates
            </a>
          </nav>
          <Button
            data-testid="signin-btn"
            onClick={handleSignIn}
            className="bg-white hover:bg-zinc-200 text-zinc-950 font-medium rounded-md px-4 h-9 transition-all active:scale-95"
          >
            Sign in
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            backgroundImage: `url(${HERO_BG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-zinc-950/50 via-zinc-950/80 to-zinc-950" />

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-32">
          <div className="max-w-3xl fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-300 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-white ai-pulse" />
              Powered by Claude Sonnet 4.5
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.05]">
              Build any website
              <br />
              <span className="text-zinc-500">just by describing it.</span>
            </h1>
            <p className="mt-6 text-zinc-400 text-lg max-w-xl leading-relaxed">
              Galio is an AI website studio. Plan, build, debug, refine and publish
              production-ready sites — for restaurants, lawyers, SaaS, cameras,
              anything — in a single chat-driven workspace.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button
                data-testid="start-building-btn"
                onClick={handleSignIn}
                className="bg-white text-zinc-950 hover:bg-zinc-200 h-12 px-6 rounded-md text-sm font-medium tracking-tight transition-all active:scale-95"
              >
                Start building free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <a
                href="#workflow"
                className="h-12 px-5 rounded-md border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50 text-sm text-zinc-200 inline-flex items-center transition-colors"
              >
                See workflow
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> No credit card
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Export ZIP
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> One-click publish
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">
                01 — Capabilities
              </p>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight max-w-xl">
                Everything you need to ship.
              </h2>
            </div>
            <p className="hidden md:block text-sm text-zinc-400 max-w-sm">
              A studio designed for the new era of AI-assisted web building.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900 border border-zinc-900 rounded-xl overflow-hidden">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="bg-zinc-950 p-8 hover:bg-zinc-900/60 transition-colors"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <f.icon className="w-5 h-5 text-white mb-5" />
                <h3 className="text-base font-medium tracking-tight">{f.title}</h3>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="relative border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">
            02 — Workflow
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight max-w-2xl">
            Five modes. One canvas.
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-3">
            {MODES.map((m, i) => (
              <div
                key={m.label}
                className="border border-zinc-900 rounded-xl p-5 bg-zinc-950 hover:border-zinc-800 transition-colors"
              >
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3">
                  step 0{i + 1}
                </div>
                <div className="text-sm font-medium tracking-tight">{m.label}</div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-900">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight">
            Your next website is one prompt away.
          </h2>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
            Sign in with Google and start building in under thirty seconds.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              data-testid="cta-signin-btn"
              onClick={handleSignIn}
              className="bg-white text-zinc-950 hover:bg-zinc-200 h-12 px-6 rounded-md font-medium transition-all active:scale-95"
            >
              Continue with Google
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> Galio AI Studio © 2026
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5" /> GitHub
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Triangle className="w-3.5 h-3.5" /> Vercel
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: Bot,
    title: "Universal AI architect",
    desc: "Describe any topic — restaurants, law firms, cameras, SaaS — and Galio generates a complete, on-brand site.",
  },
  {
    icon: Code2,
    title: "Live code panel",
    desc: "Inspect HTML, CSS and JS produced by the AI. Edit, export, or push straight to GitHub.",
  },
  {
    icon: Wand2,
    title: "Refine in plain English",
    desc: "“Make the hero darker”, “add a pricing section”. Galio edits the right sections, not the whole file.",
  },
  {
    icon: Layers,
    title: "Versions & undo",
    desc: "Every generation is snapshotted. Roll back with one click. Never lose a good draft.",
  },
  {
    icon: Rocket,
    title: "Publish anywhere",
    desc: "Export ZIP, push to GitHub or one-click deploy to Vercel (mocked in beta).",
  },
  {
    icon: Sparkles,
    title: "Device-perfect preview",
    desc: "Switch between desktop, tablet and mobile frames as you build.",
  },
];

const MODES = [
  { label: "Plan", desc: "Outline sections and structure before any code is generated." },
  { label: "Build", desc: "Generate the full website from a single prompt." },
  { label: "Debug", desc: "Find and fix issues in the current draft." },
  { label: "Refine", desc: "Edit copy, colors, sections and components in place." },
  { label: "Publish", desc: "Export, push to GitHub, or deploy to Vercel." },
];
