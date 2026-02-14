'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import AuthNav from '@/components/AuthNav';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SAMPLE_QUESTIONS = [
  'What is AskDocs?',
  'How does RAG search work?',
  'What file formats are supported?',
  'How do I deploy a chatbot on my website?',
];

const DEMO_ANSWERS: Record<string, string> = {
  'what is askdocs':
    'AskDocs is a RAG-as-a-Service platform that lets you build AI-powered chatbots from your documents. Upload PDFs, crawl web pages, or add Q&A pairs, and we handle chunking, embedding, and intelligent search to deliver accurate answers.',
  'how does rag search work':
    'RAG (Retrieval-Augmented Generation) works in two steps:\n\n1. **Retrieval**: When a user asks a question, we search your document chunks using hybrid vector + keyword search to find the most relevant passages.\n\n2. **Generation**: The retrieved passages are sent to an LLM along with the question, which generates a natural language answer grounded in your actual documents.',
  'what file formats are supported':
    'AskDocs supports the following formats:\n\n- **PDF**: Upload PDF files up to 10MB\n- **Web Pages**: Crawl any public URL to extract content\n- **Q&A Pairs**: Manually add question-answer pairs for precise control\n- **Text/HTML**: Plain text and HTML content',
  'how do i deploy a chatbot on my website':
    'Deploying is simple! After creating your bot and uploading documents:\n\n1. Go to your bot settings and copy the embed code\n2. Paste the `<script>` tag into your website\'s HTML\n3. The chat widget will appear as a floating button\n\nYou can also connect via Telegram or use our REST API for custom integrations.',
};

function getDemoAnswer(question: string): string {
  const lower = question.toLowerCase().trim().replace(/[?!.]/g, '');
  for (const [key, answer] of Object.entries(DEMO_ANSWERS)) {
    if (lower.includes(key) || key.includes(lower)) return answer;
  }
  return "I'm a demo bot with limited knowledge. In a real AskDocs bot, I would search your uploaded documents to find the answer. Try asking one of the suggested questions, or sign up to build your own AI chatbot!";
}

export default function DemoPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m an AskDocs demo bot. Ask me anything about our platform, or try one of the suggested questions below.' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  function sendMessage(text: string) {
    if (!text.trim() || typing) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const answer = getDemoAnswer(text);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
      setTyping(false);
    }, 800 + Math.random() * 700);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">AskDocs</Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Pricing</Link>
            <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Docs</Link>
            <Link href="/demo" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Demo</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AuthNav />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center px-6 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Try AskDocs</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Chat with our demo bot to see how AskDocs-powered chatbots work.
          </p>
        </div>

        {/* Chat Window */}
        <div className="mt-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
          {/* Chat Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-blue-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                A
              </div>
              <div>
                <div className="text-sm font-semibold text-white">AskDocs Demo Bot</div>
                <div className="text-xs text-blue-200">Powered by RAG</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto px-4 py-4 space-y-3 bg-white dark:bg-gray-800">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-gray-100 dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick Questions */}
          <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2">
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={typing}
                  className="rounded-full border border-gray-200 dark:border-gray-600 px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={typing}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This is a demo with pre-defined answers. Real bots search your actual documents.
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Build Your Own Bot
          </Link>
        </div>
      </div>
    </div>
  );
}
