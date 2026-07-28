import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { NabdaLogo } from "@/components/nabda-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, LogIn, UserPlus, ShieldCheck, Sparkles } from "lucide-react";
import { IRAQ_GOVERNORATES, MEDICAL_SPECIALTIES } from "@/lib/iraq-governorates";
import authImg from "@/assets/auth-illustration.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "دخول وتسجيل العيادات · nabda" },
      { name: "description", content: "سجّل عيادتك أو ادخل لوحة تحكم nabda." },
      { property: "og:title", content: "دخول العيادة · nabda" },
      { property: "og:description", content: "منصة nabda للعيادات." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(() => {
    if (typeof window === "undefined") return "signin";
    return new URLSearchParams(window.location.search).get("mode") === "signup"
      ? "signup"
      : "signin";
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/clinic" });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen grid md:grid-cols-[1fr_1.05fr]" dir="rtl">
      <aside className="relative hidden md:flex flex-col justify-between p-10 bg-brand-gradient text-white overflow-hidden">
        <NabdaLogo tone="light" tagline />
        <div className="relative z-10 max-w-md">
          
          <h2 className="mt-5 text-3xl font-extrabold leading-snug">
            لوحة تحكم عيادتك،
            <br /> بواجهة عربية احترافية.
          </h2>
          <p className="mt-4 text-white/85 text-sm leading-relaxed">
            مواعيد، أوقات دوام الأطباء، وسجل المرضى — كل شي مربوط بتطبيق nabda مباشرة.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/90">
            {["حجز فوري من تطبيق المرضى", "إشعارات لحظية للأطباء", "أمان بيانات مرضاك (RLS)"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <ShieldCheck className="size-4" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="absolute inset-x-0 bottom-0 opacity-30 mix-blend-lighten">
          <img src={authImg} alt="" width={1024} height={1280} loading="lazy" className="w-full object-cover" />
        </div>
        <div className="text-xs text-white/70 font-latin relative z-10">
          Healthcare begins here.
        </div>
      </aside>

      <main className="flex items-center justify-center p-6 md:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="md:hidden mb-8">
            <NabdaLogo />
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid grid-cols-2 w-full rounded-full h-11 p-1">
              <TabsTrigger value="signin" className="rounded-full">دخول</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full">تسجيل عيادة</TabsTrigger>
            </TabsList>
            <AnimatePresence mode="wait">
              <TabsContent key={tab} value={tab} className="mt-6">
                <motion.div
                  initial={{ opacity: 0, x: tab === "signin" ? -12 : 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {tab === "signin" ? <SignInForm /> : <SignUpForm onDone={() => setTab("signin")} />}
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid")
          ? "البريد أو كلمة المرور غير صحيحة."
          : error.message,
      );
      return;
    }
    toast.success("أهلًا بعودتك.");
    navigate({ to: "/clinic" });
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold">مرحبًا مجددًا</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        سجّل الدخول لإدارة مواعيد عيادتك في nabda.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field id="email" label="البريد الإلكتروني" type="email" value={email} onChange={setEmail} placeholder="you@clinic.iq" />
        <Field id="password" label="كلمة المرور" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
        <Button type="submit" disabled={loading} className="w-full rounded-full shadow-brand" size="lg">
          {loading ? <Loader2 className="size-4 animate-spin ml-2" /> : <LogIn className="size-4 ml-2" />}
          {loading ? "جارٍ الدخول..." : "دخول"}
        </Button>
      </form>
    </div>
  );
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    specialty: "",
    governorate: "",
    clinic_name: "",
    clinic_address: "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.governorate || !form.specialty) {
      toast.error("اختر التخصص والمحافظة.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin + "/clinic",
        data: {
          user_type: "clinic",
          full_name: form.full_name,
          phone: form.phone,
          specialty: form.specialty,
          governorate: form.governorate,
          clinic_name: form.clinic_name,
          clinic_address: form.clinic_address,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("تم تسجيل عيادتك بنجاح.");
      window.location.href = "/clinic";
    } else {
      toast.success("تم إنشاء الحساب. تحقق من بريدك للتفعيل ثم سجّل الدخول.");
      onDone();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold">سجّل عيادتك</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        دقيقة واحدة وتصبح عيادتك متاحة لحجوزات مرضى nabda.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field id="full_name" label="اسم الطبيب" value={form.full_name} onChange={set("full_name")} required placeholder="د. أحمد كريم" />
          <Field id="phone" label="رقم الهاتف" value={form.phone} onChange={set("phone")} required placeholder="07XXXXXXXXX" ltr />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>التخصص</Label>
            <Select value={form.specialty} onValueChange={set("specialty")}>
              <SelectTrigger><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
              <SelectContent>
                {MEDICAL_SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>المحافظة</Label>
            <Select value={form.governorate} onValueChange={set("governorate")}>
              <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
              <SelectContent>
                {IRAQ_GOVERNORATES.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Field id="clinic_name" label="اسم العيادة" value={form.clinic_name} onChange={set("clinic_name")} required placeholder="عيادة الشفاء" />
        <Field id="clinic_address" label="عنوان العيادة" value={form.clinic_address} onChange={set("clinic_address")} required placeholder="بغداد، الكرادة، شارع 62" />
        <Field id="email_su" label="البريد الإلكتروني" type="email" value={form.email} onChange={set("email")} required placeholder="you@clinic.iq" ltr />
        <Field id="password_su" label="كلمة المرور" type="password" value={form.password} onChange={set("password")} required placeholder="••••••••" ltr />

        <Button type="submit" disabled={loading} className="w-full rounded-full shadow-brand" size="lg">
          {loading ? <Loader2 className="size-4 animate-spin ml-2" /> : <UserPlus className="size-4 ml-2" />}
          {loading ? "جارٍ التسجيل..." : "تسجيل العيادة"}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          بالضغط على تسجيل، أنت توافق على أن تكون بيانات مرضاك محميّة بسياسة الخصوصية.
        </p>
      </form>
    </div>
  );
}

function Field({
  id, label, value, onChange, type = "text", placeholder, required, ltr,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; ltr?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        required={required}
        dir={ltr ? "ltr" : undefined}
        className={ltr ? "font-latin" : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
