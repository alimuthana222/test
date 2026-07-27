import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { NabdaLogo } from "@/components/nabda-logo";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ShieldCheck,
  Users,
  Activity,
  ArrowLeft,
  Clock,
  BellRing,
  CheckCircle2,
  Stethoscope,
  ArrowDown,
  Sparkles,
  Sun,
  Moon,
  ChevronLeft,
  Star,
  TrendingUp,
  Zap,
  Globe2,
} from "lucide-react";
import heroImg from "@/assets/hero-illustration.png";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "nabda — منصة حجز المواعيد للعيادات في العراق" },
      {
        name: "description",
        content:
          "nabda تربط عيادتك بآلاف المرضى في العراق — إدارة مواعيد، تقويم للأطباء، وسجل مرضى بواجهة عربية كاملة.",
      },
      { property: "og:title", content: "nabda — Healthcare begins here" },
      { property: "og:description", content: "منصة حجز مواعيد طبية متكاملة للعيادات في العراق." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
} as Parameters<typeof createFileRoute<"/">>[0]));

// ─── Helpers ───────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return { count, ref };
}

function useDarkMode() {
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const toggle = () => {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  };
  return { dark, toggle };
}

// ─── Animation presets ─────────────────────────────────────────────────────

const fadeUp = (delay = 0, distance = 28) => ({
  initial: { opacity: 0, y: distance },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, delay },
});

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const cardReveal = {
  initial: { opacity: 0, y: 32, scale: 0.97 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

// ─── Feature card data ──────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Calendar,
    title: "تقويم مواعيد ذكي",
    text: "شوف مواعيد اليوم والأسبوع لكل طبيب، وأكّد أو ألغِ بضغطة واحدة.",
    color: "from-teal-500 to-cyan-400",
    glow: "shadow-[0_8px_30px_-8px_rgba(11,110,110,0.45)]",
  },
  {
    icon: Clock,
    title: "أوقات دوام مرنة",
    text: "حدّد أوقات كل طبيب لكل يوم، والنظام يمنع التعارض تلقائيًا.",
    color: "from-blue-500 to-indigo-400",
    glow: "shadow-[0_8px_30px_-8px_rgba(59,130,246,0.4)]",
  },
  {
    icon: Users,
    title: "سجل مرضى مركزي",
    text: "بيانات المريض، تاريخه، وعدد زياراته الفعلية مربوطين بحسابه.",
    color: "from-violet-500 to-purple-400",
    glow: "shadow-[0_8px_30px_-8px_rgba(139,92,246,0.4)]",
  },
  {
    icon: BellRing,
    title: "إشعارات فورية",
    text: "المريض يستلم إشعار لحظة تأكيد أو تغيير الحجز في تطبيق nabda.",
    color: "from-orange-500 to-amber-400",
    glow: "shadow-[0_8px_30px_-8px_rgba(249,115,22,0.4)]",
  },
  {
    icon: Stethoscope,
    title: "متعدد الأطباء",
    text: "أضف كل أطباء عيادتك، ووزّع المواعيد حسب التخصص والدوام.",
    color: "from-emerald-500 to-green-400",
    glow: "shadow-[0_8px_30px_-8px_rgba(16,185,129,0.4)]",
  },
  {
    icon: ShieldCheck,
    title: "أمان طبي معياري",
    text: "بيانات كل عيادة معزولة (RLS)، وكل عملية على السجلات مسجّلة.",
    color: "from-rose-500 to-pink-400",
    glow: "shadow-[0_8px_30px_-8px_rgba(244,63,94,0.4)]",
  },
];

// ─── How It Works steps ─────────────────────────────────────────────────────

const HOW_STEPS = [
  { num: "01", title: "سجّل عيادتك", text: "أنشئ حساب لعيادتك بدقيقة واحدة وأضف معلوماتها الأساسية.", icon: Globe2 },
  { num: "02", title: "أضف أطباءك", text: "سجّل كل أطباء عيادتك وحدّد أوقات دوامهم الأسبوعية.", icon: Stethoscope },
  { num: "03", title: "استقبل الحجوزات", text: "يبدأ المرضى بحجز مواعيد من التطبيق، وتستلمها مباشرة.", icon: BellRing },
];

// ─── Stats ──────────────────────────────────────────────────────────────────

const STATS = [
  { value: 120, suffix: "+", label: "عيادة مسجّلة", icon: TrendingUp },
  { value: 8000, suffix: "+", label: "موعد شهريًا", icon: Calendar },
  { value: 18, suffix: "", label: "محافظة عراقية", icon: Globe2 },
  { value: 98, suffix: "%", label: "رضا العيادات", icon: Star },
];

// ─── Components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary font-latin">
      {children}
    </span>
  );
}

function StatCounter({ value, suffix, label, icon: Icon }: typeof STATS[0]) {
  const { count, ref } = useCountUp(value);
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="size-12 rounded-2xl bg-white/15 grid place-items-center mb-1">
        <Icon className="size-5 text-white" />
      </div>
      <div className="font-latin text-4xl md:text-5xl font-extrabold text-white tracking-tight">
        <span ref={ref}>{count.toLocaleString("en")}</span>
        <span className="text-white/70">{suffix}</span>
      </div>
      <div className="text-sm text-white/75">{label}</div>
    </div>
  );
}

// ─── Landing Page ───────────────────────────────────────────────────────────

function Landing() {
  const { dark, toggle } = useDarkMode();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, 60]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir="rtl">

      {/* ─── Navbar ─────────────────────────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-50 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-5 md:px-8 h-16 md:h-18 flex items-center justify-between">
          <NabdaLogo />
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors duration-200">الميزات</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition-colors duration-200">كيف يعمل</a>
            <a href="#stats" className="text-muted-foreground hover:text-foreground transition-colors duration-200">الأرقام</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="تبديل الوضع الليلي"
              className="size-9 rounded-xl border border-border/60 bg-card/80 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Link
              to="/auth"
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
            >
              دخول العيادات
            </Link>
            <Button
              asChild
              size="sm"
              className="rounded-full px-5 bg-brand-gradient shadow-brand-sm hover:shadow-brand hover:scale-[1.03] transition-all duration-200 animate-glow-pulse"
            >
              <a href="/auth?mode=signup">سجّل عيادتك</a>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden bg-hero-section min-h-[92vh] flex items-center">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 size-[500px] rounded-full bg-primary/10 blur-[80px] pointer-events-none animate-float-slow" aria-hidden />
        <div className="absolute top-1/2 -right-24 size-80 rounded-full bg-accent/20 blur-[60px] pointer-events-none" style={{ animationDelay: "1s" }} aria-hidden />
        <div className="absolute bottom-0 left-1/3 size-60 rounded-full bg-primary/8 blur-[50px] pointer-events-none animate-float-slow" aria-hidden />

        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-pattern opacity-50" aria-hidden />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28 grid md:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center w-full"
        >
          {/* Left: Text */}
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
           

            <motion.h1 {...fadeUp(0.1)} className="mt-5 text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1]">
              إدارة مواعيد عيادتك،
              <br />
              <span className="text-gradient-brand">أبسط من أي وقت مضى.</span>
            </motion.h1>

            <motion.p {...fadeUp(0.18)} className="mt-5 text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
              nabda لوحة تحكم متكاملة تربط عيادتك بتطبيق المرضى — تقويم مواعيد،
              إدارة أوقات الأطباء، سجلات مرضى، وإشعارات فورية. كل شي بمكان واحد.
            </motion.p>

            <motion.div {...fadeUp(0.26)} className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 bg-brand-gradient shadow-brand hover:scale-[1.03] hover:shadow-[0_20px_50px_-12px_rgba(11,110,110,0.6)] transition-all duration-300"
              >
                <a href="/auth?mode=signup">
                  سجّل عيادتك مجانًا
                  <ArrowLeft className="size-4 mr-2 rtl:rotate-180" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8 border-primary/25 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
              >
                <a href="#how">كيف يعمل؟</a>
              </Button>
            </motion.div>

            <motion.ul {...fadeUp(0.34)} className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-muted-foreground">
              {[
                { text: "بدون رسوم اشتراك", icon: CheckCircle2 },
                { text: "واجهة عربية كاملة", icon: CheckCircle2 },
                { text: "متزامنة مع تطبيق nabda", icon: CheckCircle2 },
              ].map((item) => (
                <li key={item.text} className="inline-flex items-center gap-2">
                  <item.icon className="size-4 text-success shrink-0" />
                  {item.text}
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Right: Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="relative hidden md:block"
          >
            {/* Glow behind card */}
            <div className="absolute -inset-6 bg-brand-gradient rounded-[3rem] blur-[40px] opacity-20" aria-hidden />

            {/* Main dashboard card */}
            <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-elevated bg-card">
              <img
                src={heroImg}
                alt="لوحة تحكم مواعيد عيادة nabda"
                width={1280}
                height={1024}
                className="w-full h-auto"
                loading="eager"
              />
            </div>

            {/* Floating: confirmed booking */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-5 -right-6 glass-card rounded-2xl shadow-elevated p-4 flex items-center gap-3 w-56 animate-float"
            >
              <div className="size-10 rounded-xl bg-success/15 grid place-items-center text-success shrink-0">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">حجز مؤكد</div>
                <div className="text-sm font-bold">علي مثنى · 09:00</div>
              </div>
            </motion.div>

            {/* Floating: stats chip */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -top-5 -left-6 glass-card rounded-2xl shadow-elevated px-4 py-3 flex items-center gap-3 animate-float"
              style={{ animationDelay: "1s" }}
            >
              <div className="size-9 rounded-xl bg-brand-gradient grid place-items-center text-white shrink-0">
                <Activity className="size-4" />
              </div>
              <div>
                <div className="font-latin text-lg font-extrabold text-primary">١٢ موعد</div>
                <div className="text-[11px] text-muted-foreground">اليوم في عيادتك</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          {...fadeIn(1.4)}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/60"
        >
          <span className="text-xs font-latin tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <ArrowDown className="size-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-7xl px-5 md:px-8 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <SectionLabel>كيف يعمل</SectionLabel>
          <h2 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
            ثلاث خطوات وعيادتك تشتغل
          </h2>
          <p className="mt-3 text-muted-foreground text-base leading-relaxed">
            ما تحتاج خبرة تقنية — سجّل، أضف أطباءك، وابدأ استقبال المواعيد خلال دقائق.
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-14 right-[calc(33%+2rem)] left-[calc(33%+2rem)] h-px bg-gradient-to-l from-border via-primary/40 to-border" aria-hidden />

          {HOW_STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              {...cardReveal}
              transition={{ ...cardReveal.transition, delay: i * 0.12 }}
              className="relative flex flex-col items-center text-center gap-4 group"
            >
              <div className="relative size-28 rounded-3xl bg-brand-gradient-soft border border-primary/15 grid place-items-center group-hover:bg-primary/10 transition-colors duration-300">
                <step.icon className="size-10 text-primary" strokeWidth={1.5} />
                <span className="absolute -top-3 -right-3 size-7 rounded-full bg-brand-gradient text-white text-xs font-bold font-latin grid place-items-center shadow-brand-sm">
                  {step.num.split("0")[1]}
                </span>
              </div>
              <h3 className="text-lg font-bold">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="bg-muted/40 py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <SectionLabel>الميزات</SectionLabel>
            <h2 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
              كل شي تحتاجه عيادتك، بمكان واحد
            </h2>
            <p className="mt-3 text-muted-foreground text-base leading-relaxed">
              مصممة خصيصًا للعيادات العراقية — بالعربي، بواجهة نظيفة، وسريعة الاستخدام.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...cardReveal}
                transition={{ ...cardReveal.transition, delay: i * 0.07 }}
                className="group rounded-2xl border border-border/50 bg-card p-6 shadow-card-soft hover:-translate-y-1.5 hover:shadow-card-hover hover:border-primary/20 transition-all duration-300 cursor-default"
              >
                <div className={`size-13 rounded-2xl bg-gradient-to-br ${f.color} grid place-items-center text-white group-hover:scale-110 transition-transform duration-300 ${f.glow}`}>
                  <f.icon className="size-6" strokeWidth={1.8} />
                </div>
                <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span>اعرف أكثر</span>
                  <ChevronLeft className="size-3.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ──────────────────────────────────────────────────────── */}
      <section id="stats" className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-brand-gradient-hero" aria-hidden />
        <div className="absolute inset-0 bg-dot-pattern opacity-20" aria-hidden />
        <div className="absolute top-0 left-0 size-80 rounded-full bg-white/5 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 right-0 size-60 rounded-full bg-white/5 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-5 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white font-latin">
              <Sparkles className="size-3.5" />
              nabda by the numbers
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-white">
              أرقام تتكلم عن نفسها
            </h2>
          </motion.div>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <StatCounter {...stat} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl bg-brand-gradient p-10 md:p-16 text-white shadow-brand"
        >
          {/* Decorative radial */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_15%_30%,white,transparent_55%)]" aria-hidden />
          <div className="absolute -left-8 -bottom-8 size-64 opacity-10">
            <NabdaLogo variant="mark" tone="light" className="size-full" />
          </div>
          <div className="absolute inset-0 bg-dot-pattern opacity-15" aria-hidden />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold">
              <Zap className="size-3.5" /> ابدأ خلال دقائق
            </span>
            <h2 className="mt-5 text-3xl md:text-4xl font-extrabold leading-tight">
              جاهز تستقبل حجوزات إلكترونية من مرضاك؟
            </h2>
            <p className="mt-4 text-white/80 text-base leading-relaxed max-w-xl">
              سجّل عيادتك اليوم، أضف أطباءك وأوقات دوامهم، وابدأ استقبال المواعيد من تطبيق nabda مباشرة. مجانًا، بلا قيود.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-primary hover:bg-white/95 shadow-elevated font-bold px-8 hover:scale-[1.02] transition-all duration-200"
              >
                <a href="/auth?mode=signup">سجّل عيادتك مجانًا</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full bg-transparent border-white/35 text-white hover:bg-white/10 hover:border-white/60 hover:text-white transition-all duration-200 px-8"
              >
                <Link to="/auth">لدي حساب — دخول</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-10 pb-10 border-b border-border/60">
            <div>
              <NabdaLogo />
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
                منصة حجز مواعيد طبية متكاملة للعيادات في العراق — تربط الأطباء بمرضاهم.
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 font-latin">
                Platform
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">الميزات</a></li>
                <li><a href="#how" className="hover:text-foreground transition-colors">كيف يعمل</a></li>
                <li><a href="#stats" className="hover:text-foreground transition-colors">الأرقام</a></li>
                <li><a href="/auth?mode=signup" className="hover:text-foreground transition-colors">تسجيل عيادة</a></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 font-latin">
                Product
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="/auth" className="hover:text-foreground transition-colors">دخول العيادات</a></li>
                <li><span className="text-muted-foreground/60">تطبيق nabda للمرضى</span></li>
                <li><span className="text-muted-foreground/60">سياسة الخصوصية</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} nabda. جميع الحقوق محفوظة.</span>
            <span className="font-latin">Healthcare begins here.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}