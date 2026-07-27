import { createClient } from "@supabase/supabase-js";

// Publishable/anon keys are safe to ship in the browser.
// This project reuses the same Supabase backend as the nabda Flutter app.
export const SUPABASE_URL = "https://pfhbjfhhrwqlnqzqowjj.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_CnYVikLjs-FzhFGRcMXP8w_l9NnEa48";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "nabda-clinic-auth",
  },
});

export type StaffRole = "doctor" | "receptionist" | "admin";

export interface StaffRow {
  id: string;
  clinic_id: string;
  role: StaffRole;
  full_name: string;
  specialty: string | null;
  avatar_url: string | null;
  auth_user_id: string | null;
  is_active: boolean;
  governorate?: string | null;
  email?: string | null;
}

export interface ClinicRow {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  subscription_tier: "free" | "pro" | "enterprise";
  governorate?: string | null;
}

export interface AppointmentRow {
  id: string;
  clinic_id: string;
  patient_id: string;
  staff_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  reason: string | null;
  cancelled_reason: string | null;
  created_at: string;
}

export interface PatientRow {
  id: string;
  full_name: string;
  phone: string;
  date_of_birth: string | null;
}