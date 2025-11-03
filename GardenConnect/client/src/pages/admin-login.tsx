import Header from "@/components/Header";
import AdminLogin from "@/components/AdminLogin";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showStartOver={true} />
      <AdminLogin />
    </div>
  );
}
