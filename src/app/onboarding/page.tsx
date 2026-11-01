import { getSessionContext } from "@/lib/supabase/server";
import OnboardingFlow from "./OnboardingFlow";

export default async function OnboardingPage() {
  const { profile } = await getSessionContext(true);
  const editing = !!profile.program_started_on;

  return (
    <OnboardingFlow
      editing={editing}
      initial={
        editing
          ? {
              locationMode: profile.location_mode,
              focus: profile.focus_muscle,
              plannedDays: profile.planned_days,
            }
          : null
      }
    />
  );
}
