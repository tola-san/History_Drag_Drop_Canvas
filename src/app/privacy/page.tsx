import { InfoPage } from "@/components/info-page";
export const metadata = { title: "Privacy policy" };
export default function Page() {
  return (
    <InfoPage title="Privacy policy">
      <p>
        This is an authentication starter project. A service-specific privacy
        policy has not been published.
      </p>
      <p>
        The service owner must document their data collection, retention,
        service providers, and user rights before accepting registrations from
        real users.
      </p>
    </InfoPage>
  );
}
