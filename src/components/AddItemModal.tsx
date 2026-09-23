'use client';

import { useState, useEffect, useRef } from 'react';
import { Item, Category } from '@/types/item';
import { X, Calendar, Tag, Package, Utensils, Camera, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onBatchSave?: (items: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  initialItem?: Item | null;
}

const CATEGORIES: Category[] = ['肉類', '野菜', '魚介類', '乳製品', '調味料', '加工食品', '飲料', 'その他'];

export default function AddItemModal({ isOpen, onClose, onSave, onBatchSave, initialItem }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('野菜');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [memo, setMemo] = useState('');

  // AI Vision API解析状態
  const [isPhotoScanning, setIsPhotoScanning] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [analyzedSuccessName, setAnalyzedSuccessName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setCategory(initialItem.category);
      setPurchaseDate(initialItem.purchaseDate);
      setExpirationDate(initialItem.expirationDate);
      setQuantity(initialItem.quantity || '');
      setMemo(initialItem.memo || '');
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      const defaultExp = new Date();
      defaultExp.setDate(defaultExp.getDate() + 3);
      const expStr = defaultExp.toISOString().split('T')[0];

      setName('');
      setCategory('野菜');
      setPurchaseDate(todayStr);
      setExpirationDate(expStr);
      setQuantity('');
      setMemo('');
    }
    setPhotoPreviewUrl(null);
    setAnalyzedSuccessName(null);
    setErrorMessage(null);
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !expirationDate) return;

    onSave({
      id: initialItem?.id,
      name: name.trim(),
      category,
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      expirationDate,
      quantity: quantity.trim(),
      memo: memo.trim(),
    });

    onClose();
  };

  // 解析後の確認待ちデータ
  const [pendingScannedItems, setPendingScannedItems] = useState<any[] | null>(null);

  // 本格クライアント＆サーバー両用 AI Vision API 連携処理
  const handleProductPhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(previewUrl);
    setIsPhotoScanning(true);
    setAnalyzedSuccessName(null);
    setErrorMessage(null);
    setPendingScannedItems(null);

    const userApiKey = localStorage.getItem('kitchiri_gemini_api_key') || '';
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      let result: any = null;

      // 1. まずサーバーサイドAPI (/api/analyze-image) を試行
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (userApiKey) formData.append('userApiKey', userApiKey);

        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          result = await response.json();
        }
      } catch (e) {
        console.warn('Server route unavailable, switching to direct client Gemini API call:', e);
      }

      // 2. サーバーAPI非対応またはスタンドアロン動作時はクライアントから直接Gemini REST APIを呼び出す（他アプリと同じ完全独立型！）
      if (!result || !result.success) {
        if (!userApiKey) {
          setErrorMessage('Gemini APIキーが設定されていません。右上の「🔑」からAPIキーを保存してください。');
          setIsPhotoScanning(false);
          return;
        }

        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const resStr = reader.result as string;
            resolve(resStr.split(',')[1] || '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const mimeType = file.type || 'image/jpeg';

        const prompt = 'あなたは食材写真判別の高度AIです。\n' +
          'この画像に写っているすべての食品パッケージや食材（1つ〜複数）を分析してください。\n' +
          '画像内に複数の食材が写っている場合は最大5件まで抽出し、以下のJSON形式で回答してください。JSON以外の解説文は一切出力しないでください。\n\n' +
          '{\n' +
          '  "items": [\n' +
          '    {\n' +
          '      "detectedName": "写真から識別できる正確な日本語の商品名または食材名 (例: 納豆, コープ牛乳, 板チョコクロワッサン, 国産豚バラ肉, トマト)",\n' +
          '      "category": "肉類 | 野菜 | 魚介類 | 乳製品 | 調味料 | 加工食品 | 飲料 | その他",\n' +
          '      "expirationDate": "写真内に印字されている賞味期限(YYYY-MM-DD)。印字が見当たらない場合は本日(' + todayStr + ')からその食品の妥当な日数後の日付"\n' +
          '    }\n' +
          '  ]\n' +
          '}';

        const apiEndpoints = [
          { ver: 'v1beta', model: 'gemini-3.6-flash' },
          { ver: 'v1beta', model: 'gemini-3.1-pro-preview' },
          { ver: 'v1beta', model: 'gemini-1.5-flash-latest' },
          { ver: 'v1', model: 'gemini-1.5-flash-latest' }
        ];

        let directSuccess = false;

        for (const ep of apiEndpoints) {
          try {
            const url = `https://generativelanguage.googleapis.com/${ep.ver}/models/${ep.model}:generateContent?key=${userApiKey}`;
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: prompt },
                      { inline_data: { mime_type: mimeType, data: base64Image } }
                    ]
                  }
                ]
              })
            });

            if (res.ok) {
              const data = await res.json();
              const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (rawText) {
                const cleanJsonStr = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJsonStr);
                const rawItems = Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : [parsed];
                
                const formattedItems = rawItems.map((item: any) => {
                  const expDateStr = item.expirationDate || todayStr;
                  let pDateStr = todayStr;
                  if (expDateStr < todayStr) {
                    const d = new Date(expDateStr);
                    d.setDate(d.getDate() - 3);
                    pDateStr = d.toISOString().split('T')[0];
                  }
                  return {
                    detectedName: item.detectedName || '判定した食品',
                    category: (item.category as Category) || '加工食品',
                    expirationDate: expDateStr,
                    purchaseDate: pDateStr,
                  };
                });

                result = { success: true, items: formattedItems };
                directSuccess = true;
                break;
              }
            }
          } catch (err) {
            console.warn(`Direct fetch to ${ep.model} failed:`, err);
          }
        }

        if (!directSuccess && !result?.success) {
          setErrorMessage('Gemini APIでの解析に失敗しました。APIキーをご確認ください。');
          setIsPhotoScanning(false);
          return;
        }
      }

      if (result && result.success) {
        const detectedList = Array.isArray(result.items) && result.items.length > 0
          ? result.items
          : [{
              detectedName: result.detectedName,
              category: result.category,
              purchaseDate: result.purchaseDate,
              expirationDate: result.expirationDate,
            }];

        setPendingScannedItems(detectedList);

        if (detectedList.length === 1) {
          setName(detectedList[0].detectedName);
          setCategory(detectedList[0].category);
          setPurchaseDate(detectedList[0].purchaseDate);
          setExpirationDate(detectedList[0].expirationDate);
        }
      } else {
        setErrorMessage(result?.message || '解析エラーが発生しました');
      }
    } catch (err: any) {
      console.error('AI Vision API error:', err);
      setErrorMessage('通信エラーが発生しました');
    } finally {
      setIsPhotoScanning(false);
    }
  };

  // 確認後に一括/個別保存を実行する処理
  const handleConfirmRegisterPending = () => {
    if (!pendingScannedItems || pendingScannedItems.length === 0) return;

    if (pendingScannedItems.length > 1 && onBatchSave) {
      const batchToSave = pendingScannedItems.map((it: any) => ({
        name: it.detectedName,
        category: it.category,
        purchaseDate: it.purchaseDate,
        expirationDate: it.expirationDate,
        quantity: '1個',
        memo: '写真からAI自動判定',
      }));
      onBatchSave(batchToSave);
      onClose();
    } else {
      const item = pendingScannedItems[0];
      onSave({
        id: initialItem?.id,
        name: item.detectedName || name,
        category: item.category || category,
        purchaseDate: item.purchaseDate || purchaseDate,
        expirationDate: item.expirationDate || expirationDate,
        quantity: quantity.trim() || '1個',
        memo: memo.trim() || '写真からAI自動判定',
      });
      onClose();
    }
  };

  const inputBaseClass = "w-full h-13 h-[52px] box-border appearance-none rounded-2xl border-2 border-slate-300 px-4 py-3 text-base font-bold bg-white focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700">
        {/* 固定ヘッダー */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-slate-100 bg-white/95 pb-3 dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-sm">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-slate-100">
            <Utensils className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {initialItem ? '食材情報を編集' : '新しい食材を登録'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 📷 AI Vision カメラ読み取りエリア */}
        {!initialItem && (
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white shadow-lg">
            {/* カメラ直接撮影用 */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleProductPhotoCapture}
              className="hidden"
            />
            {/* アルバム/フォルダから選択用 */}
            <input
              type="file"
              accept="image/*"
              id="library-file-input"
              onChange={handleProductPhotoCapture}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {photoPreviewUrl ? (
                  <img
                    src={photoPreviewUrl}
                    alt="商品プレビュー"
                    className="h-12 w-12 object-cover rounded-xl border-2 border-white shadow shrink-0"
                  />
                ) : (
                  <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md shrink-0">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-black text-white text-base">
                    AI Vision 写真から一発判別
                  </h3>
                  <p className="text-xs font-bold text-emerald-100">
                    撮影 または ライブラリの既存写真を選択可能
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isPhotoScanning}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-black px-3.5 py-2.5 text-sm shadow-md transition-all active:scale-95 whitespace-nowrap"
                >
                  {isPhotoScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      <span>解析中...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 text-emerald-600" />
                      <span>撮影する</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isPhotoScanning}
                  onClick={() => document.getElementById('library-file-input')?.click()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-black px-3.5 py-2.5 text-sm shadow-md transition-all active:scale-95 whitespace-nowrap border border-white/30"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>写真を選ぶ</span>
                </button>
              </div>
            </div>

            {/* 🚀 派手目な解析中アニメーションオーバーレイ */}
            {isPhotoScanning && (
              <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 animate-pulse text-white shadow-2xl border-2 border-yellow-300 flex items-center justify-center gap-3">
                <Sparkles className="h-7 w-7 text-yellow-200 animate-spin shrink-0" />
                <div className="text-center">
                  <div className="text-lg font-black tracking-wider text-yellow-100 drop-shadow-md">
                    ✨ Gemini 3.6 AI 超高速解析中... ✨
                  </div>
                  <p className="text-xs font-black text-white/90">
                    写真から商品名と賞味期限を読み取っています！
                  </p>
                </div>
                <Loader2 className="h-7 w-7 text-white animate-spin shrink-0" />
              </div>
            )}

            {/* 📋 解析結果確認：「登録しますか？」確認カード */}
            {pendingScannedItems && pendingScannedItems.length > 0 && !isPhotoScanning && (
              <div className="mt-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 p-4 border-2 border-amber-400 shadow-md animate-in fade-in">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    AI解析完了: 以下を登録しますか？
                  </span>
                </div>

                {/* 検出された商品リスト */}
                <div className="space-y-2 my-3">
                  {pendingScannedItems.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-800 p-2.5 border border-amber-200 dark:border-slate-700 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {item.category || '食品'}
                        </span>
                        <span className="text-base font-black text-slate-900 dark:text-slate-100">
                          {item.detectedName}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        期限: {item.expirationDate}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleConfirmRegisterPending}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 text-base shadow-lg transition-all active:scale-95"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    {pendingScannedItems.length > 1
                      ? `${pendingScannedItems.length}件を一括登録する`
                      : 'この内容で登録する'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingScannedItems(null)}
                    className="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-300 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mt-3 text-xs sm:text-sm font-black text-red-900 bg-red-100 p-2.5 rounded-xl flex items-center justify-center gap-1.5 animate-in fade-in border border-red-300">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-base font-extrabold text-slate-800 dark:text-slate-200 mb-1">
              食材名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例: 豚バラ肉, キャベツ, 牛乳"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputBaseClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                カテゴリ
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className={`${inputBaseClass} pr-10`}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <Tag className="pointer-events-none absolute right-4 top-3.5 h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-base font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                数量・残量
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="例: 1本, 200g, 1/2個"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`${inputBaseClass} pr-10`}
                />
                <Package className="pointer-events-none absolute right-4 top-3.5 h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                購入日
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className={`${inputBaseClass} pr-10`}
                />
                <Calendar className="pointer-events-none absolute right-4 top-3.5 h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-base font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                賞味期限 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className={`${inputBaseClass} pr-10 border-emerald-500 text-emerald-700 dark:text-emerald-400`}
                />
                <Calendar className="pointer-events-none absolute right-4 top-3.5 h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-base font-extrabold text-slate-800 dark:text-slate-200 mb-1">
              メモ (任意)
            </label>
            <input
              type="text"
              placeholder="例: 開封済み, 冷凍保存中など"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className={inputBaseClass}
            />
          </div>

          {/* 固定フッター */}
          <div className="sticky bottom-0 z-10 bg-white/95 dark:bg-slate-900/95 pt-3 border-t-2 border-slate-100 dark:border-slate-800 flex justify-end gap-3 backdrop-blur-sm">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-5 py-3 text-base font-extrabold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-emerald-600 px-7 py-3 text-base font-extrabold text-white shadow-lg hover:bg-emerald-500 transition-all active:scale-95"
            >
              {initialItem ? '更新する' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
