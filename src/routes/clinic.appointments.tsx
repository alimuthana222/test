import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  supabase,
  type AppointmentRow,
  type PatientRow,
  type StaffRow,
} from "@/integrations/supabase/client";
import { useStaffSession } from "@/hooks/use-staff-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  Calendar as CalIcon,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/clinic/appointments")({
  component: AppointmentsPage,
});

type Row = AppointmentRow & {
  patients: Pick<PatientRow, "id" | "full_name" | "phone"> | null;
  staff: Pick<StaffRow, "id" | "full_name" | "specialty"> | null;
};

type Filter = "all" | "pending" | "confirmed" | "completed" | "cancelled";

const FILTERS: { value: Filter; label: string; color: string; activeClass: string }[] = [
  { value: "all", label: "الكل", color: "", activeClass: "bg-brand-gradient text-white shadow-brand-sm" },
  { value: "pending", label: "انتظار", color: "text-amber-600", activeClass: "bg-amber-500 text-white shadow-[0_4px_14px_-4px_rgba(245,158,11,0.5)]" },
  { value: "confirmed", label: "مؤكدة", color: "text-emerald-600", activeClass: "bg-emerald-500 text-white shadow-[0_4px_14px_-4px_rgba(16,185,129,0.5)]" },
  { value: "completed", label: "مكتملة", color: "text-muted-foreground", activeClass: "bg-foreground text-background" },
  { value: "cancelled", label: "ملغاة", color: "text-destructive", activeClass: "bg-destructive text-white shadow-[0_4px_14px_-4px_rgba(239,68,68,0.4)]" },
];

function AppointmentsPage() {
  const { clinic } = useStaffSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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
        .order("scheduled_at", { ascending: false })
        .limit(300);
      setRows((data ?? []) as Row[]);
      setLoading(false);
      setRefreshing(false);
    },
    [clinic?.id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!clinic?.id) return;
    const ch = supabase
      .channel(`appts-all-${clinic.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `clinic_id=eq.${clinic.id}`,
        },
        () => void load(true),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [clinic?.id, load]);

  const setStatus = async (id: string, status: AppointmentRow["status"]) => {
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
        ? "تمت الموافقة على الحجز."
        : status === "cancelled"
          ? "تم إلغاء الحجز."
          : status === "completed"
            ? "تم إنهاء الموعد."
            : "تم التحديث.",
    );
    void load(true);
  };

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== "all") list = list.filter((r) => r.status === filter);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.patients?.full_name?.toLowerCase().includes(s) ||
          r.patients?.phone?.includes(s) ||
          r.staff?.full_name?.toLowerCase().includes(s),
      );
    }
    return list;
  }, [rows, filter, q]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      confirmed: rows.filter((r) => r.status === "confirmed").length,
      completed: rows.filter((r) => r.status === "completed").length,
      cancelled: rows.filter((r) => r.status === "cancelled").length,
    }),
    [rows],
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">المواعيد</h1>
          <p className="text-sm text-muted-foreground mt-1">
            كل حجوزات عيادتك — وافق أو ألغِ بضغطة زر.
          </p>
        </div>
        <Button
          onClick={() => void load(true)}
          variant="outline"
          size="sm"
          className="rounded-full gap-2 border-border/60 hover:border-primary/30 transition-all"
          disabled={refreshing}
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          تحديث
        </Button>
      </div>

      {/* Filter bar + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card p-1 shadow-card-soft">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "relative px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200",
                filter === f.value
                  ? f.activeClass
                  : `text-muted-foreground hover:text-foreground hover:bg-muted ${f.color}`,
              )}
            >
              {f.label}
              <span
                className={cn(
                  "ms-1.5 font-latin text-[10px] tabular-nums",
                  filter === f.value ? "opacity-80" : "opacity-60",
                )}
              >
                {counts[f.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث باسم مريض، هاتف، أو طبيب..."
            className="pr-10 rounded-xl border-border/60 focus:border-primary/50 focus:ring-primary/15 transition-all"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Appointments list */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-card-soft">
        {loading ? (
          <div className="p-16 grid place-items-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto size-14 rounded-2xl bg-muted grid place-items-center text-muted-foreground mb-4">
              <CalIcon className="size-6" strokeWidth={1.5} />
            </div>
            <div className="text-sm font-semibold">ما فيه مواعيد مطابقة</div>
            <p className="text-xs text-muted-foreground mt-1">
              {q ? "جرّب كلمة بحث مختلفة." : "ما في حجوزات في هذه الفئة."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            <AnimatePresence>
              {filtered.map((a, idx) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.025 }}
                  className="px-5 py-4 flex items-center gap-4 flex-wrap md:flex-nowrap hover:bg-muted/40 transition-colors duration-150 group"
                >
                  {/* Date + Time */}
                  <div className="w-24 shrink-0">
                    <div className="text-[11px] text-muted-foreground">
                      {formatDate(a.scheduled_at)}
                    </div>
                    <div className="font-latin font-extrabold text-primary text-lg leading-tight">
                      {formatTime(a.scheduled_at)}
                    </div>
                  </div>

                  {/* Patient info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="size-9 rounded-full bg-brand-gradient grid place-items-center text-white text-sm font-bold shrink-0 ring-2 ring-white shadow-sm">
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
                    </div>
                  </div>

                  <StatusBadge status={a.status} />

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
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
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

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ar-IQ", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}