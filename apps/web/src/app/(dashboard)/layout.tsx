import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { AuthProvider } from '@/lib/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ flex: 1, minHeight: '100vh' }}>
          <TopBar />
          <main style={{ padding: 'var(--batione-space-5)' }}>{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
