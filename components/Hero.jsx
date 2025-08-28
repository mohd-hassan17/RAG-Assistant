'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Link, FileText, X, Send, Trash2, Plus } from 'lucide-react';

const SplitPanelUI = () => {
  const [files, setFiles] = useState([]);
  const [urls, setUrls] = useState([]);
  const [pastedTexts, setPastedTexts] = useState([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClear = () => {
    setMessages([]); // 🧹 Clear chat
  };

  const handleFileUpload = async (e) => {
  const uploadedFiles = Array.from(e.target.files);

  const newFiles = await Promise.all(
    uploadedFiles.map(async (file) => {
      const base64 = await fileToBase64(file);
      return {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        base64, // needed for backend
        rawFile: file, // keep original for text files
      };
    })
  );

  // Update state
  setFiles((prev) => [...prev, ...newFiles]);

  // 👇 Send each file to backend
  for (const file of newFiles) {
    if (file.type === "application/pdf") {
      // PDFs → send as base64
      await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfs: [file.base64] }),
      });
    } else if (file.type === "text/plain") {
      // Text files → read text content
      const text = await file.rawFile.text();
      await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: [text] }),
      });
    }
  }
};

// helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]); // strip data:... prefix
    reader.onerror = (error) => reject(error);
  });
};

  const addUrl = async () => {
  if (currentUrl.trim()) {
    const newUrl = {
      id: Date.now(),
      url: currentUrl.trim(),
      domain: new URL(currentUrl).hostname
    };
    setUrls((prev) => [...prev, newUrl]);
    setCurrentUrl('');

    // 👇 Send to backend
    await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: [newUrl.url] }),
    });
  }
};

  const addPastedText = async () => {
  if (textInput.trim()) {
    const newText = {
      id: Date.now(),
      content: textInput.trim(),
      preview: textInput.trim().substring(0, 100) + (textInput.length > 100 ? '...' : '')
    };
    setPastedTexts((prev) => [...prev, newText]);
    setTextInput('');

    // 👇 Send to backend
    await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: [newText.content] }),
    });
  }
};

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));
  const removeUrl = (id) => setUrls(prev => prev.filter(u => u.id !== id));
  const removePastedText = (id) => setPastedTexts(prev => prev.filter(t => t.id !== id));

  const sendMessage = async () => {
  if (currentMessage.trim()) {
    const userMessage = { id: Date.now(), type: "user", content: currentMessage };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");

    // 👇 call backend
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: currentMessage }),
    });
    const data = await res.json();

    const aiResponse = {
      id: Date.now() + 1,
      type: "ai",
      content: data.answer || "Sorry, I couldn't find an answer.",
    };

    setMessages((prev) => [...prev, aiResponse]);
  }
};

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col lg:flex-row">
      {/* Left Panel - Upload Section */}
      <div className="w-full lg:w-[35%] bg-white/10 backdrop-blur-xl border-r border-white/20 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            Content Sources
          </h2>
          <p className="text-white/70 text-sm">Upload files, add URLs, or paste text to get started</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white/90 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md flex items-center justify-center">
                  <Upload className="w-3 h-3 text-white" />
                </div>
                Files
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center gap-2 text-sm shadow-lg hover:shadow-blue-500/25"
              >
                <Plus className="w-4 h-4" />
                Upload
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.doc,.docx,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between group hover:bg-white/20 transition-all border border-white/10 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{file.name}</p>
                        <p className="text-xs text-white/60">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* URL Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white/90 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-md flex items-center justify-center">
                <Link className="w-3 h-3 text-white" />
              </div>
              URLs
            </h3>
            
            <div className="flex gap-2">
              <input
                type="url"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                onKeyPress={(e) => e.key === 'Enter' && addUrl()}
              />
              <button
                onClick={addUrl}
                disabled={!currentUrl.trim()}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
              >
                Add
              </button>
            </div>
            
            {urls.length > 0 && (
              <div className="space-y-2">
                {urls.map((url) => (
                  <div key={url.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between group hover:bg-white/20 transition-all border border-white/10 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Link className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{url.domain}</p>
                        <p className="text-xs text-white/60 truncate max-w-[200px]">{url.url}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeUrl(url.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Text Input Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white/90 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                <FileText className="w-3 h-3 text-white" />
              </div>
              Text Input
            </h3>
            
            <div className="space-y-3">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your text content here..."
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none transition-all"
                rows={4}
              />
              <button
                onClick={addPastedText}
                disabled={!textInput.trim()}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-purple-500/25"
              >
                Add Text
              </button>
            </div>
            
            {pastedTexts.length > 0 && (
              <div className="space-y-2">
                {pastedTexts.map((text) => (
                  <div key={text.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-start justify-between group hover:bg-white/20 transition-all border border-white/10 shadow-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mt-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white leading-relaxed">{text.preview}</p>
                        <p className="text-xs text-white/60 mt-1">{text.content.length} characters</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removePastedText(text.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all ml-2"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clear All Button */}
          {(files.length > 0 || urls.length > 0 || pastedTexts.length > 0) && (
            <button
              onClick={() => {
                setFiles([]);
                setUrls([]);
                setPastedTexts([]);
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/25"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Right Panel - Chat Section */}
      <div className="w-full lg:w-[65%] flex flex-col bg-white/5 backdrop-blur-xl shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            RAG AI Assistant
          </h2>
          <p className="text-white/70 text-sm">Chat with AI about your uploaded content</p>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10">
                <Send className="w-10 h-10 text-white/60" />
              </div>
              <h3 className="text-white text-lg font-medium mb-2">Ready to Chat</h3>
              <p className="text-white/60">Start a conversation with the AI assistant</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-lg ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : 'bg-white/10 backdrop-blur-sm text-white border border-white/10'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2">
        <button
          onClick={handleClear}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Clear Messages
        </button>
      </div>
        {/* Message Input */}
        <div className="border-t border-white/10 p-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || (files.length === 0 && urls.length === 0 && pastedTexts.length === 0)}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 transition-all transform hover:scale-105 flex items-center gap-3 shadow-lg hover:shadow-blue-500/25"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitPanelUI;