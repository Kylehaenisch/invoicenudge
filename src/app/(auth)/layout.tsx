import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-12">
      <Link href="/" className="mb-8 font-serif text-2xl text-ink">
        InvoiceNudge
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
