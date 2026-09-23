import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — InvoiceNudge",
};

const LAST_UPDATED = "September 23, 2026";
const OPERATOR = "Kyle Haenisch LLC";
const CONTACT_EMAIL = "kylehaenisch33@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        This Privacy Policy explains what information InvoiceNudge, operated
        by {OPERATOR}, collects, how we use it, and who we share it with. It
        applies to the InvoiceNudge web application and covers both{" "}
        <strong>accountholders</strong> (photographers who sign up for
        InvoiceNudge) and <strong>their clients</strong> (people who receive
        a reminder email or open an invoice link).
      </p>

      <LegalSection heading="1. Information we collect">
        <p>
          <strong>From accountholders:</strong> your email address, password
          (stored hashed by our authentication provider, never in plain
          text), and business name. Also anything you enter to run your
          business through the Service: client names, client email
          addresses, client business names, invoice amounts, descriptions,
          and due dates, and the reminder templates you write or edit.
        </p>
        <p>
          <strong>From clients:</strong> if a photographer using
          InvoiceNudge enters your name, email, and business name as one of
          their clients, we store that information and use it to send you
          reminder emails and show you the invoice when you open its link.
          We don&apos;t collect anything about you beyond what your
          photographer entered, unless you create your own InvoiceNudge
          account.
        </p>
        <p>
          <strong>Payment information:</strong> subscription payments (what
          accountholders pay us) and invoice payments (what their clients
          pay them through the Service) are both processed by Stripe. We
          never see or store full card numbers — Stripe handles that
          directly and shares back only what we need to operate the Service
          (like subscription status and payment confirmation).
        </p>
        <p>
          <strong>Automatically collected:</strong> standard web server logs
          (IP address, browser type, pages visited) collected by our hosting
          provider, Vercel, for security and reliability purposes.
        </p>
      </LegalSection>

      <LegalSection heading="2. How we use this information">
        <ul className="list-disc space-y-1 pl-5">
          <li>To provide the Service — hosting your account data, sending the reminder emails you&apos;ve configured, and processing payments;</li>
          <li>To communicate with accountholders about their account, billing, or changes to the Service;</li>
          <li>To maintain security and prevent abuse; and</li>
          <li>To comply with legal obligations.</li>
        </ul>
        <p>
          We don&apos;t sell your data, or your clients&apos; data, to
          anyone, and we don&apos;t use it for advertising.
        </p>
      </LegalSection>

      <LegalSection heading="3. Who we share it with">
        <p>
          We share information with the third-party services that make the
          Service work, and only for that purpose:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Supabase</strong> — hosts our database and handles
            account authentication.
          </li>
          <li>
            <strong>Resend</strong> — delivers the reminder emails on an
            accountholder&apos;s behalf.
          </li>
          <li>
            <strong>Stripe</strong> — processes subscription payments and
            invoice payments.
          </li>
          <li>
            <strong>Vercel</strong> — hosts the application itself.
          </li>
        </ul>
        <p>
          We don&apos;t share your information with anyone else, except if
          required by law (for example, in response to a valid legal
          request) or as part of a merger, acquisition, or sale of assets
          (in which case we&apos;d ask the new owner to honor this policy).
        </p>
      </LegalSection>

      <LegalSection heading="4. Data retention">
        <p>
          We keep account, client, and invoice data for as long as an
          account is active. If you delete a client or invoice within the
          app, it&apos;s removed from our active database. If you close your
          account, contact us at {CONTACT_EMAIL} and we&apos;ll delete your
          account data within a reasonable time, except where we&apos;re
          required to retain records (for example, payment records for tax
          purposes).
        </p>
      </LegalSection>

      <LegalSection heading="5. Your rights">
        <p>
          Depending on where you live, you may have rights to access,
          correct, or delete the personal information we hold about you. To
          exercise any of these, email {CONTACT_EMAIL} — we&apos;ll respond
          within a reasonable time. If you&apos;re a client of an
          InvoiceNudge accountholder and want your information removed, you
          can also ask the photographer directly, since they control what
          client records exist in their account.
        </p>
      </LegalSection>

      <LegalSection heading="6. Cookies">
        <p>
          We use a small number of essential cookies to keep you signed in
          (managed by Supabase Auth). We don&apos;t use advertising or
          tracking cookies.
        </p>
      </LegalSection>

      <LegalSection heading="7. Children's privacy">
        <p>
          The Service is intended for business use by adults and isn&apos;t
          directed at children. We don&apos;t knowingly collect information
          from anyone under 18.
        </p>
      </LegalSection>

      <LegalSection heading="8. Changes to this policy">
        <p>
          We may update this policy from time to time. If we make material
          changes, we&apos;ll update the &quot;Last updated&quot; date above
          and, where appropriate, notify accountholders by email. See also
          our{" "}
          <Link href="/terms" className="text-accent hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="9. Contact">
        <p>
          Questions about this policy, or want to exercise a privacy right?
          Reach us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-accent hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
