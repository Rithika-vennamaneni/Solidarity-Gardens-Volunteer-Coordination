import AdminDashboard from '../AdminDashboard';

export default function AdminDashboardExample() {
  sessionStorage.setItem("adminAuthenticated", "true");
  return <AdminDashboard />;
}
