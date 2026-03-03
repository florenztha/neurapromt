'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { motion } from 'motion/react';
import { ShieldCheck, AlertCircle, RefreshCw, Zap, Key } from 'lucide-react';

export default function DebugPage() {
  const [status, setStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setStatus([]);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Say "Groq Active"' }],
          model: 'llama-3.3-70b-versatile',
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus([{
          key: 'Connection',
          status: 'success',
          message: 'Successfully connected to Groq API',
          details: `Model: ${data.model}, Response: "${data.text}"`
        }]);
      } else {
        setStatus([{
          key: 'Connection',
          status: 'error',
          message: 'Failed to connect to Groq API',
          details: data.error || 'Unknown error'
        }]);
      }
    } catch (error: any) {
      setStatus([{
        key: 'Connection',
        status: 'error',
        message: 'Network or Server Error',
        details: error.message
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
            <ShieldCheck className="text-blue-600" />
            System Diagnostics
          </h1>
          <p className="text-zinc-500">Check your Groq API status and connection health.</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-100 rounded-2xl">
                <Key className="w-6 h-6 text-zinc-600" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900">Groq API Status</h3>
                <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">llama-3.3-70b-versatile / llama-3.2-11b-vision-preview</p>
              </div>
            </div>
            <button 
              onClick={testConnection}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          <div className="space-y-4">
            {status.length === 0 && !loading && (
              <div className="p-6 border border-dashed border-zinc-200 rounded-2xl text-center text-zinc-400 text-sm">
                Click &quot;Test Connection&quot; to verify your API keys.
              </div>
            )}

            {status.map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl border ${
                  s.status === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  {s.status === 'success' ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-600 mt-1" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
                  )}
                  <div className="space-y-1">
                    <h4 className={`font-bold ${s.status === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>
                      {s.message}
                    </h4>
                    <p className={`text-sm ${s.status === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {s.details}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Key className="text-blue-400 w-5 h-5" />
            Troubleshooting Tips
          </h3>
          <ul className="space-y-2 text-sm text-zinc-400 list-disc pl-5">
            <li>Ensure your API keys are correctly set in the environment variables.</li>
            <li>Check if your Groq account has enough credits or hasn&apos;t exceeded its rate limits.</li>
            <li>Verify that the model <code className="text-blue-400">llama-3.3-70b-versatile</code> is available in your region.</li>
            <li>If you see a 401 error, your API key is likely invalid or expired.</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
