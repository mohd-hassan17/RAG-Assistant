import { NextResponse } from "next/server";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAI from "openai";
import { qdrant } from "@/lib/qdrant";

// ⚡ Use Flash model (cheaper + higher limits)
const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/",
});

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    // 1️⃣ Reuse existing embeddings stored in Qdrant
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY!,
      model: "text-embedding-004",
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      client: qdrant,
      collectionName: "rag1", 
    });

    const retriever = vectorStore.asRetriever({ k: 3 });

    // 2️⃣ Get top chunks
    const docs = await retriever.invoke(question);

    const SYSTEM_PROMPT = `
You are an AI assistant who answers strictly from the context below (which comes from a PDF file).
If the answer is not in the context, reply "I don't know".

Context:
${JSON.stringify(docs)}
    `;

    // 3️⃣ Call Gemini Flash instead of Pro
    const response = await client.chat.completions.create({
      model: "gemini-1.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question },
      ],
    });

    const answer = response.choices[0].message?.content || "No answer generated.";

    return NextResponse.json({ answer });
  } catch (err: unknown) {
  if (err instanceof Error) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  console.error("Unexpected error:", err);
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}
}
