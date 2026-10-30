import Link from "next/link";
export function InfoPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <Link href="/login" className="text-sm text-pink-600 hover:underline">
        ← Back to log in
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
        {children}
      </div>
    </main>
  );
}
