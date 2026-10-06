import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit3, Save, X, ExternalLink, MapPin, DollarSign, Calendar, FileText, Sparkles
} from 'lucide-react';
import useApplicationStore from '../store/useApplicationStore';
import useAiStore from '../store/useAiStore';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'saved', label: 'Saved', color: 'bg-indigo-500' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { value: 'oa', label: 'OA', color: 'bg-amber-500' },
  { value: 'interview', label: 'Interview', color: 'bg-purple-500' },
  { value: 'offer', label: 'Offer', color: 'bg-emerald-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

const ApplicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentApplication, isLoading, fetchApplication, updateApplication } = useApplicationStore();
  const { analyses, isLoading: isAiLoading, fetchAnalysis, runAnalysis } = useAiStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchApplication(id);
    fetchAnalysis(id);
  }, [id, fetchApplication, fetchAnalysis]);

  const handleRunAnalysis = async (type) => {
    try {
      await runAnalysis(type, id);
      toast.success('Analysis completed');
    } catch {
      toast.error('Failed to run analysis');
    }
  };

  const aiData = analyses[id] || {};

  const handleEdit = () => {
    setEditData({ ...currentApplication });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateApplication(id, editData);
      toast.success('Application updated');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateApplication(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (isLoading || !currentApplication) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const app = currentApplication;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/applications')}
          className="flex items-center gap-2 text-[#9b97b0] hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Applications
        </button>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 border border-[#3d3756] text-[#9b97b0] hover:text-white rounded-xl transition-colors"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl transition-all"
              >
                <Save size={16} />
                Save
              </button>
            </>
          ) : (
            <>
              <Link
                to={`/applications/${id}/interview-prep`}
                className="flex items-center gap-2 px-4 py-2 border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-xl transition-colors"
              >
                <Sparkles size={16} />
                Prep
              </Link>
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 border border-[#3d3756] text-[#9b97b0] hover:text-white rounded-xl transition-colors"
              >
                <Edit3 size={16} />
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-[#1e1b2e] border border-[#3d3756] rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-[#3d3756] flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-400 font-bold text-xl">
                {app.company.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    value={editData.title}
                    onChange={(e) =>
                      setEditData({ ...editData, title: e.target.value })
                    }
                    className="text-xl font-bold bg-[#13111c] border border-[#3d3756] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500 w-full"
                  />
                  <input
                    value={editData.company}
                    onChange={(e) =>
                      setEditData({ ...editData, company: e.target.value })
                    }
                    className="bg-[#13111c] border border-[#3d3756] rounded-lg px-3 py-1.5 text-[#9b97b0] focus:outline-none focus:border-indigo-500 w-full"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-white">{app.title}</h1>
                  <p className="text-[#9b97b0] mt-0.5">{app.company}</p>
                </>
              )}
            </div>
          </div>
          {app.jobUrl && !isEditing && (
            <a
              href={app.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ExternalLink size={18} />
            </a>
          )}
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          {app.location && (
            <span className="flex items-center gap-1.5 text-[#9b97b0]">
              <MapPin size={14} /> {app.location}
            </span>
          )}
          {app.salary && (
            <span className="flex items-center gap-1.5 text-[#9b97b0]">
              <DollarSign size={14} /> {app.salary}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[#9b97b0]">
            <Calendar size={14} />{' '}
            {new Date(app.applicationDate).toLocaleDateString()}
          </span>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                app.status === opt.value
                  ? `${opt.color} text-white`
                  : 'bg-[#13111c] text-[#9b97b0] border border-[#3d3756] hover:border-[#4d4768]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Job Description */}
      <div className="bg-[#1e1b2e] border border-[#3d3756] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText size={18} className="text-indigo-400" />
            Job Description
          </h2>
          {app.jobDescription && !isEditing && (
            <button className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium rounded-lg hover:border-indigo-500/50 transition-colors">
              <Sparkles size={14} />
              Analyze Match
            </button>
          )}
        </div>
        {isEditing ? (
          <textarea
            value={editData.jobDescription}
            onChange={(e) =>
              setEditData({ ...editData, jobDescription: e.target.value })
            }
            rows={10}
            className="w-full bg-[#13111c] border border-[#3d3756] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 resize-none"
            placeholder="Paste the job description here..."
          />
        ) : app.jobDescription ? (
          <p className="text-[#9b97b0] text-sm whitespace-pre-wrap leading-relaxed">
            {app.jobDescription}
          </p>
        ) : (
          <p className="text-[#6b6780] text-sm italic">
            No job description added yet. Click Edit to add one.
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="bg-[#1e1b2e] border border-[#3d3756] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
        {isEditing ? (
          <textarea
            value={editData.notes}
            onChange={(e) =>
              setEditData({ ...editData, notes: e.target.value })
            }
            rows={4}
            className="w-full bg-[#13111c] border border-[#3d3756] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 resize-none"
            placeholder="Add notes..."
          />
        ) : app.notes ? (
          <p className="text-[#9b97b0] text-sm whitespace-pre-wrap">
            {app.notes}
          </p>
        ) : (
          <p className="text-[#6b6780] text-sm italic">
            No notes yet. Click Edit to add some.
          </p>
        )}
      </div>

      {/* AI Analysis */}
      <div className="bg-[#1e1b2e] border border-[#3d3756] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-purple-400" />
            AI Analysis
          </h2>
          {app.jobDescription && !isEditing && (
            <div className="flex gap-2">
              <button 
                onClick={() => handleRunAnalysis('match')}
                disabled={isAiLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium rounded-lg hover:border-indigo-500/50 transition-colors disabled:opacity-50"
              >
                {isAiLoading ? 'Analyzing...' : 'Analyze Match'}
              </button>
              <button 
                onClick={() => handleRunAnalysis('skill-gap')}
                disabled={isAiLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium rounded-lg hover:border-emerald-500/50 transition-colors disabled:opacity-50"
              >
                Skill Gap
              </button>
            </div>
          )}
        </div>

        {!app.jobDescription ? (
          <div className="text-center py-8">
            <p className="text-[#9b97b0] text-sm">
              Add a job description to unlock AI-powered analysis
            </p>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Match Analysis Results */}
            {aiData?.match && (
              <div className="bg-[#13111c] border border-[#3d3756] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">Match Analysis</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#9b97b0]">Match Score:</span>
                    <span className={`text-lg font-bold ${
                      aiData.match.matchScore >= 80 ? 'text-emerald-400' :
                      aiData.match.matchScore >= 60 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {aiData.match.matchScore}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-emerald-400">Strengths</h4>
                    <ul className="space-y-1">
                      {aiData.match.strengths?.map((s, i) => (
                        <li key={i} className="text-sm text-[#9b97b0] flex items-start gap-2">
                          <span className="text-emerald-400 mt-1">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-amber-400">Areas for Improvement</h4>
                    <ul className="space-y-1">
                      {aiData.match.weaknesses?.map((w, i) => (
                        <li key={i} className="text-sm text-[#9b97b0] flex items-start gap-2">
                          <span className="text-amber-400 mt-1">•</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Skill Gap Results */}
            {aiData?.['skill-gap'] && (
              <div className="bg-[#13111c] border border-[#3d3756] rounded-xl p-5 space-y-4">
                <h3 className="text-white font-medium">Skill Gap Analysis</h3>
                
                {aiData['skill-gap'].skillGap?.highPriority?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-400 mb-2">High Priority Missing Skills</h4>
                    <div className="space-y-2">
                      {aiData['skill-gap'].skillGap.highPriority.map((skill, i) => (
                        <div key={i} className="bg-[#1e1b2e] p-3 rounded-lg border border-red-500/20">
                          <p className="text-white text-sm font-medium">{skill.skill}</p>
                          <p className="text-[#9b97b0] text-xs mt-1">{skill.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!aiData?.match && !aiData?.['skill-gap'] && !isAiLoading && (
               <div className="text-center py-6">
                 <p className="text-[#6b6780] text-sm">Click an analysis button above to generate AI insights.</p>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetailPage;
