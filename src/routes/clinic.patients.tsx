import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useStaffSession } from "@/hooks/use-staff-session";
import { Loader2, Search, UserRound, Phone, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/clinic/patients")({
  component: PatientsPage,
});

interface PatientAgg {
  id: string;
  full_name: string;
  phone: string;
  visits: number;
  last_visit: string | null;
}

const AVATAR_COLORS = [
  "from-teal-500 to-cyan-400",
  "from-blue-500 to-indigo-400",
  "from-violet-500 to-purple-400",
  "from-rose-500 to-pink-400",
  "from-amber-500 to-orange-400",
  "from-emerald-500 to-green-400",
];

function PatientsPage() {
  const { clinic } = useStaffSession();
  const [rows, setRows] = useState<PatientAgg[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!clinic?.id) return;
    (async () => {
      setLoading(true);
      const { data: all } = await supabase
        .from("appointments")
        .select("scheduled_at, status, patients:patient_id(id, full_name, phone)")
        .eq("clinic_id", clinic.id)
        .order("scheduled_at", { ascending: false })
        .limit(1000);
      const nowISO = new Date().toISOString();
      const map = new Map<string, PatientAgg>();
      (all ?? []).forEach((raw) => {
        const row = raw as unknown as {
          scheduled_at: string;
          status: string;
          patients: { id: string; full_name: string; phone: string } | null;
        };
        const p = row.patients;
        if (!p) return;
        const cur = map.get(p.id) ?? {
          id: p.id,
          full_name: p.full_name,
          phone: p.phone,
          visits: 0,
          last_visit: null,
        };
        if (row.status === "completed" && row.scheduled_at <= nowISO) {
          cur.visits += 1;
          if (!cur.last_visit || row.scheduled_at > cur.last_visit)
            cur.last_visit = row.scheduled_at;
        }
        map.set(p.id, cur);
      });
      setRows(
        Array.from(map.values()).sort((a, b) =>
          (b.last_visit ?? "").localeCompare(a.last_visit ?? ""),
        ),
      );
      setLoading(false);
    })();
  }, [clinic?.id]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.full_name?.toLowerCase().includes(s) || r.phone?.includes(s),
    );
  }, [rows, q]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold">المرضى</h1>
        <p className="text-sm text-muted-foreground mt-1">
          سجل المرضى — عدد الزيارات يزيد فقط عند إنهاء الموعد ومرور وقته.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "إجمالي المرضى", value: rows.length, icon: UserRound, color: "text-primary bg-primary/10" },
          { label: "مرضى مع زيارات", value: rows.filter((r) => r.visits > 0).length, icon: Calendar, color: "text-success bg-success/10" },
          {
            label: "أكثر زيارة",
            value: rows.reduce((max, r) => Math.max(max, r.visits), 0),
            icon: UserRound,
            color: "text-violet-600 bg-violet-500/10",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="rounded-2xl border border-border/50 bg-card p-4 shadow-card-soft"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className={`size-8 rounded-lg grid place-items-center ${s.color}`}>
                <s.icon className="size-4" />
              </span>
            </div>
            <div className="mt-2 font-latin text-2xl font-extrabold tabular-nums">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          className="pr-10 rounded-xl border-border/60 focus:border-primary/50 focus:ring-primary/15 transition-all"
        />
      </div>

      {/* Patient list */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-card-soft">
        {loading ? (
          <div className="p-16 grid place-items-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto size-14 rounded-2xl bg-muted grid place-items-center text-muted-foreground mb-4">
              <UserRound className="size-6" strokeWidth={1.5} />
            </div>
            <div className="text-sm font-semibold">ما فيه مرضى مطابقين</div>
            {q && (
              <p className="text-xs text-muted-foreground mt-1">
                جرّب كلمة بحث مختلفة.
              </p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filtered.map((p, idx) => {
              const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors duration-150 group"
                >
                  {/* Avatar */}
                  <div
                    className={`size-11 rounded-full bg-gradient-to-br ${colorClass} grid place-items-center text-white font-bold text-base shrink-0 ring-2 ring-white shadow-sm`}
                  >
                    {p.full_name?.charAt(0) ?? "م"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.full_name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Phone className="size-3 shrink-0" />
                      <span className="font-latin">{p.phone}</span>
                    </div>
                  </div>

                  {/* Last visit */}
                  {p.last_visit && (
                    <div className="hidden md:block text-xs text-muted-foreground text-start shrink-0">
                      <div className="text-[10px] uppercase tracking-wider mb-0.5 font-latin">آخر زيارة</div>
                      <div>
                        {new Date(p.last_visit).toLocaleDateString("ar-IQ", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  )}

                  {/* Visit count */}
                  <div className="text-end shrink-0">
                    <div className="font-latin font-extrabold text-xl tabular-nums text-foreground leading-none">
                      {p.visits}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">زيارة</div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}