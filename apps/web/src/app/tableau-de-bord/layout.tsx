import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';

export default function TableauDeBordLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, minHeight: '100vh' }}>
        <TopBar />
        <main style={{ padding: 'var(--batione-space-5)' }}>{children}</main>
      </div>
    </div>
  );
}
