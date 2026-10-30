import { InfoPage } from "@/components/info-page";
export const metadata = { title: "Terms of service" };
export default function Page() {
  return (
    <InfoPage title="Terms of service">
      <p>
        This is an authentication starter project. Service-specific terms have
        not been published.
      </p>
      <p>
        The service owner must replace this page with their terms before
        accepting registrations from real users.
      </p>
    </InfoPage>
  );
}
