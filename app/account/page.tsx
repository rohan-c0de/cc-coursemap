import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountDashboard from "./AccountDashboard";

export const metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch saved data counts for the dashboard summary
  const [
    { count: schedulesCount },
    { count: coursesCount },
    { count: transfersCount },
  ] = await Promise.all([
    supabase
      .from("saved_schedules")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("saved_courses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("saved_transfers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return (
    <AccountDashboard
      user={{
        id: user.id,
        email: user.email ?? "",
        displayName:
          profile?.display_name ??
          user.user_metadata?.full_name ??
          user.email?.split("@")[0] ??
          "User",
        avatarUrl:
          profile?.avatar_url ??
          user.user_metadata?.avatar_url ??
          null,
        authProvider: profile?.auth_provider ?? null,
        defaultState: profile?.default_state ?? null,
      }}
      counts={{
        schedules: schedulesCount ?? 0,
        courses: coursesCount ?? 0,
        transfers: transfersCount ?? 0,
      }}
    />
  );
}
