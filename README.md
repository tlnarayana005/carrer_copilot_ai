# CareerCopilot AI

CareerCopilot AI is a full-stack, AI-powered career assistant designed to help software engineers manage job applications, analyze skill gaps, and prepare for interviews using Retrieval-Augmented Generation (RAG).

## Features
- **Job Application Tracking:** Full CRUD dashboard to manage applications across multiple stages (Saved, Applied, OA, Interview, Offer, Rejected).
- **AI Match Analysis:** Compare your resume against job descriptions to get a match score and actionable feedback.
- **Skill Gap Analysis:** Identify missing high-priority and medium-priority skills.
- **RAG "Ask My Resume":** Chat with your resume. Extracts text via `pdf-parse`, chunks it, generates vector embeddings using Google's Gemini API, and performs cosine similarity search.
- **Interview Prep:** Generate tailored behavioral and technical interview questions based on the job description and your specific background.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Zustand, React Router, Vite
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **AI & RAG:** Google Gemini API, Custom In-Memory Vector Store, Cosine Similarity
- **Auth:** JWT (HTTP-only cookies), bcrypt

## Getting Started
1. Clone the repository
2. Run `npm install` in both `/client` and `/server`
3. Add a `.env` file in the `/server` directory with:
   - `PORT=5000`
   - `MONGO_URI=your_mongodb_connection_string`
   - `JWT_SECRET=your_jwt_secret`
   - `GEMINI_API_KEY=your_gemini_api_key`
4. Run `npm run dev` in both `/client` and `/server`
