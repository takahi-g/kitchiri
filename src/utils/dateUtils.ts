import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import { ExpirationStatus } from '@/types/item';

/**
 * 賞味期限までの残り日数を計算
 */
export function getDaysUntilExpiration(expirationDateStr: string): number {
  try {
    const expDate = parseISO(expirationDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    return differenceInCalendarDays(expDate, today);
  } catch {
    return 999;
  }
}

/**
 * 期限ステータスを取得
 */
export function getExpirationStatus(expirationDateStr: string): ExpirationStatus {
  const days = getDaysUntilExpiration(expirationDateStr);
  if (days < 0) return 'EXPIRED';
  if (days === 0) return 'URGENT';
  if (days <= 3) return 'WARNING';
  return 'SAFE';
}

/**
 * 大きい文字サイズ・見やすいデザイン用のスタイル
 */
export function getStatusBadgeStyle(status: ExpirationStatus): {
  label: string;
  badgeBg: string;
  badgeText: string;
  cardBorder: string;
  indicatorBg: string;
} {
  switch (status) {
    case 'EXPIRED':
      return {
        label: '🚨 期限切れ！',
        badgeBg: 'bg-red-100 dark:bg-red-950',
        badgeText: 'text-red-700 dark:text-red-300 font-extrabold text-sm px-3 py-1',
        cardBorder: 'border-2 border-red-500 shadow-md dark:border-red-600',
        indicatorBg: 'bg-red-600',
      };
    case 'URGENT':
      return {
        label: '⚠️ 今日まで！',
        badgeBg: 'bg-red-100 dark:bg-red-950',
        badgeText: 'text-red-700 dark:text-red-300 font-extrabold text-sm px-3 py-1',
        cardBorder: 'border-2 border-red-400 shadow-md dark:border-red-700',
        indicatorBg: 'bg-red-500',
      };
    case 'WARNING':
      return {
        label: '⏳ あと3日以内',
        badgeBg: 'bg-amber-100 dark:bg-amber-950',
        badgeText: 'text-amber-900 dark:text-amber-200 font-extrabold text-sm px-3 py-1',
        cardBorder: 'border-2 border-amber-400 dark:border-amber-700',
        indicatorBg: 'bg-amber-500',
      };
    case 'SAFE':
    default:
      return {
        label: '🟢 余裕あり',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-950',
        badgeText: 'text-emerald-800 dark:text-emerald-200 font-bold text-sm px-3 py-1',
        cardBorder: 'border border-slate-300 dark:border-slate-700',
        indicatorBg: 'bg-emerald-500',
      };
  }
}

export function formatDateJapanese(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, 'yyyy年MM月dd日');
  } catch {
    return dateStr;
  }
}
