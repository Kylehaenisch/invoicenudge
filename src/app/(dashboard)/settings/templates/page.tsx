import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateEditor } from "./template-editor";
import { REMINDER_KEY_ORDER } from "@/lib/reminder-templates";
import type { ReminderTemplate } from "@/types/database";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: templates } = await supabase
    .from("reminder_templates")
    .select("*")
    .eq("user_id", user!.id);

  const byKey = new Map(
    (templates ?? []).map((t) => [t.key, t as ReminderTemplate]),
  );
  const ordered = REMINDER_KEY_ORDER.map((key) => byKey.get(key)).filter(
    (t): t is ReminderTemplate => Boolean(t),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-ink">Reminder templates</h1>
        <p className="text-sm text-ink-muted">
          Four reminders go out automatically — 3 days before due, on the due
          date, and 7 &amp; 14 days after. Edit the wording or turn any of
          them off below.
        </p>
      </div>

      <div className="space-y-6">
        {ordered.map((template) => (
          <Card key={template.id}>
            <CardContent className="pt-5">
              <TemplateEditor template={template} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
