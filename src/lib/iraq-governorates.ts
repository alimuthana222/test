// Iraq's 18 governorates (Arabic, ordered by common usage).
export const IRAQ_GOVERNORATES = [
  "بغداد",
  "البصرة",
  "نينوى",
  "أربيل",
  "السليمانية",
  "دهوك",
  "كركوك",
  "النجف",
  "كربلاء",
  "بابل",
  "واسط",
  "ذي قار",
  "ديالى",
  "الأنبار",
  "صلاح الدين",
  "القادسية",
  "ميسان",
  "المثنى",
] as const;

export type IraqGovernorate = (typeof IRAQ_GOVERNORATES)[number];

export const MEDICAL_SPECIALTIES = [
  "طب عام",
  "طب أطفال",
  "طب باطني",
  "أمراض قلبية",
  "جراحة عامة",
  "جراحة عظام",
  "نسائية وتوليد",
  "طب أسنان",
  "جلدية",
  "عيون",
  "أنف وأذن وحنجرة",
  "مسالك بولية",
  "أعصاب",
  "نفسية",
  "أشعة",
  "مختبرات",
] as const;