// lib/qdrant.ts
import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333", // or Qdrant Cloud URL
  apiKey: process.env.QDRANT_API_KEY, // only if cloud
});
