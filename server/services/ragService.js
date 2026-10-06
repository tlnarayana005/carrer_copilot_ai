const { generateEmbedding } = require('./geminiService');

/**
 * Simple in-memory vector store
 * 
 * WHY NOT ChromaDB?
 * ChromaDB requires a separate running server. For a student portfolio project,
 * an in-memory store is simpler to set up and demonstrate. The RAG concepts
 * (chunking, embedding, cosine similarity, top-K retrieval) are identical.
 * 
 * In production, you'd swap this for ChromaDB/Pinecone/Qdrant.
 */

// In-memory storage: { id: { embedding, text, metadata } }
const vectorStore = new Map();

/**
 * Split text into chunks with overlap
 * 
 * WHY CHUNKING?
 * LLMs have context limits, and embeddings work better on focused text.
 * Splitting a resume into ~500 char chunks means each chunk covers
 * one topic (a project, a skill section, etc.), making retrieval precise.
 * 
 * WHY OVERLAP?
 * Overlap (100 chars) ensures sentences that span chunk boundaries
 * aren't lost. Without overlap, a skill mentioned at the end of one
 * chunk and explained at the start of the next would be split apart.
 */
const chunkText = (text, chunkSize = 500, overlap = 100) => {
  const chunks = [];
  let start = 0;

  // Clean text: normalize whitespace
  const cleanedText = text.replace(/\s+/g, ' ').trim();

  if (cleanedText.length <= chunkSize) {
    return [cleanedText];
  }

  while (start < cleanedText.length) {
    let end = start + chunkSize;

    // Try to break at a sentence or period boundary
    if (end < cleanedText.length) {
      const lastPeriod = cleanedText.lastIndexOf('.', end);
      const lastNewline = cleanedText.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    chunks.push(cleanedText.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks.filter((chunk) => chunk.length > 20); // Skip tiny chunks
};

/**
 * Cosine similarity between two vectors
 * 
 * WHY COSINE SIMILARITY?
 * It measures the angle between two vectors, ignoring magnitude.
 * Two chunks about "React" will have similar directions in embedding space
 * regardless of chunk length. Range: -1 to 1, where 1 = identical direction.
 */
const cosineSimilarity = (a, b) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Store document chunks with embeddings
 * 
 * PIPELINE: text → chunks → embeddings → vector store
 * Each chunk gets its own embedding vector for granular retrieval.
 */
const storeDocument = async (documentId, text, metadata = {}) => {
  const chunks = chunkText(text);

  for (let i = 0; i < chunks.length; i++) {
    const chunkId = `${documentId}_chunk_${i}`;
    const embedding = await generateEmbedding(chunks[i]);

    vectorStore.set(chunkId, {
      embedding,
      text: chunks[i],
      metadata: { ...metadata, chunkIndex: i, documentId },
    });
  }

  return chunks.length;
};

/**
 * Similarity search — find the top-K most relevant chunks
 * 
 * WHAT IS TOP-K?
 * Instead of returning all chunks, we return only the K most similar ones.
 * K=5 means we send 5 relevant resume sections to the LLM as context.
 * Too few = missing context. Too many = noise + higher cost.
 * 
 * @param {string} query - The search query
 * @param {number} topK - Number of results to return
 * @param {object} filter - Metadata filter (e.g., { userId: '...' })
 */
const similaritySearch = async (query, topK = 5, filter = {}) => {
  const queryEmbedding = await generateEmbedding(query);

  const results = [];

  for (const [id, entry] of vectorStore) {
    // Apply metadata filters (e.g., only this user's documents)
    let matches = true;
    for (const [key, value] of Object.entries(filter)) {
      if (entry.metadata[key] !== value) {
        matches = false;
        break;
      }
    }
    if (!matches) continue;

    const score = cosineSimilarity(queryEmbedding, entry.embedding);
    results.push({ id, text: entry.text, score, metadata: entry.metadata });
  }

  // Sort by similarity score (highest first) and return top-K
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
};

/**
 * Delete all chunks for a document
 */
const deleteDocument = (documentId) => {
  for (const [id, entry] of vectorStore) {
    if (entry.metadata.documentId === documentId) {
      vectorStore.delete(id);
    }
  }
};

/**
 * Get stats about stored vectors
 */
const getStoreStats = () => {
  return {
    totalChunks: vectorStore.size,
    documents: [...new Set([...vectorStore.values()].map((v) => v.metadata.documentId))].length,
  };
};

module.exports = {
  chunkText,
  cosineSimilarity,
  storeDocument,
  similaritySearch,
  deleteDocument,
  getStoreStats,
};
