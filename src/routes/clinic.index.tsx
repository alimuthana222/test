import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  supabase,
  type AppointmentRow,
  type PatientRow,
  type StaffRow,
} from "@/integrations/supabase/client";
import { useStaffSession } from "@/hooks/use-staff-session";
import { useCountUp } from "@/hooks/use-count-up";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Loader2,
  CheckCircle2,
  Clock3,
  UserRound,
  RefreshCw,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/clinic/")({
  component: ClinicDashboard,
});

type AppointmentWithJoins = AppointmentRow & {
  patients: Pick<PatientRow, "id" | "full_name" | "phone"> | null;
  staff: Pick<StaffRow, "id" | "full_name" | "specialty"> | null;
};

const STAT_CONFIG = [
  {
    key: "total" as const,
    label: "مواعيد اليوم",
    icon: Calendar,
    gradient: "from-primary to-[#4DD3C2]",
    shadow: "shadow-[0_8px_24px_-8px_rgba(11,110,110,0.4)]",
    ring: "ring-primary/20",
    textColor: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    key: "confirmed" as const,
    label: "مؤكدة",
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-green-400",
    shadow: "shadow-[0_8px_24px_-8px_rgba(16,185,129,0.4)]",
    ring: "ring-emerald-500/20",
    textColor: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  {
    key: "pending" as const,
    label: "قيد الانتظار",
    icon: Clock3,
    gradient: "from-amber-500 to-orange-400",
    shadow: "shadow-[0_8px_24px_-8px_rgba(245,158,11,0.4)]",
    ring: "ring-amber-500/20",
    textColor: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
  {
    key: "completed" as const,
    label: "مكتملة",
    icon: UserRound,
    gradient: "from-violet-500 to-purple-400",
    shadow: "shadow-[0_8px_24px_-8px_rgba(139,92,246,0.35)]",
    ring: "ring-violet-500/20",
    textColor: "text-violet-600",
    bgColor: "bg-violet-500/10",
  },
];

function ClinicDashboard() {
  const { clinic, staff } = useStaffSession();
  const [rows, setRows] = useState<AppointmentWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { startISO, endISO, todayLabel } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      todayLabel: start.toLocaleDateString("ar-IQ", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
  }, []);

  const load = useCallback(
    async (silent = false) => {
      if (!clinic?.id) return;
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const { data } = await supabase
        .from("appointments")
        .select(
          "*, patients:patient_id(id, full_name, phone), staff:staff_id(id, full_name, specialty)",
        )
        .eq("clinic_id", clinic.id)
        .gte("scheduled_at", startISO)
        .lt("scheduled_at", endISO)
        .order("scheduled_at", { ascending: true });
      setRows((data ?? []) as AppointmentWithJoins[]);
      setLoading(false);
      setRefreshing(false);
    },
    [clinic?.id, startISO, endISO],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!clinic?.id) return;
    const channel = supabase
      .channel(`appointments-${clinic.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `clinic_id=eq.${clinic.id}`,
        },
        () => {
          void load(true);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clinic?.id, load]);

  const setStatus = async (
    id: string,
    status: AppointmentRow["status"],
  ) => {
    setBusyId(id);
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error("تعذّر تحديث الموعد.");
      return;
    }
    toast.success(
      status === "confirmed"
        ? "تم تأكيد الموعد."
        : status === "cancelled"
          ? "تم إلغاء الموعد."
          : status === "completed"
            ? "تم إنهاء الموعد."
            : "تم التحديث.",
    );
    void load(true);
  };

  const stats = useMemo(
    () => ({
      total: rows.length,
      confirmed: rows.filter((r) => r.status === "confirmed").length,
      pending: rows.filter((r) => r.status === "pending").length,
      completed: rows.filter((r) => r.status === "completed").length,
    }),
    [rows],
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-primary font-medium mb-1">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-80" />
              <span className="relative inline-flex size-1.5 rounded-full bg-success" />
            </span>
            <span className="font-latin">Dashboard</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{todayLabel}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">
            أهلًا، {staff?.full_name?.split(" ")[0] ?? "دكتور"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            مواعيد اليوم في عيادتك — تتحدث لحظيًا عند أي حجز جديد من تطبيق
            nabda.
          </p>
        </div>
        <Button
          onClick={() => void load(true)}
          variant="outline"
          className="rounded-full self-start gap-2 border-border/60 hover:border-primary/30 transition-all"
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          تحديث
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CONFIG.map((cfg, i) => (
          <StatCard
            key={cfg.key}
            label={cfg.label}
            value={stats[cfg.key]}
            icon={cfg.icon}
            gradient={cfg.gradient}
            shadow={cfg.shadow}
            textColor={cfg.textColor}
            bgColor={cfg.bgColor}
            delay={i * 0.06}
          />
        ))}
      </div>

      {/* Today's Appointments Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-border/60 bg-card shadow-card-soft overflow-hidden"
      >
        {/* Table header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-card">
          <div>
            <div className="text-sm font-bold">مواعيد اليوم</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              مرتّبة من الأقدم للأحدث
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-[11px] text-muted-foreground bg-success/8 text-success px-2.5 py-1 rounded-full border border-success/20">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-success" />
            </span>
            متزامن لحظيًا
          </span>
        </div>

        {loading ? (
          <div className="p-16 grid place-items-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-border/50">
            {rows.map((a, idx) => (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.04, ease: "easeOut" }}
                className="px-5 py-4 flex items-center gap-4 flex-wrap md:flex-nowrap hover:bg-muted/40 transition-colors duration-150 group"
              >
                {/* Time block */}
                <div className="w-20 shrink-0 text-center">
                  <div className="font-latin text-xl font-extrabold text-primary leading-none">
                    {formatTime(a.scheduled_at)}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase font-latin mt-0.5">
                    {a.duration_minutes}m
                  </div>
                </div>

                {/* Patient avatar + info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="size-10 rounded-full bg-brand-gradient grid place-items-center text-white text-sm font-bold shrink-0 ring-2 ring-white shadow-sm">
                    {a.patients?.full_name?.charAt(0) ?? "م"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {a.patients?.full_name ?? "مريض غير معروف"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {a.staff?.full_name ?? "—"}
                      {a.staff?.specialty ? ` · ${a.staff.specialty}` : ""}
                      {a.patients?.phone ? (
                        <span className="font-latin"> · {a.patients.phone}</span>
                      ) : null}
                    </div>
                    {a.reason && (
                      <div className="text-xs text-muted-foreground/80 mt-0.5 line-clamp-1">
                        {a.reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <StatusBadge status={a.status} />

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {a.status === "pending" && (
                    <Button
                      size="sm"
                      className="rounded-full bg-brand-gradient shadow-brand-sm hover:shadow-brand hover:scale-[1.02] transition-all"
                      disabled={busyId === a.id}
                      onClick={() => setStatus(a.id, "confirmed")}
                    >
                      {busyId === a.id ? (
                        <Loader2 className="size-3.5 animate-spin ml-1" />
                      ) : (
                        <CheckCircle2 className="size-3.5 ml-1" />
                      )}
                      موافقة
                    </Button>
                  )}
                  {(a.status === "pending" || a.status === "confirmed") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/8 hover:border-destructive/50 transition-all"
                      disabled={busyId === a.id}
                      onClick={() => setStatus(a.id, "cancelled")}
                    >
                      <XCircle className="size-3.5 ml-1" />
                      إلغاء
                    </Button>
                  )}
                  {a.status === "confirmed" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-full hover:bg-secondary/80 transition-all"
                      disabled={busyId === a.id}
                      onClick={() => setStatus(a.id, "completed")}
                    >
                      إنهاء
                    </Button>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  shadow,
  textColor,
  bgColor,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  shadow: string;
  textColor: string;
  bgColor: string;
  delay: number;
}) {
  const animated = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border/50 bg-card p-5 shadow-card-soft hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group cursor-default"
    >
      <div className="flex items-start justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span
          className={cn(
            "size-9 rounded-xl grid place-items-center",
            bgColor,
            textColor,
            "group-hover:scale-110 transition-transform duration-200",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 font-latin text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
        {animated}
      </div>
      <div className={cn("mt-1.5 flex items-center gap-1 text-xs", textColor)}>
        <ArrowUpRight className="size-3" />
        <span>اليوم</span>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: AppointmentRow["status"] }) {
  const map: Record<AppointmentRow["status"], { label: string; cls: string; dot: string }> = {
    pending: {
      label: "قيد الانتظار",
      cls: "bg-amber-500/10 text-amber-700 border border-amber-200",
      dot: "bg-amber-500",
    },
    confirmed: {
      label: "مؤكد",
      cls: "bg-success/10 text-success border border-success/20",
      dot: "bg-success",
    },
    completed: {
      label: "مكتمل",
      cls: "bg-muted text-muted-foreground border border-border/50",
      dot: "bg-muted-foreground",
    },
    cancelled: {
      label: "ملغى",
      cls: "bg-destructive/8 text-destructive border border-destructive/20",
      dot: "bg-destructive",
    },
    no_show: {
      label: "لم يحضر",
      cls: "bg-destructive/8 text-destructive border border-destructive/20",
      dot: "bg-destructive",
    },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        "text-[11px] rounded-full px-2.5 py-1 font-medium hidden md:inline-flex items-center gap-1.5",
        s.cls,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div className="mx-auto size-16 rounded-2xl bg-brand-gradient-soft grid place-items-center text-primary border border-primary/15">
        <Calendar className="size-7" strokeWidth={1.5} />
      </div>
      <div className="mt-4 text-sm font-semibold">ما عندك مواعيد اليوم</div>
      <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
        بمجرد ما يحجز مريض من تطبيق nabda، الموعد يظهر هنا فورًا.
      </p>
    </div>
  );
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}