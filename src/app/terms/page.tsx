import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — InvoiceNudge",
};

const LAST_UPDATED = "September 23, 2026";
const OPERATOR = "Kyle Haenisch LLC";
const CONTACT_EMAIL = "kylehaenisch33@gmail.com";
const GOVERNING_STATE = "Kansas";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and
        use of InvoiceNudge (the &quot;Service&quot;), operated by{" "}
        {OPERATOR} (&quot;InvoiceNudge,&quot; &quot;we,&quot; &quot;us,&quot;
        or &quot;our&quot;). By creating an account or using the Service, you
        agree to these Terms. If you don&apos;t agree, don&apos;t use the
        Service.
      </p>

      <LegalSection heading="1. The Service">
        <p>
          InvoiceNudge is a tool that lets freelance photographers (and
          similar independent businesses) track invoices sent to their own
          clients and automatically email those clients reminders about
          unpaid invoices, according to a schedule and templates you
          configure.
        </p>
        <p>
          You are responsible for the accuracy of the invoice, client, and
          payment information you enter, and for the content of any reminder
          templates you write or edit. We are not a party to the underlying
          transaction between you and your client — we only send the emails
          and process payments you&apos;ve configured us to send and
          process.
        </p>
      </LegalSection>

      <LegalSection heading="2. Accounts">
        <p>
          You must provide accurate information when creating an account and
          keep your login credentials confidential. You&apos;re responsible
          for all activity that happens under your account. Tell us right
          away at {CONTACT_EMAIL} if you believe your account has been
          compromised.
        </p>
      </LegalSection>

      <LegalSection heading="3. Subscription, billing, and trial">
        <p>
          The Service is offered as a paid subscription, currently priced at
          $15/month, billed automatically until canceled. New accounts
          receive a 14-day free trial; you won&apos;t be charged until the
          trial ends unless you cancel first.
        </p>
        <p>
          Payments are processed by Stripe. We don&apos;t store your full
          card details ourselves. If a payment fails, we (via Stripe) may
          retry it automatically; continued failure to pay may result in
          your account being restricted to read-only access (you can still
          view your existing data, but can&apos;t create new invoices or
          clients, and automatic reminders will pause) or, eventually,
          suspended.
        </p>
        <p>
          You can cancel anytime from Settings → Billing, via Stripe&apos;s
          Customer Portal. If you cancel, you keep full access through the
          end of the period you&apos;ve already paid for; we don&apos;t
          provide partial refunds for unused time within a billing period
          except where required by law.
        </p>
        <p>
          We may change our pricing going forward; we&apos;ll give existing
          subscribers reasonable advance notice before a price change takes
          effect on their account.
        </p>
      </LegalSection>

      <LegalSection heading="4. Acceptable use">
        <p>You agree not to use the Service to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Send reminder emails for invoices that aren&apos;t genuine, or to
            recipients who haven&apos;t actually engaged you for services;
          </li>
          <li>Harass, spam, or deceive any recipient;</li>
          <li>
            Violate any applicable law, including anti-spam laws like
            CAN-SPAM;
          </li>
          <li>
            Attempt to gain unauthorized access to the Service or other
            users&apos; data; or
          </li>
          <li>
            Resell or provide the Service to third parties without our
            written permission.
          </li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate this section.
        </p>
      </LegalSection>

      <LegalSection heading="5. Your data">
        <p>
          You retain ownership of the client, invoice, and template data you
          enter into the Service. We use it only to provide the Service to
          you, as described in our{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          . You&apos;re responsible for having the right to store and use any
          personal information (like your clients&apos; names and emails)
          that you enter.
        </p>
      </LegalSection>

      <LegalSection heading="6. Third-party services">
        <p>
          The Service relies on third-party providers to operate — currently
          Supabase (database and authentication), Resend (email delivery),
          Stripe (payment processing), and Vercel (hosting). Your use of the
          Service is also subject to those providers&apos; own terms, to the
          extent they apply to how we use them on your behalf.
        </p>
      </LegalSection>

      <LegalSection heading="7. Disclaimers and limitation of liability">
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY
          KIND, EXPRESS OR IMPLIED. WE DON&apos;T GUARANTEE THE SERVICE WILL
          BE UNINTERRUPTED, ERROR-FREE, OR THAT ANY REMINDER EMAIL WILL BE
          SUCCESSFULLY DELIVERED OR RESULT IN PAYMENT.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, {OPERATOR.toUpperCase()}{" "}
          WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
          DAMAGES, INCLUDING LOST REVENUE OR UNPAID INVOICES, ARISING FROM
          YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATED
          TO THE SERVICE WON&apos;T EXCEED THE AMOUNT YOU PAID US IN THE 3
          MONTHS BEFORE THE CLAIM AROSE.
        </p>
      </LegalSection>

      <LegalSection heading="8. Termination">
        <p>
          You may stop using the Service and cancel your subscription at any
          time. We may suspend or terminate your account for violating these
          Terms, non-payment, or if we discontinue the Service, with
          reasonable notice where practical.
        </p>
      </LegalSection>

      <LegalSection heading="9. Changes to these Terms">
        <p>
          We may update these Terms from time to time. If we make material
          changes, we&apos;ll update the &quot;Last updated&quot; date above
          and, where appropriate, notify you by email. Continuing to use the
          Service after a change takes effect means you accept the updated
          Terms.
        </p>
      </LegalSection>

      <LegalSection heading="10. Governing law">
        <p>
          These Terms are governed by the laws of the State of{" "}
          {GOVERNING_STATE}, without regard to its conflict-of-laws rules.
        </p>
      </LegalSection>

      <LegalSection heading="11. Contact">
        <p>
          Questions about these Terms? Reach us at{" "}
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
