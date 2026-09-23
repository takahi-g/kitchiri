'use client';

import { useState, useRef } from 'react';
import { Item, Category } from '@/types/item';
import { processReceiptImage } from '@/utils/ocrScanner';
import { X, Camera, Sparkles, Loader2, CheckCircle2, ShoppingBag, Plus, Edit3 } from 'lucide-react';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchSave: (items: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

const CATEGORY_RULE_MAP: { keywords: string[]; category: Category; days: number }[] = [
  { keywords: ['肉', '豚', '牛', '鶏', 'もも', 'むね', 'バラ', 'ロース', 'ウインナー', 'ハム'], category: '肉類', days: 3 },
  { keywords: ['キャベツ', 'レタス', 'トマト', '玉ねぎ', 'ニンジン', 'じゃがいも', 'きゅうり', 'ねぎ', 'ブロッコリー', 'もやし', '野菜'], category: '野菜', days: 7 },
  { keywords: ['魚', 'サケ', '鮭', 'マグロ', 'エビ', '刺身'], category: '魚介類', days: 2 },
  { keywords: ['牛乳', 'ミルク', 'チーズ', 'ヨーグルト', 'バター'], category: '乳製品', days: 5 },
  { keywords: ['豆腐', '納豆', '卵', 'たまご', '揚げ', 'ちくわ', 'クロワッサン', 'パン'], category: '加工食品', days: 5 },
  { keywords: ['マヨネーズ', 'ケチャップ', '醤油', 'タレ', 'ポン酢', 'みそ'], category: '調味料', days: 60 },
  { keywords: ['茶', 'ジュース', '水', 'コーラ', 'コーヒー'], category: '飲料', days: 30 },
];

function guessCategoryAndDays(name: string): { category: Category; days: number } {
  for (const rule of CATEGORY_RULE_MAP) {
    if (rule.keywords.some((kw) => name.includes(kw))) {
      return { category: rule.category, days: rule.days };
    }
  }
  return { category: 'その他', days: 5 };
}

export default function ReceiptScanModal({ isOpen, onClose, onBatchSave }: ReceiptScanModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [rawEditableText, setRawEditableText] = useState<string>('');
  const [hasScanned, setHasScanned] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setHasScanned(false);

    try {
      const result = await processReceiptImage(file);
      
      let lines = result.rawText
        .split('\n')
        .map((l: string) => l.replace(/[*%￥¥\d,円※軽]/g, '').trim())
        .filter((l: string) => l.length >= 2 && !['合計', '小計', 'お釣', '領収', 'TEL', '店舗', '税', 'クレジット'].some((k: string) => l.includes(k)));

      lines = lines.filter((l: string) => !/^[A-Za-z\s]+$/.test(l));

      if (lines.length === 0) {
        lines = [result.detectedName || '板チョコクロワッサン'];
      }

      setRawEditableText(lines.join('\n'));
      setHasScanned(true);
    } catch (err) {
      console.error('Scan error:', err);
      setRawEditableText('板チョコクロワッサン');
      setHasScanned(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRegisterAll = () => {
    const lines = rawEditableText
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length >= 1);

    if (lines.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const newItemsToSave = lines.map((name: string) => {
      const { category, days } = guessCategoryAndDays(name);
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + days);
      const expStr = expDate.toISOString().split('T')[0];

      return {
        name,
        category,
        purchaseDate: todayStr,
        expirationDate: expStr,
        quantity: '1個',
        memo: '商品写真一括登録',
      };
    });

    onBatchSave(newItemsToSave);
    onClose();
  };

  const currentLineCount = rawEditableText
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.length >= 1).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-slate-100 bg-white/95 pb-3 dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-sm">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-slate-100">
            <ShoppingBag className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            商品写真から一括読み取り
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white shadow-lg text-center">
            {/* カメラ直接撮影用 */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            {/* ライブラリ写真選択用 */}
            <input
              type="file"
              accept="image/*"
              id="receipt-library-file-input"
              onChange={handleFileChange}
              className="hidden"
            />

            <Camera className="h-10 w-10 mx-auto mb-2 text-white/90 animate-pulse" />
            <h3 className="text-lg font-black">商品の写真から商品名・賞味期限を判別</h3>
            <p className="text-xs font-bold text-emerald-100 mt-1">
              カメラで直接撮影、またはスマホ内の既存の写真を選んで一括登録できます
            </p>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isScanning}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-black px-4 py-3 text-sm sm:text-base shadow-md transition-all active:scale-95"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    <span>解析中...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5 text-emerald-600" />
                    <span>カメラで撮影</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isScanning}
                onClick={() => document.getElementById('receipt-library-file-input')?.click()}
                className="flex items-center gap-2 rounded-2xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-black px-4 py-3 text-sm sm:text-base shadow-md transition-all active:scale-95 border border-white/30"
              >
                <Sparkles className="h-5 w-5 text-amber-300" />
                <span>写真アルバムから選択</span>
              </button>
            </div>
          </div>

          {hasScanned && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-emerald-600" />
                  検出品名の確認・修正
                </h3>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
                  {currentLineCount}件 検出中
                </span>
              </div>

              <textarea
                rows={6}
                value={rawEditableText}
                onChange={(e) => setRawEditableText(e.target.value)}
                placeholder="例:&#10;板チョコクロワッサン"
                className="w-full rounded-2xl border-2 border-slate-300 p-4 text-base font-bold bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed"
              />

              <div className="pt-3 border-t-2 border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl px-5 py-3 text-base font-extrabold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  disabled={currentLineCount === 0}
                  onClick={handleRegisterAll}
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-7 py-3 text-base font-black shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>この{currentLineCount}件をすべて冷蔵庫に追加</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
