import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Brain, Send } from 'lucide-react';
import useApplicationStore from '../store/useApplicationStore';
import useAiStore from '../store/useAiStore';
import toast from 'react-hot-toast';

const InterviewPrepPage = () => {
  const { id } = useParams();
  const { currentApplication, fetchApplication } = useApplicationStore();
  const { analyses, fetchAnalysis, runAnalysis, isLoading: isAiLoading, askQuestion, chatHistory, isChatLoading } = useAiStore();
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    fetchApplication(id);
    fetchAnalysis(id);
  }, [id, fetchApplication, fetchAnalysis]);

  const handleGenerateQuestions = async () => {
    try {
      await runAnalysis('interview-prep', id);
      toast.success('Interview questions generated!');
    } catch {
      // Error handled in store
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const query = chatInput;
    setChatInput('');
    await askQuestion(query);
  };

  const aiData = analyses[id] || {};
  const questions = aiData['interview-prep']?.interviewQuestions || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to={`/applications/${id}`}
          className="p-2 bg-[#1e1b2e] border border-[#3d3756] hover:bg-[#2a2640] rounded-xl text-[#9b97b0] hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Interview Prep</h1>
          {currentApplication && (
            <p className="text-[#9b97b0] mt-1">
              {currentApplication.title} at {currentApplication.company}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: AI Questions */}
        <div className="bg-[#1e1b2e] border border-[#3d3756] rounded-2xl p-6 flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Brain size={18} className="text-purple-400" />
              Tailored Questions
            </h2>
            <button
              onClick={handleGenerateQuestions}
              disabled={isAiLoading}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {isAiLoading ? 'Generating...' : questions.length > 0 ? 'Regenerate' : 'Generate'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {questions.length === 0 && !isAiLoading && (
              <div className="text-center py-12">
                <p className="text-[#9b97b0] text-sm">
                  Click Generate to create custom interview questions based on your resume and this job description.
                </p>
              </div>
            )}
            
            {questions.map((q, i) => (
              <div key={i} className="bg-[#13111c] border border-[#3d3756] rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    q.category.includes('Behavioral') ? 'bg-blue-500/20 text-blue-400' :
                    q.category.includes('Technical') ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {q.category}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    q.difficulty === 'Hard' ? 'border-red-500/30 text-red-400' :
                    q.difficulty === 'Medium' ? 'border-amber-500/30 text-amber-400' :
                    'border-emerald-500/30 text-emerald-400'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>
                <h4 className="text-white font-medium mb-2">{q.question}</h4>
                <p className="text-xs text-[#9b97b0] bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                  <span className="font-semibold text-indigo-400">Why this was asked: </span>
                  {q.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: RAG Chat */}
        <div className="bg-[#1e1b2e] border border-[#3d3756] rounded-2xl p-6 flex flex-col h-[700px]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
            <MessageSquare size={18} className="text-indigo-400" />
            Ask My Resume (RAG)
          </h2>
          <p className="text-xs text-[#9b97b0] mb-6">
            Uses Vector Search to pull context directly from your PDF to answer questions.
          </p>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 flex flex-col">
            {chatHistory.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#9b97b0] text-sm">
                  Try asking: "How should I answer a question about my React experience?"
                </p>
              </div>
            )}
            
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : msg.role === 'error'
                    ? 'bg-red-500/20 border border-red-500/30 text-red-200 rounded-bl-none'
                    : 'bg-[#13111c] border border-[#3d3756] text-white rounded-bl-none'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.role === 'ai' && msg.ragUsed && (
                    <div className="mt-3 pt-3 border-t border-[#3d3756]">
                      <p className="text-[10px] text-indigo-400 font-medium mb-1">RETRIEVED FROM RESUME:</p>
                      <ul className="space-y-1">
                        {msg.sources?.map((s, idx) => (
                          <li key={idx} className="text-[10px] text-[#6b6780] italic">
                            "...{s.text}..." (Score: {s.score})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#13111c] border border-[#3d3756] rounded-2xl rounded-bl-none p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="relative mt-auto">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about your experience..."
              className="w-full bg-[#13111c] border border-[#3d3756] rounded-xl pl-4 pr-12 py-3 text-white placeholder-[#6b6780] focus:outline-none focus:border-indigo-500 transition-colors"
              disabled={isChatLoading}
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterviewPrepPage;
