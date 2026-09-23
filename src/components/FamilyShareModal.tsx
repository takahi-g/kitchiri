'use client';

import { useState } from 'react';
import { Users, Copy, Check, QrCode, ShieldCheck, RefreshCw, X } from 'lucide-react';

interface FamilyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FamilyShareModal({ isOpen, onClose }: FamilyShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [householdCode] = useState('KITCHIRI-8829-FAMILY');
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(householdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-teal-500/10 p-2 text-teal-600 dark:text-teal-400">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">家族共有・リアルタイム同期</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/80 p-4 border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              あなたのファミリー共有コード
            </label>
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex-1">
                {householdCode}
              </code>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'コピー完了' : 'コピー'}
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>このコードを家族のスマホで入力すると、同じ冷蔵庫のデータが自動同期されます。</p>
            </div>
            <div className="flex items-start gap-2">
              <QrCode className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
              <p>誰かが食材を追加・編集・削除すると、リアルタイムに画面に反映されます。</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              {isSyncing ? '同期データを更新中...' : '手動で最新データを再同期'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
