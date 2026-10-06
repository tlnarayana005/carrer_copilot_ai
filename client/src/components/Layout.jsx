import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#13111c]">
      <Sidebar />
      <main className="ml-64 p-6 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
