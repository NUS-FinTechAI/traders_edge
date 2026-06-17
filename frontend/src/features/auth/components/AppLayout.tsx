import { Outlet } from 'react-router-dom';
import { Navbar } from '../../../shared/ui/Navbar';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}


