"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/Button";

/* ============================================================
   Scroll-triggered reveal hook
   ============================================================ */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ============================================================
   Animated counter hook
   ============================================================ */
function useCounter(target: number, duration = 1800, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return value;
}

/* ============================================================
   Feature data
   ============================================================ */
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Gift Tracking",
    desc: "Log every gift as it arrives with guest name, description, and address. Search and filter instantly.",
    span: "sm:col-span-1",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 6l-10 7L2 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Thank You Letters",
    desc: "Generate personalized letters in one click. Copy to clipboard or print on beautiful stationery.",
    span: "sm:col-span-1",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Guest Management",
    desc: "Full address book with invite tracking, RSVP status, meal choices, dietary notes, and plus-ones.",
    span: "sm:col-span-1",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "CSV Import & Export",
    desc: "Bulk import your guest list. Export address labels ready for Canva, Shutterfly, or Walmart Photo.",
    span: "sm:col-span-1",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Progress Tracking",
    desc: "See exactly how many thank yous are left. A progress bar keeps you motivated to finish.",
    span: "sm:col-span-1",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Private & Secure",
    desc: "Your data is protected with row-level security. Only you can see your gifts and guests.",
    span: "sm:col-span-1",
  },
];

/* ============================================================
   Steps data
   ============================================================ */
const STEPS = [
  { num: "01", title: "Create your account", desc: "Sign up in seconds — free, no credit card." },
  { num: "02", title: "Add your gifts & guests", desc: "Log gifts as they arrive, or bulk import a CSV." },
  { num: "03", title: "Write & send thank yous", desc: "Generate letters, track progress, mark them done." },
];

/* ============================================================
   Landing Page
   ============================================================ */
export default function LandingPage() {
  const { user, loading } = useAuth();

  const hero = useReveal(0.1);
  const features = useReveal(0.1);
  const preview = useReveal(0.15);
  const steps = useReveal(0.1);
  const stats = useReveal(0.2);
  const cta = useReveal(0.1);

  const giftsCount = useCounter(247, 1600, stats.visible);
  const lettersCount = useCounter(189, 1600, stats.visible);
  const couplesCount = useCounter(64, 1200, stats.visible);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const AuthCTA = useCallback(({ variant = "primary" as "primary" | "outline", size = "lg" as "sm" | "md" | "lg", label }: { variant?: "primary" | "outline"; size?: "sm" | "md" | "lg"; label?: string }) => {
    if (!loading && user) {
      return (
        <Link href="/dashboard">
          <Button variant={variant} size={size}>Go to Dashboard</Button>
        </Link>
      );
    }
    return (
      <Link href="/login">
        <Button variant={variant} size={size}>{label || "Get Started Free"}</Button>
      </Link>
    );
  }, [loading, user]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">

      {/* ============== STICKY NAV ============== */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-xl py-3"
          : "bg-transparent py-5"
      }`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <Link href="/" className="font-heading text-xl tracking-wider text-text transition-colors hover:text-primary">
            Thank You Tracker
          </Link>
          <div className="flex items-center gap-3">
            {!loading && user ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="link" size="sm">Sign In</Button>
                </Link>
                <Link href="/login">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ============== HERO ============== */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 pt-24 text-center">
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/[0.06] blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-secondary/[0.08] blur-3xl" />
        </div>

        <div ref={hero.ref} className={`reveal ${hero.visible ? "visible" : ""} relative`}>
          <p className="mb-4 text-sm font-medium uppercase tracking-[4px] text-secondary">
            Wedding Gift Management
          </p>
          <h1 className="max-w-3xl font-heading text-4xl leading-[1.2] tracking-wide text-text sm:text-5xl md:text-6xl md:leading-[1.15]">
            Never forget a{" "}
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] bg-clip-text text-transparent" style={{ animation: "shimmer 6s linear infinite" }}>
              thank you
            </span>{" "}
            note
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-text-muted sm:text-xl">
            Track every wedding gift, manage your guest list, and send heartfelt
            thank you letters — all in one beautiful, free tool.
          </p>

          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <AuthCTA />
            {(loading || !user) && (
              <Link href="#features">
                <Button variant="outline" size="lg">See How It Works</Button>
              </Link>
            )}
          </div>

          <p className="mt-5 text-sm text-text-muted/70">
            Free forever &middot; No credit card required
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ animation: "float 3s ease-in-out infinite" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted/40">
            <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ============== APP PREVIEW ============== */}
      <section className="px-6 pb-16 pt-4">
        <div ref={preview.ref} className={`reveal ${preview.visible ? "visible" : ""} mx-auto max-w-4xl`}>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-surface shadow-elevated">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-border/40 bg-surface px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-secondary/30" />
              <span className="h-3 w-3 rounded-full bg-primary/20" />
              <span className="h-3 w-3 rounded-full bg-success/20" />
              <span className="ml-3 flex-1 rounded-md bg-background/80 px-4 py-1.5 text-xs text-text-muted/60 text-center">
                thankyoutracker.app/dashboard
              </span>
            </div>
            {/* Mock dashboard */}
            <div className="bg-background p-6 sm:p-8">
              {/* Mock header */}
              <div className="mb-6 text-center">
                <h3 className="font-heading text-xl tracking-wider text-text">Thank You Tracker</h3>
                <p className="text-sm text-text-muted">Sarah & James</p>
              </div>
              {/* Mock stats */}
              <div className="mb-6 flex justify-center gap-8">
                <div className="text-center">
                  <span className="block text-2xl font-semibold text-primary">24</span>
                  <span className="text-[0.65rem] uppercase tracking-wider text-text-muted">Total Gifts</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-semibold text-primary">18</span>
                  <span className="text-[0.65rem] uppercase tracking-wider text-text-muted">Thanked</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-semibold text-primary">6</span>
                  <span className="text-[0.65rem] uppercase tracking-wider text-text-muted">Remaining</span>
                </div>
              </div>
              {/* Mock progress */}
              <div className="mb-6">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-secondary to-primary transition-all" />
                </div>
                <p className="mt-1 text-center text-xs text-text-muted">75% complete</p>
              </div>
              {/* Mock gift cards */}
              <div className="flex flex-col gap-3">
                {[
                  { name: "Aunt Margaret", gift: "KitchenAid Stand Mixer", sent: false },
                  { name: "The Johnsons", gift: "Pottery Barn Dinnerware Set", sent: false },
                  { name: "Uncle David", gift: "Le Creuset Dutch Oven", sent: true },
                ].map((g) => (
                  <div key={g.name} className="flex items-center justify-between rounded-md border border-border/60 border-l-[3px] border-l-primary/40 bg-background px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{g.name}</p>
                      <p className="text-xs text-text-muted">{g.gift}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[0.6rem] uppercase tracking-wider ${
                      g.sent
                        ? "bg-success/15 text-success"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {g.sent ? "Sent" : "Send Thank You"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== FEATURES ============== */}
      <section id="features" className="border-t border-border/60 bg-surface/40 px-6 py-20 sm:px-10">
        <div ref={features.ref} className={`reveal ${features.visible ? "visible" : ""} mx-auto max-w-5xl`}>
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-[3px] text-secondary">
            Features
          </p>
          <h2 className="mb-3 text-center font-heading text-3xl tracking-wider text-text sm:text-4xl">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-text-muted">
            Built specifically for newly married couples who want to stay organized
            and express gratitude beautifully.
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border/40 bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/8 text-primary transition-colors group-hover:bg-primary/15">
                  {f.icon}
                </div>
                <h3 className="mb-1.5 font-heading text-lg tracking-wide text-text">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section className="px-6 py-20 sm:px-10">
        <div ref={steps.ref} className={`reveal ${steps.visible ? "visible" : ""} mx-auto max-w-4xl`}>
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-[3px] text-secondary">
            How It Works
          </p>
          <h2 className="mb-12 text-center font-heading text-3xl tracking-wider text-text sm:text-4xl">
            Up and running in minutes
          </h2>

          <div className="relative flex flex-col gap-12 sm:flex-row sm:gap-0">
            {/* Connecting line (desktop) */}
            <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent sm:block" />

            {STEPS.map((s, i) => (
              <div key={s.num} className="relative flex-1 text-center sm:px-6" style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="relative z-10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/30 bg-background">
                  <span className="font-heading text-xl text-primary">{s.num}</span>
                </div>
                <h3 className="mb-1.5 font-heading text-lg tracking-wide text-text">
                  {s.title}
                </h3>
                <p className="mx-auto max-w-[220px] text-sm leading-relaxed text-text-muted">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== STATS / SOCIAL PROOF ============== */}
      <section className="border-t border-border/60 bg-surface/40 px-6 py-16 sm:px-10">
        <div ref={stats.ref} className={`reveal ${stats.visible ? "visible" : ""} mx-auto max-w-4xl`}>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <span className="block font-heading text-4xl text-primary sm:text-5xl">{giftsCount}+</span>
              <span className="mt-1 block text-sm text-text-muted">Gifts Tracked</span>
            </div>
            <div>
              <span className="block font-heading text-4xl text-primary sm:text-5xl">{lettersCount}+</span>
              <span className="mt-1 block text-sm text-text-muted">Letters Sent</span>
            </div>
            <div>
              <span className="block font-heading text-4xl text-primary sm:text-5xl">{couplesCount}+</span>
              <span className="mt-1 block text-sm text-text-muted">Happy Couples</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============== TESTIMONIAL-STYLE CALLOUT ============== */}
      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <svg viewBox="0 0 24 24" fill="currentColor" className="mx-auto mb-4 h-8 w-8 text-primary/20">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <blockquote className="font-heading text-2xl leading-relaxed tracking-wide text-text sm:text-3xl">
            We received over 80 gifts at our wedding. This tool saved us from
            the sticky-note chaos and helped us thank every single person.
          </blockquote>
          <p className="mt-5 text-sm text-text-muted">
            Built by a couple, for couples
          </p>
        </div>
      </section>

      {/* ============== FINAL CTA ============== */}
      <section className="border-t border-border/60 px-6 py-20 text-center sm:px-10">
        <div ref={cta.ref} className={`reveal ${cta.visible ? "visible" : ""}`}>
          <h2 className="mb-3 font-heading text-3xl tracking-wider text-text sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-lg text-text-muted">
            Join couples who are staying organized and expressing gratitude — one thank you at a time.
          </p>
          <AuthCTA />
          <p className="mt-4 text-sm text-text-muted/60">
            Free forever &middot; No ads &middot; No limits
          </p>
        </div>
      </section>

      {/* ============== FOOTER ============== */}
      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="font-heading text-sm tracking-wider text-text-muted">
            Thank You Tracker
          </span>
          <div className="flex gap-6 text-sm text-text-muted">
            <Link href="/login" className="transition-colors hover:text-primary">Sign In</Link>
            <Link href="/login" className="transition-colors hover:text-primary">Create Account</Link>
          </div>
          <span className="text-xs text-text-muted/60">
            Built with care for your big day.
          </span>
        </div>
      </footer>
    </div>
  );
}
