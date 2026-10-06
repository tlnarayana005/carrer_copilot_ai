import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  LogOut,
  Menu,
  X,
  Bot,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/applications', label: 'Applications', icon: Briefcase },
  { path: '/resumes', label: 'Resumes', icon: FileText },
  { path: '/interview-prep', label: 'Interview Prep', icon: Bot },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Failed to logout');
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#1e1b2e] border-r border-[#3d3756] z-50 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#3d3756]">
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              CareerCopilot
            </span>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-[#2a2640] text-[#9b97b0] hover:text-white transition-colors"
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-[#9b97b0] hover:bg-[#2a2640] hover:text-white'
              }`}
            >
              <item.icon
                size={20}
                className={`flex-shrink-0 ${
                  isActive
                    ? 'text-indigo-400'
                    : 'text-[#9b97b0] group-hover:text-white'
                }`}
              />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-[#3d3756]">
        {!isCollapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-[#9b97b0] truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[#9b97b0] hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
