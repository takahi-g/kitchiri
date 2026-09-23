'use client';

import { useState, useEffect } from 'react';
import { Item } from '@/types/item';
import { getStoredItems, saveItemsToStorage } from '@/lib/itemStorage';
import AddItemModal from '@/components/AddItemModal';
import ReceiptScanModal from '@/components/ReceiptScanModal';
import GeminiKeyModal from '@/components/GeminiKeyModal';
import ItemList from '@/components/ItemList';
import UrgentAlertBanner from '@/components/UrgentAlertBanner';
import RecipeSuggestions from '@/components/RecipeSuggestions';
import FamilyShareModal from '@/components/FamilyShareModal';
import {
  Refrigerator,
  Plus,
  ChefHat,
  Users,
  Bell,
  CheckCircle,
  RotateCw,
  Camera,
  Key,
} from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'recipes'>('inventory');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // バージョン情報
  const appVersion = 'ver. 2026.09.23 13:14';

  const loadData = () => {
    const loadedItems = getStoredItems();
    setItems(loadedItems);

    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('kitchiri_gemini_api_key') || '';
      setGeminiApiKey(savedKey);
    }
  };

  useEffect(() => {
    loadData();

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveGeminiKey = (key: string) => {
    setGeminiApiKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kitchiri_gemini_api_key', key);
    }
    showToast('Gemini APIキーを保存しました！');
  };

  // 本格ブラウザ最新化・強制リロード付き更新関数
  const handleRefresh = () => {
    setIsRefreshing(true);
    showToast('最新画面へ更新中...');

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        // キャッシュを無視して最新のWebページ・データを完全に再読み込み
        window.location.reload();
      }
    }, 400);
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        showToast('期限通知をオンにしました！');
        new Notification('キッチリ - 賞味期限キーパー', {
          body: '期限間近の食材がある際にお知らせします！',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const handleSaveItem = (itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const now = new Date().toISOString();
    let updated: Item[];

    if (itemData.id) {
      updated = items.map((item) =>
        item.id === itemData.id
          ? {
              ...item,
              ...itemData,
              updatedAt: now,
            }
          : item
      );
      showToast(`「${itemData.name}」を更新しました`);
    } else {
      const newItem: Item = {
        ...itemData,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };
      updated = [newItem, ...items];
      showToast(`「${newItem.name}」を冷蔵庫に追加しました`);
    }

    setItems(updated);
    saveItemsToStorage(updated);
    setEditingItem(null);
  };

  const handleBatchSaveItems = (newItems: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const now = new Date().toISOString();
    const createdItems: Item[] = newItems.map((item, idx) => ({
      ...item,
      id: (Date.now() + idx).toString(),
      createdAt: now,
      updatedAt: now,
    }));

    const updated = [...createdItems, ...items];
    setItems(updated);
    saveItemsToStorage(updated);
    showToast(`レシートから ${createdItems.length}件 の食材を一括登録しました！`);
  };

  const handleDeleteItem = (id: string) => {
    const itemToDelete = items.find((i) => i.id === id);
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    saveItemsToStorage(updated);
    setSelectedItemIds((prev) => prev.filter((itemId) => itemId !== id));
    if (itemToDelete) {
      showToast(`「${itemToDelete.name}」を削除しました`);
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectUrgentForRecipe = (ids: string[]) => {
    setSelectedItemIds(ids);
    setActiveTab('recipes');
    showToast('期限間近の食材をレシピ対象にセットしました！');
  };

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-28">
      {/* トースト通知 */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-center gap-3 rounded-2xl bg-slate-900/95 text-white px-5 py-4 text-base font-extrabold shadow-2xl animate-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-md mx-auto px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-2 text-white shadow-md shrink-0">
              <Refrigerator className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                キッチリ
              </h1>
              <p className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                {appVersion}
              </p>
            </div>
          </div>

          {/* 右側アクションアイコン群 */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* レシート撮影一括登録ボタン */}
            <button
              onClick={() => setIsReceiptModalOpen(true)}
              title="レシート一括登録"
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shadow-sm active:scale-90 transition-transform"
            >
              <Camera className="h-4 w-4" />
              <span className="text-xs">レシート</span>
            </button>

            {/* Gemini API Key設定ボタン */}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              title="Gemini AI キー設定"
              className={`p-2 rounded-xl border-2 font-extrabold text-xs active:scale-90 transition-transform ${
                geminiApiKey
                  ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-white text-slate-600 border-slate-300 dark:bg-slate-800'
              }`}
            >
              <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </button>

            {/* 強制最新リロード更新ボタン */}
            <button
              onClick={handleRefresh}
              title="ページ全体を最新更新"
              className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 active:scale-85 transition-all shadow-sm"
            >
              <RotateCw className={`h-4 w-4 transition-transform duration-700 ${isRefreshing ? 'rotate-[360deg] text-emerald-600' : ''}`} />
            </button>

            {/* 家族共有ボタン */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              title="家族共有"
              className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-extrabold text-xs active:scale-90 transition-transform"
            >
              <Users className="h-4 w-4" />
            </button>

            {/* 通知設定ボタン */}
            <button
              onClick={requestNotificationPermission}
              title={notificationsEnabled ? '期限通知: オン' : '期限通知を有効化'}
              className={`p-2 rounded-xl border-2 transition-transform active:scale-90 ${
                notificationsEnabled
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-white text-slate-600 border-slate-300 dark:bg-slate-800'
              }`}
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-md mx-auto px-3.5 pt-4">
        <UrgentAlertBanner items={items} onSelectForRecipe={handleSelectUrgentForRecipe} />

        {activeTab === 'inventory' ? (
          <ItemList
            items={items}
            selectedItemIds={selectedItemIds}
            onToggleSelectItem={handleToggleSelectItem}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsAddModalOpen(true);
            }}
            onDeleteItem={handleDeleteItem}
          />
        ) : (
          <RecipeSuggestions items={items} selectedItemIds={selectedItemIds} />
        )}
      </main>

      {/* ボトムナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t-2 border-slate-200 dark:border-slate-800 pb-safe">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around relative">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all active:scale-90 ${
              activeTab === 'inventory'
                ? 'text-emerald-600 dark:text-emerald-400 font-black'
                : 'text-slate-500 font-bold hover:text-slate-800'
            }`}
          >
            <Refrigerator className="h-6 w-6" />
            <span className="text-xs">中身 ({items.length})</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 -mt-7 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-3.5 rounded-full shadow-xl border-4 border-slate-100 dark:border-slate-950 active:scale-90 transition-all text-base"
          >
            <Plus className="h-6 w-6" />
            <span>追加</span>
          </button>

          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all relative active:scale-90 ${
              activeTab === 'recipes'
                ? 'text-emerald-600 dark:text-emerald-400 font-black'
                : 'text-slate-500 font-bold hover:text-slate-800'
            }`}
          >
            <ChefHat className="h-6 w-6" />
            <span className="text-xs">レシピ提案</span>
            {selectedItemIds.length > 0 && (
              <span className="absolute -top-1 right-2 bg-emerald-600 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                {selectedItemIds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        onBatchSave={handleBatchSaveItems}
        initialItem={editingItem}
      />

      <ReceiptScanModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onBatchSave={handleBatchSaveItems}
      />

      <GeminiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSaveKey={handleSaveGeminiKey}
        currentKey={geminiApiKey}
      />

      <FamilyShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
