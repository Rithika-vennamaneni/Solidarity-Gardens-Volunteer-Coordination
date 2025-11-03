import Header from "@/components/Header";
import VolunteerForm from "@/components/VolunteerForm";

export default function Volunteer() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showStartOver={true} />
      <VolunteerForm />
    </div>
  );
}
