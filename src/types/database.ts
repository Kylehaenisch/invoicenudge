// Hand-authored types mirroring supabase/migrations/0001_init.sql.
// If you change the schema, update this file (and re-run `npm run seed` if
// you added columns the seed script needs).
//
// These are declared with `type`, not `interface`, on purpose: postgrest-js
// resolves the shape of `select()` results through deep conditional/mapped
// types, and an `interface` for Row/Insert/Update silently breaks that
// resolution — every query ends up typed as `never` with no error at the
// `Database` type itself, only at each call site. `type` aliases don't have
// this problem. (A real Supabase project sidesteps all of this by
// generating this file with `supabase gen types typescript`.)

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
export type ReminderKey =
  | "before_due_3"
  | "due_date"
  | "after_due_7"
  | "after_due_14";
export type ReminderLogStatus = "sent" | "failed" | "skipped";

export type Profile = {
  id: string;
  email: string;
  business_name: string;
  created_at: string;
};

export type Client = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  business_name: string;
  created_at: string;
};

export type ReminderTemplate = {
  id: string;
  user_id: string;
  key: ReminderKey;
  offset_days: number;
  subject: string;
  body: string;
  enabled: boolean;
  created_at: string;
};

export type Invoice = {
  id: string;
  user_id: string;
  client_id: string;
  amount_cents: number;
  description: string;
  issue_date: string; // date, "YYYY-MM-DD"
  due_date: string; // date, "YYYY-MM-DD"
  status: InvoiceStatus;
  public_token: string;
  paid_at: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ReminderLogEntry = {
  id: string;
  invoice_id: string;
  template_key: ReminderKey;
  scheduled_for: string;
  sent_at: string;
  status: ReminderLogStatus;
  error: string | null;
};

export type InvoiceWithClient = Invoice & {
  client: Client;
};

/**
 * Minimal typed-client shape for @supabase/supabase-js / @supabase/ssr generics.
 * Every table needs `Relationships` (even empty) and the schema needs
 * `Views`/`Functions` (even empty) or postgrest-js's generic constraints
 * fall back to `never` — see the file-level note above for the other half
 * of this (the `type` vs `interface` issue).
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<Client, "id" | "user_id">>;
        Relationships: [];
      };
      reminder_templates: {
        Row: ReminderTemplate;
        Insert: Partial<ReminderTemplate> & {
          user_id: string;
          key: ReminderKey;
        };
        Update: Partial<Omit<ReminderTemplate, "id" | "user_id" | "key">>;
        Relationships: [];
      };
      invoices: {
        Row: Invoice;
        Insert: Partial<Invoice> & {
          user_id: string;
          client_id: string;
          amount_cents: number;
          due_date: string;
        };
        Update: Partial<Omit<Invoice, "id" | "user_id">>;
        Relationships: [];
      };
      reminder_log: {
        Row: ReminderLogEntry;
        Insert: Omit<ReminderLogEntry, "id" | "sent_at" | "error"> & {
          id?: string;
          error?: string | null;
        };
        Update: Partial<ReminderLogEntry>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
