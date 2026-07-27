# خطة التطوير الشاملة — nabda Clinic Dashboard

## 1) إعادة تصميم احترافية (بدون طابع AI، بدون إيموجي)

- استبدال كامل لـ `src/styles.css` بنظام تصميم مؤسسي: تدرجات teal (#0B6E6E → #4DD3C2)، ظلال طبقات (elevation)، حواف دقيقة، تباعد نسبي (8pt grid)، حركات micro-interactions.
- إزالة كل الإيموجي (👋 مثلاً في الترحيب) واستبدالها بأيقونات Lucide + illustrations SVG مخصصة.
- توليد assets حقيقية:
  - Hero illustration للصفحة الرئيسية (طبيب/عيادة بأسلوب flat professional).
  - Login/Signup side illustration.
  - Empty-state illustrations (لا مواعيد، لا مرضى، لا أوقات).
- Animations حقيقية عبر `framer-motion`:
  - Fade + slide-up للبطاقات عند التحميل (stagger).
  - Number counter animation لإحصائيات لوحة التحكم.
  - Skeleton loaders بدلاً من spinner.
  - Hover lift على البطاقات، ripple على الأزرار الأساسية.
- Sidebar احترافي مع active indicator متحرك، badge بعدد المعلقات.
- Typography hierarchy واضح، spacing متسق، dark mode-ready tokens.

## 2) تسجيل حساب جديد + بروفايل الطبيب

- صفحة `/auth` تصبح tabs: تسجيل دخول / إنشاء حساب.
- نموذج إنشاء الحساب يجمع:
  - الاسم الكامل، البريد، كلمة السر
  - رقم الهاتف
  - التخصص (dropdown)
  - المحافظة (dropdown بكل محافظات العراق الـ18)
  - اسم العيادة، عنوانها
  - رفع صورة شخصية (Supabase Storage bucket `avatars`)
- Migration جديدة:
  - إضافة عمود `governorate` على `clinics` و `staff` (nullable للتوافق مع الموجود).
  - Trigger/RPC ينشئ clinic + staff row بعد `auth.signUp` (via server function مع service-role).
- صفحة `/clinic/profile` جديدة لتعديل بيانات الطبيب والعيادة (بما فيها المحافظة وصورة البروفايل).
- Realtime `onAuthStateChange` يجدد الجلسة تلقائياً.

## 3) مزامنة الرئيسية (الأرقام تتغير فعلاً)

- تفعيل Supabase Realtime على جدول `appointments` مفلتر بـ `clinic_id`:
  - `postgres_changes` events → إعادة تحميل الصف المتغير فقط + تحديث الإحصائيات فوراً.
- الإحصائيات محسوبة من نفس المصدر المشترك (state واحد)، مع counter animation عند التغيير.
- زر "تحديث" يبقى، لكن ما يعود ضرورياً.

## 4) قسم المواعيد — أزرار تأكيد/إلغاء واضحة

- إعادة تصميم صف الموعد بطاقة كاملة مع:
  - Segmented action bar: [تأكيد] [إلغاء] [إنهاء] حسب الحالة.
  - Modal تأكيد قبل الإلغاء مع سبب اختياري.
  - Toast (sonner) على نجاح/فشل العملية.
- Filters: اليوم / الأسبوع / كل الحالات، وبحث باسم المريض.

## 5) قسم أوقات الدوام — تعديل من الواجهة

- زر "إضافة فترة" لكل يوم لكل طبيب → dialog يختار وقت البداية/النهاية ومدة الموعد.
- زر حذف على كل slot.
- تعديل inline بالنقر على الوقت (TimePicker).
- عمليات CRUD كاملة على `doctor_availability` مع تحقق من التداخل.

## 6) قسم المرضى — عدد الزيارات صحيح

- تعديل query: `visits = count(appointments WHERE status='completed' AND scheduled_at < now())`.
- `last_visit` = آخر موعد `completed` فات وقته.
- إضافة عمود "المواعيد القادمة" منفصل عن الزيارات المكتملة.

## تفاصيل تقنية

- تثبيت: `framer-motion`, `sonner` (لو غير موجود), `date-fns`.
- Assets عبر `lovable-assets` (hero, illustrations) — لا ملفات ثنائية في المستودع.
- Migration: `ALTER TABLE clinics ADD COLUMN governorate text;` + نفس الشيء على `staff`، وإنشاء bucket `avatars` عام للقراءة، محمي بـ RLS للكتابة.
- Server function `signup-clinic.functions.ts` تستخدم `supabaseAdmin` لإنشاء clinic + staff بعد التحقق من التوكن.
- Realtime channel واحد داخل `useStaffSession` أو hook مستقل `useClinicAppointments`.

## ترتيب التنفيذ

1. Migration (governorate + avatars bucket + policies).
2. Design system (`styles.css`) + Sidebar الجديد.
3. توليد assets (hero + illustrations).
4. Auth: signup tab + governorate + avatar upload + server function.
5. Profile page.
6. Realtime + counter animation في الرئيسية.
7. Appointments: أزرار + modals + toasts.
8. Availability editor (CRUD + dialogs).
9. Patients: إصلاح منطق العد.
10. تنظيف كل إيموجي من الكود.

هل نبدأ التنفيذ بهذا الترتيب؟