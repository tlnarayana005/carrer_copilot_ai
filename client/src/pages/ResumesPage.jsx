import { useEffect, useRef, useState } from 'react';
import { FileText, Upload, CheckCircle2, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import useResumeStore from '../store/useResumeStore';
import toast from 'react-hot-toast';

const ResumesPage = () => {
  const fileInputRef = useRef(null);
  const { resumes, isLoading, isUploading, fetchResumes, uploadResume, setPrimary, deleteResume, embedResume } = useResumeStore();
  const [embeddingId, setEmbeddingId] = useState(null);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const newResume = await uploadResume(formData);
      toast.success('Resume uploaded successfully!');
      
      // Auto-embed after upload
      handleEmbed(newResume._id);
    } catch {
      // Error handled in store
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEmbed = async (id) => {
    setEmbeddingId(id);
    try {
      await embedResume(id);
      toast.success('Resume vectorized and ready for AI!');
      fetchResumes(); // Refresh to get updated isEmbedded status
    } catch (error) {
      toast.error('Failed to process resume for AI');
    } finally {
      setEmbeddingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
    try {
      await deleteResume(id);
      toast.success('Resume deleted');
    } catch {
      toast.error('Failed to delete resume');
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await setPrimary(id);
      toast.success('Set as primary resume');
    } catch {
      toast.error('Failed to update primary resume');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Resumes</h1>
          <p className="text-[#9b97b0] mt-1">
            Upload your resumes for AI-powered job matching
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all disabled:opacity-50"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Upload size={18} />
            )}
            Upload Resume (PDF)
          </button>
        </div>
      </div>

      {/* RAG Context Info */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <ShieldCheck size={20} className="text-indigo-400" />
        </div>
        <div>
          <h3 className="text-white font-medium">How it works</h3>
          <p className="text-[#9b97b0] text-sm mt-1 leading-relaxed">
            When you upload a PDF, we extract the text and split it into logical chunks. 
            Using Google's Gemini API, these chunks are converted into vector embeddings and stored in our vector database. 
            This enables our AI to perform RAG (Retrieval-Augmented Generation) — matching specific parts of your resume exactly to what job descriptions are asking for.
          </p>
        </div>
      </div>

      {/* Resume List */}
      <div className="bg-[#1e1b2e] border border-[#3d3756] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[#13111c] border border-[#3d3756] flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-[#6b6780]" />
            </div>
            <p className="text-[#9b97b0] text-lg">No resumes uploaded yet</p>
            <p className="text-[#6b6780] text-sm mt-1">Upload a PDF to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-[#3d3756]">
            {resumes.map((resume) => (
              <div key={resume._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#13111c] transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                    resume.isPrimary ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-[#13111c] border-[#3d3756]'
                  }`}>
                    <FileText size={24} className={resume.isPrimary ? 'text-indigo-400' : 'text-[#6b6780]'} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium flex items-center gap-2">
                      {resume.fileName}
                      {resume.isPrimary && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                          Primary
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-xs text-[#6b6780]">
                        Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                      </span>
                      {resume.isEmbedded ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 size={12} /> AI Ready ({resume.chunkCount} chunks)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <AlertCircle size={12} /> Needs Processing
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-16 sm:pl-0">
                  {!resume.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(resume._id)}
                      className="text-xs font-medium text-[#9b97b0] hover:text-white px-3 py-1.5 border border-[#3d3756] rounded-lg transition-colors"
                    >
                      Make Primary
                    </button>
                  )}
                  
                  {!resume.isEmbedded && (
                    <button
                      onClick={() => handleEmbed(resume._id)}
                      disabled={embeddingId === resume._id}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 px-3 py-1.5 border border-indigo-500/30 bg-indigo-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {embeddingId === resume._id ? 'Processing...' : 'Process for AI'}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(resume._id)}
                    className="p-1.5 text-[#6b6780] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumesPage;
