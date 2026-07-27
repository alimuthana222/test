import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, type StaffRow, type ClinicRow } from "@/integrations/supabase/client";

export interface StaffSession {
  status: "loading" | "signed-out" | "no-staff" | "ready";
  session: Session | null;
  staff: StaffRow | null;
  clinic: ClinicRow | null;
  refresh: () => Promise<void>;
}

export function useStaffSession(): StaffSession {
  const [session, setSession] = useState<Session | null>(null);
  const [staff, setStaff] = useState<StaffRow | null>(null);
  const [clinic, setClinic] = useState<ClinicRow | null>(null);
  const [status, setStatus] = useState<StaffSession["status"]>("loading");

  const load = async (s: Session | null) => {
    if (!s?.user) {
      setStaff(null);
      setClinic(null);
      setStatus("signed-out");
      return;
    }
    const { data: staffRow } = await supabase
      .from("staff")
      .select("*")
      .eq("auth_user_id", s.user.id)
      .eq("is_active", true)
      .maybeSingle<StaffRow>();

    if (!staffRow) {
      setStaff(null);
      setClinic(null);
      setStatus("no-staff");
      return;
    }
    setStaff(staffRow);
    const { data: clinicRow } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", staffRow.clinic_id)
      .maybeSingle<ClinicRow>();
    setClinic(clinicRow ?? null);
    setStatus("ready");
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      void load(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      void load(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    status,
    session,
    staff,
    clinic,
    refresh: async () => {
      const { data } = await supabase.auth.getSession();
      await load(data.session);
    },
  };
}