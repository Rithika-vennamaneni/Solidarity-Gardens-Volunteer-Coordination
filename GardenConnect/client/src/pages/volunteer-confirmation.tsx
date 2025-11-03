import Header from "@/components/Header";
import VolunteerConfirmation from "@/components/VolunteerConfirmation";

export default function VolunteerConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showStartOver={false} />
      <VolunteerConfirmation />
    </div>
  );
}
