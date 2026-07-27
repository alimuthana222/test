import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase, type StaffRow } from "@/integrations/supabase/client";
import { useStaffSession } from "@/hooks/use-staff-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Loader2, Plus, Trash2, Stethoscope } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/clinic/availability")({
  component: AvailabilityPage,
});

const DAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const DAY_SHORT = ["أحد", "اثن", "ثلا", "أرب", "خمس", "جمع", "سبت"];

interface Slot {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

function AvailabilityPage() {
  const { clinic } = useStaffSession();
  const [doctors, setDoctors] = useState<StaffRow[]>([]);
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    const { data: docs } = await supabase
      .from("staff")
      .select("*")
      .eq("clinic_id", clinic.id)
      .eq("role", "doctor")
      .eq("is_active", true);
    const list = (docs ?? []) as StaffRow[];
    setDoctors(list);
    if (list.length) {
      const { data: av } = await supabase
        .from("doctor_availability")
        .select("*")
        .in(
          "staff_id",
          list.map((d) => d.id),
        );
      const grouped: Record<string, Slot[]> = {};
      (av ?? []).forEach((s: Slot) => {
        (grouped[s.staff_id] ??= []).push(s);
      });
      setSlots(grouped);
    } else setSlots({});
    setLoading(false);
  }, [clinic?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const removeSlot = async (id: string) => {
    const { error } = await supabase
      .from("doctor_availability")
      .delete()
      .eq("id", id);
    if (error) return toast.error("تعذّر حذف الوقت.");
    toast.success("تم حذف الوقت.");
    void load();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold">أوقات دوام الأطباء</h1>
        <p className="text-sm text-muted-foreground mt-1">
          حدّد الأوقات المتاحة لكل طبيب — تظهر مباشرة للمرضى في تطبيق nabda.
        </p>
      </div>

      {loading ? (
        <div className="p-16 grid place-items-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-border/60 bg-card shadow-card-soft">
          <div className="mx-auto size-14 rounded-2xl bg-brand-gradient-soft grid place-items-center text-primary mb-4 border border-primary/15">
            <Stethoscope className="size-6" strokeWidth={1.5} />
          </div>
          <div className="text-sm font-semibold">ما فيه أطباء مسجّلين بعد</div>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            أضف أطباء لعيادتك من صفحة البروفايل أولًا.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {doctors.map((doc, i) => {
            const docSlots = slots[doc.id] ?? [];
            const totalSlots = docSlots.length;
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-border/60 bg-card shadow-card-soft overflow-hidden"
              >
                {/* Doctor header */}
                <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-brand-gradient grid place-items-center text-white font-bold text-base ring-2 ring-primary/20">
                      {doc.full_name?.charAt(0) ?? "د"}
                    </div>
                    <div>
                      <div className="font-bold">د. {doc.full_name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Stethoscope className="size-3" />
                        {doc.specialty ?? "—"}
                        <span className="text-muted-foreground/60">·</span>
                        <span>
                          {totalSlots === 0
                            ? "لا أوقات محددة"
                            : `${totalSlots} فترة دوام`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <SlotDialog staffId={doc.id} onSaved={load} />
                </div>

                {/* Days grid */}
                <div className="p-4 grid grid-cols-7 gap-2">
                  {DAYS.map((day, idx) => {
                    const daySlots = docSlots.filter(
                      (s) => s.day_of_week === idx,
                    );
                    const isActive = daySlots.length > 0;
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border ${isActive ? "border-primary/25 bg-brand-gradient-soft" : "border-border/50 bg-card"} p-2 min-h-[80px] flex flex-col`}
                      >
                        <div
                          className={`text-[11px] font-bold text-center mb-1.5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                        >
                          {DAY_SHORT[idx]}
                        </div>
                        <div className="flex-1 space-y-1">
                          {daySlots.length === 0 ? (
                            <div className="text-[10px] text-center text-muted-foreground/60 pt-1">
                              —
                            </div>
                          ) : (
                            daySlots.map((s) => (
                              <div
                                key={s.id}
                                className="group relative text-[10px] flex items-center justify-between gap-0.5 font-latin bg-white/60 border border-primary/20 text-primary rounded-lg px-1.5 py-1 shadow-sm"
                              >
                                <span className="leading-none">
                                  {s.start_time.slice(0, 5)}
                                  <br />
                                  {s.end_time.slice(0, 5)}
                                </span>
                                <button
                                  onClick={() => removeSlot(s.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:scale-110"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SlotDialog({
  staffId,
  onSaved,
}: {
  staffId: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    day_of_week: "0",
    start_time: "09:00",
    end_time: "13:00",
    slot_duration_minutes: "20",
  });

  const save = async () => {
    if (form.start_time >= form.end_time)
      return toast.error("وقت البداية يجب أن يكون قبل النهاية.");
    setSaving(true);
    const { error } = await supabase.from("doctor_availability").insert({
      staff_id: staffId,
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      slot_duration_minutes: Number(form.slot_duration_minutes),
    });
    setSaving(false);
    if (error) return toast.error("تعذّر إضافة الوقت.");
    toast.success("تمت إضافة الوقت.");
    setOpen(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full gap-1.5 border-primary/30 text-primary hover:bg-primary/8 hover:border-primary/50 transition-all"
        >
          <Plus className="size-3.5" />
          إضافة وقت
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            إضافة وقت دوام
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">اليوم</Label>
            <Select
              value={form.day_of_week}
              onValueChange={(v) => setForm((f) => ({ ...f, day_of_week: v }))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">من</Label>
              <Input
                type="time"
                dir="ltr"
                className="font-latin rounded-xl"
                value={form.start_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_time: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">إلى</Label>
              <Input
                type="time"
                dir="ltr"
                className="font-latin rounded-xl"
                value={form.end_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_time: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              مدة الموعد الواحد (دقيقة)
            </Label>
            <Input
              type="number"
              min={5}
              step={5}
              dir="ltr"
              className="font-latin rounded-xl"
              value={form.slot_duration_minutes}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  slot_duration_minutes: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-brand-gradient shadow-brand-sm hover:shadow-brand transition-all"
          >
            {saving && <Loader2 className="size-4 animate-spin ml-2" />}
            حفظ الوقت
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}