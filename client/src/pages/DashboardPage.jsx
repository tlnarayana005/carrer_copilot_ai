import { useEffect } from 'react';
import {
  Briefcase,
  TrendingUp,
  Award,
  XCircle,
  CalendarDays,
  Clock,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import useApplicationStore from '../store/useApplicationStore';

const STATUS_COLORS = {
  saved: '#6366f1',
  applied: '#60a5fa',
  oa: '#fbbf24',
  interview: '#a78bfa',
  offer: '#34d399',
  rejected: '#f87171',
};

const STATUS_LABELS = {
  saved: 'Saved',
  applied: 'Applied',
  oa: 'OA',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

const DashboardPage = () => {
  const { stats, recentApps, fetchStats } = useApplicationStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Applications',
      value: stats.total,
      icon: Briefcase,
      color: 'from-indigo-500/20 to-indigo-600/5',
      iconColor: 'text-indigo-400',
    },
    {
      label: 'This Month',
      value: stats.thisMonth,
      icon: CalendarDays,
      color: 'from-blue-500/20 to-blue-600/5',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Interviews',
      value: stats.interview,
      icon: TrendingUp,
      color: 'from-purple-500/20 to-purple-600/5',
      iconColor: 'text-purple-400',
    },
    {
      label: 'Offers',
      value: stats.offer,
      icon: Award,
      color: 'from-emerald-500/20 to-emerald-600/5',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Active',
      value: stats.saved + stats.applied + stats.oa + stats.interview,
      icon: Clock,
      color: 'from-amber-500/20 to-amber-600/5',
      iconColor: 'text-amber-400',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'from-red-500/20 to-red-600/5',
      iconColor: 'text-red-400',
    },
  ];

  // Pie chart data
  const pieData = Object.entries(STATUS_LABELS)
    .map(([key, label]) => ({
      name: label,
      value: stats[key] || 0,
      color: STATUS_COLORS[key],
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[#9b97b0] mt-1">
          Overview of your job application journey
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.color} bg-[#1e1b2e] border border-[#3d3756] rounded-2xl p-5 hover:border-[#4d4768] transition-colors`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9b97b0]">{card.label}</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {card.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-[#13111c]/50 flex items-center justify-center ${card.iconColor}`}
              >
                <card.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-[#1e1b2e] border border-[#3d3756] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Status Distribution
          </h2>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#2a2640',
                        border: '1px solid #3d3756',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-[#9b97b0] flex-1">
                      {item.name}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[#9b97b0] text-sm">
              No applications yet. Start by adding one!
            </p>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-[#1e1b2e] border border-[#3d3756] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Applications
          </h2>
          {recentApps.length > 0 ? (
            <div className="space-y-3">
              {recentApps.map((app) => (
                <div
                  key={app._id}
                  className="flex items-center justify-between p-3 bg-[#13111c] rounded-xl border border-[#3d3756]/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {app.title}
                    </p>
                    <p className="text-xs text-[#9b97b0] truncate">
                      {app.company}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full ml-3 flex-shrink-0"
                    style={{
                      backgroundColor: `${STATUS_COLORS[app.status]}20`,
                      color: STATUS_COLORS[app.status],
                    }}
                  >
                    {STATUS_LABELS[app.status]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#9b97b0] text-sm">
              No applications yet. Start by adding one!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
