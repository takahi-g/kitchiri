'use client';

import { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Sparkles } from 'lucide-react';

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
  currentKey: string;
}

export default function GeminiKeyModal({ isOpen, onClose, onSaveKey, currentKey }: GeminiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    setApiKey(currentKey);
  }, [currentKey, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(apiKey.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Key className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Gemini AI キー設定</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/60 p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-sm font-extrabold text-amber-950 dark:text-amber-200 mb-1">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Google Gemini AIビジョン連携</span>
            </div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 leading-relaxed">
              Google AI Studioで無料発行できるGemini APIキーを設定すると、撮影した写真の食品名や賞味期限印字が超高精度に解析されます！
            </p>
          </div>

          <div>
            <label className="block text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">
              Gemini API Key
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full h-[52px] rounded-2xl border-2 border-slate-300 px-4 py-3 text-base font-mono font-bold bg-white focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>Google AI Studioでキーを取得(無料)</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="pt-3 border-t-2 border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-5 py-3 text-base font-extrabold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-emerald-600 px-7 py-3 text-base font-extrabold text-white shadow-lg hover:bg-emerald-500 transition-all active:scale-95 flex items-center gap-2"
            >
              <ShieldCheck className="h-5 w-5" />
              <span>保存する</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
