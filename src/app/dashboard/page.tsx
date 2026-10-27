import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayLocal, toDayOfWeek, weekRange } from "@/lib/date";
import DayCard from "@/components/DayCard";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, scheduleResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_schedules").select("*").eq("user_id", user.id),
  ]);

  if (!profileResult.data?.program_started_on) redirect("/onboarding");

  const profile = profileResult.data;
  const scheduleRows = (scheduleResult.data ?? []).sort((a, b) => a.day_of_week - b.day_of_week);

  const { monday, sunday } = weekRange();
  const { data: logs } = await supabase
    .from("workout_logs")
    .select("workout_date")
    .gte("workout_date", monday)
    .lte("workout_date", sunday);

  const loggedDates = new Set((logs ?? []).map((l) => l.workout_date));

  const today = todayLocal();
  const todayDow = toDayOfWeek();
  const workoutDays = scheduleRows.filter((r) => !r.is_rest_day);
  const doneCount = workoutDays.filter((r) => loggedDates.has(dateFor(r.day_of_week))).length;
  const pct = workoutDays.length ? Math.round((doneCount / workoutDays.length) * 100) : 0;

  return (
    <main className="min-h-dvh px-5 pb-10 pt-6">
      <div className="mx-auto w-full max-w-[480px]">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Halo, {profile.display_name}</h1>
            <p className="mt-0.5 text-sm text-ink-secondary">{formatDate(today)}</p>
          </div>
          <LogoutButton />
        </header>

        <section className="mt-6 rounded-card border border-line bg-card p-5">
          <p className="text-sm text-ink-secondary">Minggu ini</p>
          <p className="mt-1 text-xl font-bold">
            {doneCount} dari {workoutDays.length} latihan selesai
          </p>
          <div className="mt-3 h-2 rounded-full bg-interactive">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </section>

        <div className="mt-5 grid gap-2.5">
          {scheduleRows.map((row) => (
            <DayCard
              key={row.day_of_week}
              dayOfWeek={row.day_of_week}
              title={row.day_title}
              isRest={row.is_rest_day}
              exerciseCount={row.exercise_ids.length}
              done={loggedDates.has(dateFor(row.day_of_week))}
              missed={
                !row.is_rest_day &&
                !loggedDates.has(dateFor(row.day_of_week)) &&
                dateFor(row.day_of_week) < today
              }
              isToday={row.day_of_week === todayDow}
            />
          ))}
        </div>
      </div>
    </main>
  );

  function dateFor(dayOfWeek: number): string {
    const d = new Date();
    d.setDate(d.getDate() - (todayDow - dayOfWeek));
    return todayLocal(d);
  }
}

function formatDate(iso: string): string {
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
