## RAG Chat — PDFs, URLs, and Text

A Retrieval-Augmented Generation (RAG) app that lets users upload PDFs, add URLs, or paste text, indexes everything into Qdrant, and then lets them chat with an AI that answers strictly from the indexed content.

## 🚀 Demo

🔗 [Live Demo](https://rag-assistant-una6.vercel.app/)  

✨ Features

Upload PDFs, add web URLs, or paste raw text

Vector indexing with Google Gemini embeddings (text-embedding-004)

Qdrant vector DB

Chat inference with Gemini 1.5 Flash (fast, cost-effective)

Clean separation of indexing vs query

Safe TypeScript error handling (no any in catches)

Basic retry/backoff for 429 rate limits

🧱 Tech Stack

Frontend/Server: Next.js (App Router)

RAG/LLM: LangChain + Google Generative AI (Gemini)

Vector DB: Qdrant

Loaders: Cheerio (HTML), WebPDFLoader (PDF), raw text

Language: TypeScript
