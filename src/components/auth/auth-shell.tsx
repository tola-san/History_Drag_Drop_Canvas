import Link from "next/link";
import { ArrowUpRight, Layers2, ShieldCheck } from "lucide-react";
export function AuthShell({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: "login" | "register";
}) {
  const login = mode === "login";
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 px-6 py-7 sm:px-12">
        <Link
          href="/login"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-pink-600 text-white">
            <Layers2 size={19} aria-hidden />
          </span>
          auth<span className="-ml-2 font-normal text-slate-400">basic</span>
        </Link>
        <span className="text-sm text-slate-500">
          <span className="hidden sm:inline">
            {login ? "New around here?" : "Already a member?"}
          </span>
          <Link
            className="ml-2 inline-flex items-center gap-1 font-medium text-slate-900 hover:text-pink-600"
            href={login ? "/register" : "/login"}
          >
            {login ? "Create an account" : "Log in"}
            <ArrowUpRight size={14} aria-hidden />
          </Link>
        </span>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:py-14">
        <div className="w-full max-w-[440px]">
          <div className="mb-7 text-center">
            <span className="mb-5 inline-flex rounded-2xl border border-slate-200 bg-white p-3.5 text-pink-600 shadow-sm">
              <Layers2 size={25} aria-hidden />
            </span>
            <h1 className="text-3xl font-semibold tracking-tight">
              {login ? "Welcome back" : "Your next chapter starts here"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {login
                ? "A little focus. A fresh start. Log in to your account."
                : "Create an account. Make room for what’s next."}
            </p>
          </div>
          <section
            aria-label={login ? "Log in" : "Create account"}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_40px_-20px_rgba(15,23,42,0.2)] sm:p-8"
          >
            {children}
          </section>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={14} aria-hidden />
            Built for a secure, simple sign-in.
          </p>
        </div>
      </main>
      <footer className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-6 py-6 text-xs text-slate-400">
        <span>© {new Date().getFullYear()} Auth Basic</span>
        <Link href="/terms">Terms of service</Link>
        <Link href="/privacy">Privacy policy</Link>
      </footer>
    </div>
  );
}
