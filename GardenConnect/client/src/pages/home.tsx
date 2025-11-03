import Header from "@/components/Header";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showStartOver={false} />
      <LandingPage />
    </div>
  );
}
