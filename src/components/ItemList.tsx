'use client';

import { useState } from 'react';
import { Item, Category } from '@/types/item';
import { getDaysUntilExpiration, getExpirationStatus, getStatusBadgeStyle, formatDateJapanese } from '@/utils/dateUtils';
import { Search, Filter, Edit2, Trash2, CheckCircle2, Circle, CalendarDays } from 'lucide-react';

interface ItemListProps {
  items: Item[];
  selectedItemIds: string[];
  onToggleSelectItem: (id: string) => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
}

const CATEGORIES: (Category | 'すべて')[] = ['すべて', '肉類', '野菜', '魚介類', '乳製品', '調味料', '加工食品', '飲料', 'その他'];

export default function ItemList({
  items,
  selectedItemIds,
  onToggleSelectItem,
  onEditItem,
  onDeleteItem,
}: ItemListProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'すべて'>('すべて');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'expiration' | 'category' | 'name'>('expiration');

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'すべて' || item.category === selectedCategory;
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.memo && item.memo.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'expiration') {
      return getDaysUntilExpiration(a.expirationDate) - getDaysUntilExpiration(b.expirationDate);
    }
    if (sortBy === 'category') {
      return a.category.localeCompare(b.category, 'ja');
    }
    return a.name.localeCompare(b.name, 'ja');
  });

  return (
    <div className="space-y-5">
      {/* 検索・ソートコントロール */}
      <div className="flex flex-col gap-3">
        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-6 w-6 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="食材名やメモで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border-2 border-slate-300 pl-14 pr-4 py-3 text-base font-bold bg-white dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* ソート */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-black text-slate-700 dark:text-slate-300 whitespace-nowrap">並び替え:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border-2 border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-4 py-2 text-sm font-black focus:outline-none focus:border-emerald-500"
          >
            <option value="expiration">賞味期限が近い順</option>
            <option value="category">カテゴリ順</option>
            <option value="name">名前順</option>
          </select>
        </div>
      </div>

      {/* カテゴリタブ */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-xl px-4 py-2.5 text-sm font-black whitespace-nowrap transition-all border ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 食材カードリスト */}
      {sortedItems.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-10 text-center bg-white/50 dark:bg-slate-900/50">
          <Filter className="mx-auto h-10 w-10 text-slate-400 mb-3" />
          <p className="text-lg font-black text-slate-700 dark:text-slate-300">該当する食材がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedItems.map((item) => {
            const status = getExpirationStatus(item.expirationDate);
            const style = getStatusBadgeStyle(status);
            const isSelected = selectedItemIds.includes(item.id);
            const daysLeft = getDaysUntilExpiration(item.expirationDate);

            return (
              <div
                key={item.id}
                className={`relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-800 p-5 border-2 shadow-md transition-all ${style.cardBorder}`}
              >
                <div>
                  {/* カード上部: チェックボックス & カテゴリ & ステータスバッジ */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <button
                      onClick={() => onToggleSelectItem(item.id)}
                      className="flex items-center gap-2.5 group text-left"
                    >
                      {isSelected ? (
                        <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="h-7 w-7 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 shrink-0 transition-colors" />
                      )}
                      <span className="text-sm font-black px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {item.category}
                      </span>
                    </button>

                    <span className={`rounded-xl text-base font-black ${style.badgeBg} ${style.badgeText}`}>
                      {style.label}
                    </span>
                  </div>

                  {/* 食材名（超デカ文字） */}
                  <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 my-2 tracking-tight">
                    {item.name}
                  </h4>

                  {/* 数量・メモ */}
                  {(item.quantity || item.memo) && (
                    <div className="text-base text-slate-700 dark:text-slate-300 space-y-1 my-2 bg-slate-100 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold">
                      {item.quantity && (
                        <p>
                          数量: <span className="text-emerald-700 dark:text-emerald-400 font-black">{item.quantity}</span>
                        </p>
                      )}
                      {item.memo && <p className="italic font-bold text-slate-600 dark:text-slate-400">メモ: "{item.memo}"</p>}
                    </div>
                  )}
                </div>

                {/* 賞味期限の日付（超・特大文字デザイン！） */}
                <div className="mt-4 pt-3 border-t-2 border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-black text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>賞味期限:</span>
                  </div>
                  
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    {/* YYYY年MM月DD日 (超特大フォント text-xl 〜 text-2xl) */}
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {formatDateJapanese(item.expirationDate)}
                    </div>

                    {/* 残り日数ハイライトタグ */}
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black px-3 py-1 rounded-xl shadow-sm ${
                        daysLeft < 0
                          ? 'bg-red-600 text-white'
                          : daysLeft === 0
                          ? 'bg-red-600 text-white'
                          : daysLeft <= 3
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}日過ぎてる！` : daysLeft === 0 ? '本日まで！' : `あと ${daysLeft} 日`}
                      </span>

                      {/* 編集・削除ボタン */}
                      <button
                        onClick={() => onEditItem(item)}
                        title="編集"
                        className="p-2 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Edit2 className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        title="削除"
                        className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Trash2 className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
