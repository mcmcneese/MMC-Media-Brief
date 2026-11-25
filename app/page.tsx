import ErrorShell from "@/components/ErrorShell";

export default function HomePage() {
  return (
    <ErrorShell
      kicker="Personal link needed"
      headline="Open your brief from your invitation"
      body="Each media brief has its own link. Please use the link in your invitation, or contact mediastrategy@mmc.us and we will send it again."
    />
  );
}
