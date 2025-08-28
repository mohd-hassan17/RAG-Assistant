import { NextResponse } from "next/server";
import { QdrantVectorStore } from "@langchain/qdrant";
import { qdrant } from "@/lib/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { Document } from "langchain/document";

export async function POST(req: Request) {
  try {
    const { texts = [], urls = [], pdfs = [] } = await req.json();
    const docs: Document[] = [];

    // 1️⃣ Pasted text
    docs.push(
      ...texts.map(
        (t: string, i: number) =>
          new Document({
            pageContent: t,
            metadata: { source: `text-${i}` },
          })
      )
    );

    // 2️⃣ URLs
    for (const url of urls) {
      const loader = new CheerioWebBaseLoader(url);
      const urlDocs = await loader.load();
      docs.push(...urlDocs);
    }

    // 3️⃣ PDFs
    for (let i = 0; i < pdfs.length; i++) {
      const buffer = Buffer.from(pdfs[i], "base64");
      const loader = new WebPDFLoader(new Blob([buffer]));
      const pdfDocs = await loader.load();
      docs.push(...pdfDocs);
    }

    if (docs.length === 0) {
      return NextResponse.json(
        { error: "No content provided" },
        { status: 400 }
      );
    }

    // 4️⃣ Embed once, store in Qdrant
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GEMINI_API_KEY,
    });

    await QdrantVectorStore.fromDocuments(docs, embeddings, {
      client: qdrant,
      collectionName: "rag1", // ✅ keep same collection name
    });

    return NextResponse.json({ success: true, count: docs.length });
  } catch (err: unknown) {
  if (err instanceof Error) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  console.error("Unexpected error:", err);
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}
}
