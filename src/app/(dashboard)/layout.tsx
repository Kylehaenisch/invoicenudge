import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard-nav";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { getAccessLevel } from "@/lib/subscription";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt & suspenders — middleware already redirects unauthenticated
  // requests away from these routes.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, email, subscription_status, current_period_end")
    .eq("id", user.id)
    .single();

  const accessLevel = profile ? getAccessLevel(profile) : "full";

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="font-serif text-xl text-ink">
              InvoiceNudge
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-ink-muted sm:inline">
                {profile?.business_name || profile?.email}
              </span>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
          <div className="pb-2">
            <DashboardNav />
          </div>
        </div>
      </header>
      {accessLevel === "read_only" && (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700 sm:px-6">
          Your subscription isn&apos;t active — you can view existing data,
          but creating invoices/clients and sending reminders is paused.{" "}
          <Link href="/settings/billing" className="font-medium underline">
            Reactivate billing
          </Link>
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
