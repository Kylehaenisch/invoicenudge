"use client";

import { useActionState } from "react";
import { updateTemplate, type TemplateActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MERGE_FIELDS } from "@/lib/merge-fields";
import { REMINDER_KEY_LABEL } from "@/lib/reminder-templates";
import type { ReminderTemplate } from "@/types/database";

const initialState: TemplateActionState = {};

export function TemplateEditor({ template }: { template: ReminderTemplate }) {
  const [state, formAction, pending] = useActionState(
    updateTemplate,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={template.id} />

      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-ink">
          {REMINDER_KEY_LABEL[template.key]}
        </h3>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={template.enabled}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          Enabled
        </label>
      </div>

      <div>
        <Label htmlFor={`subject-${template.id}`}>Subject</Label>
        <Input
          id={`subject-${template.id}`}
          name="subject"
          defaultValue={template.subject}
          required
        />
      </div>

      <div>
        <Label htmlFor={`body-${template.id}`}>Body</Label>
        <Textarea
          id={`body-${template.id}`}
          name="body"
          defaultValue={template.body}
          rows={6}
          required
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {MERGE_FIELDS.map((f) => (
          <span
            key={f.token}
            title={f.label}
            className="rounded bg-accent-soft px-2 py-0.5 text-xs text-accent-dark"
          >
            {f.token}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
        {state.ok && <p className="text-sm text-emerald-700">Saved.</p>}
      </div>
    </form>
  );
}
