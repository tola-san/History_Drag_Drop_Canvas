import { cookies } from "next/headers";
import { verifySessionCookies } from "@/lib/server-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OnboardingWorkspace } from "@/components/onboarding/workspace";

export const metadata = { title: "Your workspace" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await verifySessionCookies((await cookies()).getAll());
  if (session.status === "unauthorized") redirect("/login");
  const email = session.status === "authenticated" ? session.email : undefined;
  if (!email)
    return (
      <main className="mx-auto max-w-md px-6 py-32">
        <h1 className="text-2xl font-semibold">
          We couldn’t verify your session
        </h1>
        <p className="my-4 text-slate-500">
          Check that the authentication service is available, then try again.
        </p>
        <Link href="/onboarding" className="mr-5 text-pink-700 underline">
          Try again
        </Link>
        <Link href="/login" className="underline">
          Back to login
        </Link>
      </main>
    );
  return <OnboardingWorkspace email={email} />;
}
