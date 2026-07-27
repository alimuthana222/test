import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useStaffSession } from "@/hooks/use-staff-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Upload, UserRound, Building2, Shield, Camera } from "lucide-react";
import { IRAQ_GOVERNORATES, MEDICAL_SPECIALTIES } from "@/lib/iraq-governorates";

export const Route = createFileRoute("/clinic/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { staff, clinic, session, refresh } = useStaffSession();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [doctor, setDoctor] = useState({
    full_name: "",
    specialty: "",
    governorate: "",
    avatar_url: "",
  });
  const [clinicForm, setClinicForm] = useState({
    name: "",
    address: "",
    phone: "",
    governorate: "",
  });

  useEffect(() => {
    if (staff)
      setDoctor({
        full_name: staff.full_name ?? "",
        specialty: staff.specialty ?? "",
        governorate: (staff as { governorate?: string }).governorate ?? "",
        avatar_url: staff.avatar_url ?? "",
      });
    if (clinic)
      setClinicForm({
        name: clinic.name ?? "",
        address: clinic.address ?? "",
        phone: clinic.phone ?? "",
        governorate: (clinic as { governorate?: string }).governorate ?? "",
      });
  }, [staff, clinic]);

  const onSave = async () => {
    if (!staff || !clinic) return;
    setSaving(true);
    const [{ error: sErr }, { error: cErr }] = await Promise.all([
      supabase
        .from("staff")
        .update({
          full_name: doctor.full_name,
          specialty: doctor.specialty,
          governorate: doctor.governorate,
          avatar_url: doctor.avatar_url,
        })
        .eq("id", staff.id),
      staff.role === "admin"
        ? supabase
            .from("clinics")
            .update({
              name: clinicForm.name,
              address: clinicForm.address,
              phone: clinicForm.phone,
              governorate: clinicForm.governorate,
            })
            .eq("id", clinic.id)
        : Promise.resolve({ error: null as null | Error }),
    ]);
    setSaving(false);
    if (sErr || cErr) {
      toast.error("تعذّر حفظ التعديلات.");
      return;
    }
    toast.success("تم حفظ التعديلات بنجاح.");
    await refresh();
  };

  const onAvatar = async (file: File) => {
    if (!session?.user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${session.user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      toast.error("فشل رفع الصورة.");
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setDoctor((d) => ({ ...d, avatar_url: data.publicUrl }));
    setUploading(false);
    toast.success("تم رفع الصورة — لا تنس الحفظ.");
  };

  const sectionVariants = {
    initial: { opacity: 0, y: 16 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold">بروفايل الطبيب والعيادة</h1>
        <p className="text-sm text-muted-foreground mt-1">
          هذي المعلومات تظهر للمرضى في تطبيق nabda.
        </p>
      </div>

      {/* Avatar section */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        className="rounded-2xl border border-border/60 bg-card shadow-card-soft overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-border/50 flex items-center gap-2 bg-muted/30">
          <UserRound className="size-4 text-primary" />
          <span className="text-sm font-bold">الصورة الشخصية</span>
        </div>
        <div className="p-6 flex items-center gap-6">
          <div className="relative shrink-0">
            <div className="size-24 rounded-2xl bg-brand-gradient-soft grid place-items-center overflow-hidden text-primary border border-primary/20 shadow-card-soft">
              {doctor.avatar_url ? (
                <img
                  src={doctor.avatar_url}
                  alt="صورة الطبيب"
                  className="size-full object-cover"
                />
              ) : (
                <UserRound className="size-10" strokeWidth={1.5} />
              )}
            </div>
            <label className="absolute -bottom-2 -left-2 size-8 rounded-full bg-card border border-border/60 shadow-card-soft grid place-items-center cursor-pointer hover:bg-muted transition-colors">
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : (
                <Camera className="size-3.5 text-foreground" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && onAvatar(e.target.files[0])
                }
              />
            </label>
          </div>
          <div>
            <div className="font-semibold">{staff?.full_name ?? "—"}</div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {staff?.specialty ?? ""}
            </div>
            <label className="mt-3 inline-flex items-center gap-2 text-sm rounded-full border border-border/60 px-4 py-1.5 cursor-pointer hover:bg-muted hover:border-primary/30 transition-all">
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {uploading ? "جارٍ الرفع..." : "رفع صورة جديدة"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && onAvatar(e.target.files[0])
                }
              />
            </label>
          </div>
        </div>
      </motion.div>

      {/* Doctor info */}
      <motion.section
        custom={1}
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        className="rounded-2xl border border-border/60 bg-card shadow-card-soft overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-border/50 flex items-center gap-2 bg-muted/30">
          <UserRound className="size-4 text-blue-500" />
          <span className="text-sm font-bold">معلومات الطبيب</span>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-4">
          <FormField label="الاسم الكامل">
            <Input
              value={doctor.full_name}
              onChange={(e) =>
                setDoctor((d) => ({ ...d, full_name: e.target.value }))
              }
              className="rounded-xl border-border/70 focus:border-primary/50 focus:ring-primary/15 transition-all"
            />
          </FormField>
          <FormField label="البريد الإلكتروني">
            <Input
              value={session?.user?.email ?? ""}
              disabled
              className="font-latin rounded-xl opacity-60 cursor-not-allowed"
              dir="ltr"
            />
          </FormField>
          <FormField label="التخصص">
            <Select
              value={doctor.specialty}
              onValueChange={(v) =>
                setDoctor((d) => ({ ...d, specialty: v }))
              }
            >
              <SelectTrigger className="rounded-xl border-border/70 focus:border-primary/50">
                <SelectValue placeholder="اختر التخصص" />
              </SelectTrigger>
              <SelectContent>
                {MEDICAL_SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="المحافظة">
            <Select
              value={doctor.governorate}
              onValueChange={(v) =>
                setDoctor((d) => ({ ...d, governorate: v }))
              }
            >
              <SelectTrigger className="rounded-xl border-border/70 focus:border-primary/50">
                <SelectValue placeholder="اختر المحافظة" />
              </SelectTrigger>
              <SelectContent>
                {IRAQ_GOVERNORATES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </motion.section>

      {/* Clinic info */}
      <motion.section
        custom={2}
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        className="rounded-2xl border border-border/60 bg-card shadow-card-soft overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-border/50 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-violet-500" />
            <span className="text-sm font-bold">معلومات العيادة</span>
          </div>
          {staff?.role !== "admin" && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted rounded-full px-2.5 py-1">
              <Shield className="size-3" />
              للمسؤول فقط
            </span>
          )}
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-4">
          <FormField label="اسم العيادة">
            <Input
              disabled={staff?.role !== "admin"}
              value={clinicForm.name}
              onChange={(e) =>
                setClinicForm((c) => ({ ...c, name: e.target.value }))
              }
              className="rounded-xl border-border/70 focus:border-primary/50 focus:ring-primary/15 transition-all disabled:opacity-60"
            />
          </FormField>
          <FormField label="رقم هاتف العيادة">
            <Input
              disabled={staff?.role !== "admin"}
              dir="ltr"
              className="font-latin rounded-xl border-border/70 focus:border-primary/50 focus:ring-primary/15 transition-all disabled:opacity-60"
              value={clinicForm.phone}
              onChange={(e) =>
                setClinicForm((c) => ({ ...c, phone: e.target.value }))
              }
            />
          </FormField>
          <FormField label="عنوان العيادة" className="md:col-span-2">
            <Textarea
              disabled={staff?.role !== "admin"}
              rows={2}
              value={clinicForm.address}
              onChange={(e) =>
                setClinicForm((c) => ({ ...c, address: e.target.value }))
              }
              className="rounded-xl border-border/70 focus:border-primary/50 focus:ring-primary/15 transition-all disabled:opacity-60 resize-none"
            />
          </FormField>
          <FormField label="محافظة العيادة">
            <Select
              value={clinicForm.governorate}
              onValueChange={(v) =>
                setClinicForm((c) => ({ ...c, governorate: v }))
              }
              disabled={staff?.role !== "admin"}
            >
              <SelectTrigger className="rounded-xl border-border/70 focus:border-primary/50 disabled:opacity-60">
                <SelectValue placeholder="اختر المحافظة" />
              </SelectTrigger>
              <SelectContent>
                {IRAQ_GOVERNORATES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </motion.section>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={saving}
          className="rounded-full shadow-brand bg-brand-gradient hover:shadow-[0_16px_40px_-10px_rgba(11,110,110,0.5)] hover:scale-[1.02] transition-all duration-200"
          size="lg"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin ml-2" />
          ) : (
            <Save className="size-4 ml-2" />
          )}
          {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
        </Button>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}