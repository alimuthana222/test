import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useStaffSession } from "@/hooks/use-staff-session";
import { NabdaLogo } from "@/components/nabda-logo";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  LayoutDashboard,
  Users,
  Clock,
  LogOut,
  Loader2,
  UserRound,
  MapPin,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/clinic")({
  head: () => ({
    meta: [
      { title: "لوحة العيادة · nabda" },
      { name: "description", content: "لوحة تحكم عيادتك على منصة nabda." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClinicLayout,
});

const NAV = [
  {
    to: "/clinic",
    label: "الرئيسية",
    icon: LayoutDashboard,
    exact: true,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    to: "/clinic/appointments",
    label: "المواعيد",
    icon: Calendar,
    exact: false,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  {
    to: "/clinic/availability",
    label: "أوقات الدوام",
    icon: Clock,
    exact: false,
    color: "text-violet-600",
    bg: "bg-violet-500/10",
  },
  {
    to: "/clinic/patients",
    label: "المرضى",
    icon: Users,
    exact: false,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
  {
    to: "/clinic/profile",
    label: "البروفايل",
    icon: UserRound,
    exact: false,
    color: "text-orange-600",
    bg: "bg-orange-500/10",
  },
] as const;

function ClinicLayout() {
  const navigate = useNavigate();
  const { status, staff, clinic } = useStaffSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "signed-out") navigate({ to: "/auth", replace: true });
  }, [status, navigate]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (status === "loading" || status === "signed-out") {
    return (
      <div className="min-h-screen grid place-items-center bg-background" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <NabdaLogo />
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (status === "no-staff") {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-6" dir="rtl">
        <div className="max-w-md text-center">
          <NabdaLogo className="justify-center" />
          <h1 className="mt-8 text-xl font-bold">حسابك غير مربوط بأي عيادة</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            سجّلت دخول بنجاح، بس ما لكينا صف موظف مربوط بحسابك. تواصل مع
            مسؤول عيادتك أو أنشئ عيادة جديدة.
          </p>
          <Button
            variant="outline"
            className="mt-6 rounded-full"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
          >
            <LogOut className="size-4 ml-2" /> تسجيل خروج
          </Button>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-border/60">
        <NabdaLogo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.to
            : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 group",
                active
                  ? "bg-brand-gradient-soft text-primary shadow-[inset_0_0_0_1px_rgba(11,110,110,0.12)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {active && (
                <span
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-l-full bg-brand-gradient"
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "size-8 rounded-lg grid place-items-center shrink-0 transition-colors",
                  active ? `${item.bg} ${item.color}` : "text-muted-foreground group-hover:bg-muted",
                )}
              >
                <item.icon className="size-4" />
              </span>
              {item.label}
              {active && (
                <ChevronLeft className="size-3.5 mr-auto text-primary/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="p-4 border-t border-border/60">
        <div className="rounded-2xl bg-muted/60 p-3 flex items-center gap-3 mb-2">
          <div className="size-9 rounded-full bg-brand-gradient grid place-items-center text-white text-sm font-bold overflow-hidden shrink-0 ring-2 ring-primary/20">
            {staff?.avatar_url ? (
              <img
                src={staff.avatar_url}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              staff?.full_name?.charAt(0) ?? "د"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">
              {staff?.full_name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {roleLabel(staff?.role)}
              {staff?.specialty ? ` · ${staff.specialty}` : ""}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all duration-200 rounded-xl"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth", replace: true });
          }}
        >
          <LogOut className="size-4 ml-2" /> تسجيل خروج
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex" dir="rtl">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-l border-border/60 bg-sidebar sticky top-0 h-screen overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-0 top-0 bottom-0 w-72 flex flex-col bg-sidebar border-l border-border/60 z-50 md:hidden shadow-elevated overflow-hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border/60 bg-background/90 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-5 md:px-7">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden size-9 rounded-xl border border-border/60 bg-card grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="فتح القائمة"
            >
              <Menu className="size-4" />
            </button>

            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-latin">
                Clinic
              </div>
              <div className="text-sm font-semibold truncate flex items-center gap-2">
                {clinic?.name ?? "—"}
                {clinic?.governorate && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground font-normal">
                    <MapPin className="size-3" />
                    {clinic.governorate}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <NabdaLogo variant="mark" className="size-7" />
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-full px-3 py-1.5">
              <div className="size-5 rounded-full bg-brand-gradient grid place-items-center text-white text-[10px] font-bold">
                {staff?.full_name?.charAt(0) ?? "د"}
              </div>
              <span>{staff?.full_name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function roleLabel(role: string | undefined) {
  if (role === "doctor") return "طبيب";
  if (role === "receptionist") return "استقبال";
  if (role === "admin") return "مسؤول العيادة";
  return "موظف";
}