'use client';

import { Item } from '@/types/item';
import { getDaysUntilExpiration, getExpirationStatus, formatDateJapanese } from '@/utils/dateUtils';
import { AlertTriangle, Clock, ChefHat, Sparkles } from 'lucide-react';

interface UrgentAlertBannerProps {
  items: Item[];
  onSelectForRecipe: (itemIds: string[]) => void;
}

export default function UrgentAlertBanner({ items, onSelectForRecipe }: UrgentAlertBannerProps) {
  const urgentItems = items
    .filter((item) => {
      const status = getExpirationStatus(item.expirationDate);
      return status === 'EXPIRED' || status === 'URGENT' || status === 'WARNING';
    })
    .sort((a, b) => getDaysUntilExpiration(a.expirationDate) - getDaysUntilExpiration(b.expirationDate));

  if (urgentItems.length === 0) {
    return (
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-100 to-teal-100 p-5 border-2 border-emerald-300 dark:from-emerald-950/60 dark:to-teal-950/60 dark:border-emerald-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-600 p-3 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-black text-emerald-950 dark:text-emerald-100 text-lg">
              冷蔵庫はスッキリ！安全です
            </h3>
            <p className="text-base font-bold text-emerald-800 dark:text-emerald-300">
              3日以内に期限を迎える食材はありません。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl bg-amber-100 dark:bg-amber-950/80 p-5 border-2 border-amber-400 dark:border-amber-600 shadow-md">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 animate-bounce" />
          <h3 className="font-black text-amber-950 dark:text-amber-100 text-xl">
            【要チェック】期限間近の食材 ({urgentItems.length}件)
          </h3>
        </div>
        <button
          onClick={() => onSelectForRecipe(urgentItems.map((i) => i.id))}
          className="flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-base font-black text-white shadow-md hover:bg-amber-500 transition-all active:scale-95"
        >
          <ChefHat className="h-6 w-6" />
          これらで作れるレシピを見る
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {urgentItems.map((item) => {
          const days = getDaysUntilExpiration(item.expirationDate);
          const isExpired = days < 0;
          const isToday = days === 0;

          return (
            <div
              key={item.id}
              className={`min-w-[240px] flex-1 rounded-2xl p-4 bg-white dark:bg-slate-800 border-2 shadow transition-transform ${
                isExpired || isToday
                  ? 'border-red-500 bg-red-50/60 dark:bg-red-950/50'
                  : 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-sm font-black px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  {item.category}
                </span>
                <span
                  className={`text-sm font-black px-3 py-1 rounded-lg ${
                    isExpired
                      ? 'bg-red-600 text-white'
                      : isToday
                      ? 'bg-red-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {isExpired ? '期限切れ！' : isToday ? '今日まで！' : `あと ${days} 日`}
                </span>
              </div>
              
              <div className="font-black text-slate-900 dark:text-slate-100 truncate text-xl my-1">
                {item.name}
              </div>

              {/* 超デカ文字の賞味期限表示 */}
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>賞味期限:</span>
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {formatDateJapanese(item.expirationDate)}
                </div>
                {item.quantity && (
                  <div className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-1">
                    数量: {item.quantity}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
