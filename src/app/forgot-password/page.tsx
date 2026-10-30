import { InfoPage } from "@/components/info-page";
export const metadata = { title: "Password recovery" };
export default function Page() {
  return (
    <InfoPage title="Need a fresh start?">
      <p>
        Self-service password recovery isn’t available yet. Contact your account
        administrator for help accessing your account.
      </p>
      <p>Never share your password or session cookies with anyone.</p>
    </InfoPage>
  );
}
