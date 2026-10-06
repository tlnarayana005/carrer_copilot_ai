const Resume = require('../models/Resume');
const JobApplication = require('../models/JobApplication');
const AIAnalysis = require('../models/AIAnalysis');
const { generateText } = require('../services/geminiService');
const { storeDocument, similaritySearch, deleteDocument } = require('../services/ragService');

/**
 * @desc    Embed a resume into the vector store (called after upload)
 * @route   POST /api/ai/embed
 * @access  Private
 */
const embedResume = async (req, res, next) => {
  try {
    const { resumeId } = req.body;

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    if (!resume.extractedText) {
      return res.status(400).json({ success: false, message: 'No text extracted from resume' });
    }

    // Delete old embeddings if re-embedding
    deleteDocument(resumeId);

    // Store chunks in vector store
    const chunkCount = await storeDocument(resumeId, resume.extractedText, {
      userId: req.user._id.toString(),
      resumeId: resumeId,
      type: 'resume',
    });

    // Update resume record
    resume.isEmbedded = true;
    resume.chunkCount = chunkCount;
    await resume.save();

    res.json({
      success: true,
      message: `Resume embedded successfully (${chunkCount} chunks)`,
      chunkCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Analyze match between resume and job description
 * @route   POST /api/ai/analyze-match
 * @access  Private
 */
const analyzeMatch = async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    const application = await JobApplication.findOne({
      _id: applicationId,
      userId: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (!application.jobDescription) {
      return res.status(400).json({ success: false, message: 'No job description found' });
    }

    // Get primary resume
    const resume = await Resume.findOne({ userId: req.user._id, isPrimary: true });
    if (!resume || !resume.extractedText) {
      return res.status(400).json({ success: false, message: 'No primary resume found. Please upload a resume first.' });
    }

    // Retrieve relevant resume chunks via RAG
    let contextChunks = '';
    try {
      const results = await similaritySearch(
        application.jobDescription,
        5,
        { userId: req.user._id.toString() }
      );
      contextChunks = results.map((r) => r.text).join('\n\n');
    } catch {
      // Fallback to full resume text if embeddings aren't ready
      contextChunks = resume.extractedText;
    }

    const prompt = `You are a career advisor AI. Analyze the match between this resume and job description.

RESUME CONTENT:
${contextChunks || resume.extractedText}

JOB DESCRIPTION:
${application.jobDescription}

Respond with ONLY valid JSON in this exact format:
{
  "matchScore": <number 0-100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Rules:
- Be specific and reference actual content from both documents
- matchScore should reflect genuine skill overlap, not be inflated
- Only list skills actually present or missing
- Suggestions should be actionable and realistic
- Do NOT invent experience or skills the candidate doesn't have`;

    const responseText = await generateText(prompt, true);
    let analysis;

    try {
      analysis = JSON.parse(responseText);
    } catch {
      // If JSON parsing fails, try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Save analysis to database
    const saved = await AIAnalysis.findOneAndUpdate(
      { applicationId, analysisType: 'match', userId: req.user._id },
      {
        userId: req.user._id,
        applicationId,
        resumeId: resume._id,
        analysisType: 'match',
        matchScore: analysis.matchScore,
        matchedSkills: analysis.matchedSkills || [],
        missingSkills: analysis.missingSkills || [],
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        suggestions: analysis.suggestions || [],
        rawResponse: responseText,
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, analysis: saved });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Skill gap analysis
 * @route   POST /api/ai/skill-gap
 * @access  Private
 */
const skillGap = async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    const application = await JobApplication.findOne({
      _id: applicationId,
      userId: req.user._id,
    });

    if (!application || !application.jobDescription) {
      return res.status(400).json({ success: false, message: 'Application with job description required' });
    }

    const resume = await Resume.findOne({ userId: req.user._id, isPrimary: true });
    if (!resume || !resume.extractedText) {
      return res.status(400).json({ success: false, message: 'No primary resume found' });
    }

    const prompt = `You are a career advisor. Analyze the skill gap between this resume and job description.

RESUME:
${resume.extractedText}

JOB DESCRIPTION:
${application.jobDescription}

Respond with ONLY valid JSON:
{
  "matchedSkills": ["skill1", "skill2"],
  "skillGap": {
    "highPriority": [{"skill": "skill name", "reason": "why it's critical for this role"}],
    "mediumPriority": [{"skill": "skill name", "reason": "why it's helpful"}],
    "lowPriority": [{"skill": "skill name", "reason": "nice to have"}]
  }
}

Rules:
- High priority: skills explicitly required in JD that candidate lacks
- Medium priority: skills mentioned as preferred/bonus
- Low priority: skills that would help but aren't mentioned
- Be realistic about priorities`;

    const responseText = await generateText(prompt, true);
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    }

    const saved = await AIAnalysis.findOneAndUpdate(
      { applicationId, analysisType: 'skill-gap', userId: req.user._id },
      {
        userId: req.user._id,
        applicationId,
        resumeId: resume._id,
        analysisType: 'skill-gap',
        matchedSkills: result.matchedSkills || [],
        skillGap: result.skillGap || {},
        rawResponse: responseText,
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, analysis: saved });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate interview questions
 * @route   POST /api/ai/interview-questions
 * @access  Private
 */
const interviewQuestions = async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    const application = await JobApplication.findOne({
      _id: applicationId,
      userId: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const resume = await Resume.findOne({ userId: req.user._id, isPrimary: true });

    const prompt = `You are a technical interviewer. Generate personalized interview questions for this candidate.

${resume?.extractedText ? `CANDIDATE RESUME:\n${resume.extractedText}\n\n` : ''}
${application.jobDescription ? `JOB DESCRIPTION:\n${application.jobDescription}\n\n` : ''}
ROLE: ${application.title} at ${application.company}

Respond with ONLY valid JSON:
{
  "interviewQuestions": [
    {
      "category": "Technical|Behavioral|System Design|Coding|Domain",
      "question": "the interview question",
      "reason": "why this question is relevant given the candidate's background",
      "difficulty": "Easy|Medium|Hard"
    }
  ]
}

Generate 10-15 questions. Rules:
- Base questions on actual resume content and JD requirements
- Include a mix of categories
- "reason" should reference specific resume items or JD requirements
- Include at least 2 behavioral questions using STAR format prompts
- Include at least 1 system design question if the role warrants it`;

    const responseText = await generateText(prompt, true);
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { interviewQuestions: [] };
    }

    const saved = await AIAnalysis.findOneAndUpdate(
      { applicationId, analysisType: 'interview-prep', userId: req.user._id },
      {
        userId: req.user._id,
        applicationId,
        resumeId: resume?._id,
        analysisType: 'interview-prep',
        interviewQuestions: result.interviewQuestions || [],
        rawResponse: responseText,
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, analysis: saved });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ask a question about your resume (RAG)
 * @route   POST /api/ai/ask-resume
 * @access  Private
 */
const askResume = async (req, res, next) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: 'Please provide a question' });
    }

    // RAG: retrieve relevant chunks from vector store
    const results = await similaritySearch(
      question,
      5,
      { userId: req.user._id.toString() }
    );

    if (results.length === 0) {
      // Fallback: use primary resume text directly
      const resume = await Resume.findOne({ userId: req.user._id, isPrimary: true });
      if (!resume || !resume.extractedText) {
        return res.status(400).json({
          success: false,
          message: 'No resume found. Please upload and embed a resume first.',
        });
      }

      const prompt = `Based on this resume, answer the following question.

RESUME:
${resume.extractedText}

QUESTION: ${question}

Answer based ONLY on information in the resume. If the information isn't there, say so. Do not invent or assume.`;

      const answer = await generateText(prompt);
      return res.json({
        success: true,
        answer,
        sources: ['Full resume (no embeddings available)'],
        ragUsed: false,
      });
    }

    // Build context from retrieved chunks
    const context = results.map((r, i) => `[Chunk ${i + 1}] (similarity: ${r.score.toFixed(3)})\n${r.text}`).join('\n\n');

    const prompt = `You are a helpful career assistant. Answer the user's question using ONLY the retrieved resume content below.

RETRIEVED RESUME SECTIONS:
${context}

QUESTION: ${question}

Rules:
- Answer based ONLY on the retrieved content. Do not hallucinate or invent.
- If the retrieved content doesn't contain enough information, say so.
- Reference specific details from the resume in your answer.
- Be concise and helpful.`;

    const answer = await generateText(prompt);

    res.json({
      success: true,
      answer,
      sources: results.map((r) => ({
        text: r.text.substring(0, 150) + '...',
        score: r.score.toFixed(3),
      })),
      ragUsed: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resume improvement suggestions
 * @route   POST /api/ai/resume-improvement
 * @access  Private
 */
const resumeImprovement = async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    const application = await JobApplication.findOne({
      _id: applicationId,
      userId: req.user._id,
    });

    if (!application || !application.jobDescription) {
      return res.status(400).json({ success: false, message: 'Application with JD required' });
    }

    const resume = await Resume.findOne({ userId: req.user._id, isPrimary: true });
    if (!resume || !resume.extractedText) {
      return res.status(400).json({ success: false, message: 'No primary resume found' });
    }

    const prompt = `You are a resume advisor. Suggest improvements to tailor this resume for this specific job.

RESUME:
${resume.extractedText}

JOB DESCRIPTION:
${application.jobDescription}

Respond with ONLY valid JSON:
{
  "suggestions": [
    "specific, actionable suggestion 1",
    "specific, actionable suggestion 2"
  ]
}

Rules:
- Suggest which existing skills/projects to emphasize
- Suggest missing JD keywords to add (only if the candidate actually has the skill)
- Identify weak bullet points that could be stronger
- NEVER suggest inventing experience, skills, or projects
- Suggest reordering or rephrasing, not fabricating
- Be specific — reference actual resume content and JD requirements`;

    const responseText = await generateText(prompt, true);
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { suggestions: [] };
    }

    const saved = await AIAnalysis.findOneAndUpdate(
      { applicationId, analysisType: 'resume-improvement', userId: req.user._id },
      {
        userId: req.user._id,
        applicationId,
        resumeId: resume._id,
        analysisType: 'resume-improvement',
        suggestions: result.suggestions || [],
        rawResponse: responseText,
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, analysis: saved });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get existing analysis for an application
 * @route   GET /api/ai/analysis/:applicationId
 * @access  Private
 */
const getAnalysis = async (req, res, next) => {
  try {
    const analyses = await AIAnalysis.find({
      applicationId: req.params.applicationId,
      userId: req.user._id,
    }).lean();

    // Group by type
    const grouped = {};
    analyses.forEach((a) => {
      grouped[a.analysisType] = a;
    });

    res.json({ success: true, analyses: grouped });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  embedResume,
  analyzeMatch,
  skillGap,
  interviewQuestions,
  askResume,
  resumeImprovement,
  getAnalysis,
};
