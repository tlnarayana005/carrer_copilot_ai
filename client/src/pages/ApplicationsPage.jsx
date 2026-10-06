import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trash2,
  X,
} from 'lucide-react';
import useApplicationStore from '../store/useApplicationStore';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'oa', label: 'OA' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS = {
  saved: { bg: 'bg-indigo-500/15', text: 'text-indigo-400' },
  applied: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  oa: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  interview: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  offer: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  rejected: { bg: 'bg-red-500/15', text: 'text-red-400' },
};

const EMPTY_FORM = {
  company: '',
  title: '',
  jobUrl: '',
  jobDescription: '',
  location: '',
  salary: '',
  status: 'saved',
  applicationDate: new Date().toISOString().split('T')[0],
  deadline: '',
  interviewDate: '',
  notes: '',
};

const ApplicationsPage = () => {
  const {
    applications,
    total,
    page,
    pages,
    isLoading,
    fetchApplications,
    createApplication,
    deleteApplication,
  } = useApplicationStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchApplications({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: search || undefined,
      page: 1,
    });
  }, [statusFilter, fetchApplications]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchApplications({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: search || undefined,
      page: 1,
    });
  };

  const handlePageChange = (newPage) => {
    fetchApplications({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: search || undefined,
      page: newPage,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.company || !formData.title) {
      toast.error('Company and job title are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await createApplication(formData);
      toast.success('Application created!');
      setShowModal(false);
      setFormData(EMPTY_FORM);
      fetchApplications({ page: 1 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, company) => {
    if (!window.confirm(`Delete application for ${company}?`)) return;
    try {
      await deleteApplication(id);
      toast.success('Application deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Applications</h1>
          <p className="text-[#9b97b0] mt-1">{total} total applications</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all duration-200"
        >
          <Plus size={18} />
          Add Application
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6780]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company or title..."
            className="w-full pl-11 pr-4 py-2.5 bg-[#1e1b2e] border border-[#3d3756] rounded-xl text-white placeholder-[#6b6780] focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </form>
        <div className="relative">
          <Filter
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6780] pointer-events-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-11 pr-8 py-2.5 bg-[#1e1b2e] border border-[#3d3756] rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 bg-[#1e1b2e] border border-[#3d3756] rounded-2xl">
          <p className="text-[#9b97b0] text-lg">No applications found</p>
          <p className="text-[#6b6780] text-sm mt-1">
            Click "Add Application" to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app._id}
              className="bg-[#1e1b2e] border border-[#3d3756] rounded-xl p-4 hover:border-[#4d4768] transition-colors group"
            >
              <div className="flex items-center justify-between">
                <Link
                  to={`/applications/${app._id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-4">
                    {/* Company initial */}
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-[#3d3756] flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-400 font-bold text-sm">
                        {app.company.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-medium truncate group-hover:text-indigo-400 transition-colors">
                        {app.title}
                      </h3>
                      <p className="text-[#9b97b0] text-sm truncate">
                        {app.company}
                        {app.location && ` · ${app.location}`}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status]?.bg} ${STATUS_COLORS[app.status]?.text}`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                  <span className="text-xs text-[#6b6780]">
                    {new Date(app.applicationDate).toLocaleDateString()}
                  </span>
                  {app.jobUrl && (
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#6b6780] hover:text-indigo-400 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(app._id, app.company)}
                    className="text-[#6b6780] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="p-2 rounded-lg bg-[#1e1b2e] border border-[#3d3756] text-[#9b97b0] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-[#9b97b0] px-3">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pages}
            className="p-2 rounded-lg bg-[#1e1b2e] border border-[#3d3756] text-[#9b97b0] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e1b2e] border border-[#3d3756] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#3d3756]">
              <h2 className="text-xl font-bold text-white">
                New Application
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#9b97b0] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9b97b0] mb-1.5">
                    Company *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    placeholder="Google"
                    className="w-full px-3 py-2.5 bg-[#13111c] border border-[#3d3756] rounded-xl text-white placeholder-[#6b6780] focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9b97b0] mb-1.5">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Software Engineer"
                    className="w-full px-3 py-2.5 bg-[#13111c] border border-[#3d3756] rounded-xl text-white placeholder-[#6b6780] focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9b97b0] mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Bangalore, India"
                    className="w-full px-3 py-2.5 bg-[#13111c] border border-[#3d3756] rounded-xl text-white placeholder-[#6b6780] focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9b97b0] mb-1.5">
                    Salary
                  </label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                    placeholder="₹10-15 LPA"
                    className="w-full px-3 py-2.5 bg-[#13111c] border border-[#3d3756] rounded-xl text-white placeholder-[#6b6780] focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9b97b0] mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-[#13111c] border border-[#3d3756] rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {STATUS_OPTIONS.filter((o) => o.value !== 'all').map(
                      (opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9b97b0] mb-1.5">
                    Application Date
                  </label>
                  <input
                    type="date"
                    value={formData.applicationDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        applicationDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 bg-[#13111c] border border-[#3d3756] rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#9b97b0] mb-1.5">
                  Job URL
                </label>
                <input
                  type="url"
                  value={formData.jobUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, jobUrl: e.target.value })
                  }
                  placeholder="https://careers.google.com/..."
                  className="w-full px-3 py-2.5 bg-[#13111c] border border-[#3d3756] rounded-xl text-white placeholder-[#6b6780] focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#9b97b0] mb-1.5">
                  Job Description
                </label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jobDescription: e.target.value,
                    })
                  }
                  placeholder="Paste the job description here..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-[#13111c] border border-[#3d3756] rounded-xl text-white placeholder-[#6b6780] focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#9b97b0] mb-1.5">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any notes about this application..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-[#13111c] border border-[#3d3756] rounded-xl text-white placeholder-[#6b6780] focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-[#9b97b0] hover:text-white border border-[#3d3756] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
