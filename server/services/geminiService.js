const { GoogleGenAI } = require('@google/genai');

let ai = null;

const getAI = () => {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not set. Please add it to your .env file.');
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
};

/**
 * Generate text using Gemini
 * @param {string} prompt - The prompt to send
 * @param {boolean} jsonMode - Whether to request JSON output
 * @returns {string} The generated text
 */
const generateText = async (prompt, jsonMode = false) => {
  const genAI = getAI();

  const config = {};
  if (jsonMode) {
    config.responseMimeType = 'application/json';
  }

  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config,
  });

  return response.text;
};

/**
 * Generate embeddings for text chunks using Gemini
 * @param {string[]} texts - Array of text strings to embed
 * @returns {number[][]} Array of embedding vectors
 */
const generateEmbeddings = async (texts) => {
  const genAI = getAI();

  const result = await genAI.models.embedContent({
    model: 'gemini-embedding-exp-03-07',
    contents: texts,
  });

  return result.embeddings.map((e) => e.values);
};

/**
 * Generate a single embedding
 */
const generateEmbedding = async (text) => {
  const embeddings = await generateEmbeddings([text]);
  return embeddings[0];
};

module.exports = { generateText, generateEmbeddings, generateEmbedding };
