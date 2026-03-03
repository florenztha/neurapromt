'use client';

import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { smartChat } from '@/lib/ai';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function ChatPage() {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: t.chat_welcome }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Map messages to history format
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await smartChat({
        preferredModel: "llama-3.3-70b-versatile",
        fallbackModels: [],
        message: userMessage,
        history: history,
        config: {
          systemInstruction: `You are the Neura Generator Ai AI Assistant, an expert in prompt engineering, content strategy, and AI creative tools. 
          The user's preferred language is ${language}. You MUST respond in this language.
          Help users optimize their prompts and understand how to use the various tools in Neura Generator Ai (Content Lab, Image Studio, Video Factory, etc.). Be professional, insightful, and helpful.`,
        }
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || t.chat_error }]);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message?.toLowerCase() || "";
      const isQuotaError = errorMsg.includes('429') || 
                          errorMsg.includes('resource_exhausted') || 
                          errorMsg.includes('quota') || 
                          errorMsg.includes('rate exceeded');
      
      const errorText = isQuotaError 
        ? t.chat_quota_error
        : t.chat_connection_error;
        
      setMessages(prev => [...prev, { role: 'model', text: errorText }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{t.chat_title}</h1>
            <p className="text-zinc-500 text-sm font-normal">{t.chat_subtitle}</p>
          </div>
          <button 
            onClick={() => setMessages([{ role: 'model', text: t.chat_cleared }])}
            className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white border border-zinc-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col max-w-[85%] sm:max-w-[75%]",
                  msg.role === 'user' ? "ml-auto items-end" : "items-start"
                )}
              >
                <div className={cn(
                  "px-5 py-3.5 rounded-[1.5rem] text-[15px] leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-zinc-100 text-zinc-900 rounded-tl-none"
                )}>
                  <div className={cn("prose prose-sm max-w-none", msg.role === 'user' ? "prose-invert" : "prose-zinc")}>
                    <ReactMarkdown>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-widest px-1">
                  {msg.role === 'user' ? t.chat_you : t.chat_assistant}
                </span>
              </motion.div>
            ))}
            {loading && (
              <div className="flex flex-col items-start max-w-[85%]">
                <div className="px-5 py-3.5 rounded-[1.5rem] rounded-tl-none bg-zinc-100 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-zinc-400" />
                  <span className="text-sm text-zinc-400 font-medium">{t.chat_thinking}</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-zinc-100 bg-zinc-50/30">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t.chat_placeholder}
                className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 pr-14 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-zinc-900"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
