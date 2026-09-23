import { Item, Category } from '@/types/item';

const STORAGE_KEY = 'kitchiri_items_v1';

// 今日の日付をベースにした初期サンプルデータ（動作確認用）
const getInitialItems = (): Item[] => {
  const today = new Date();
  
  const formatDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: '1',
      name: '牛乳',
      category: '乳製品',
      purchaseDate: formatDate(-4),
      expirationDate: formatDate(0), // 今日まで
      quantity: '1本 (残1/2)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: '豚バラ薄切り肉',
      category: '肉類',
      purchaseDate: formatDate(-2),
      expirationDate: formatDate(1), // あと1日
      quantity: '200g',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'キャベツ',
      category: '野菜',
      purchaseDate: formatDate(-5),
      expirationDate: formatDate(2), // あと2日
      quantity: '1/2玉',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '4',
      name: '豆腐',
      category: '加工食品',
      purchaseDate: formatDate(-3),
      expirationDate: formatDate(-1), // 期限切れ (1日前)
      quantity: '1丁',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '5',
      name: '卵 (10個パック)',
      category: '加工食品',
      purchaseDate: formatDate(-1),
      expirationDate: formatDate(7), // 余裕あり
      quantity: '8個',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '6',
      name: 'マヨネーズ',
      category: '調味料',
      purchaseDate: formatDate(-20),
      expirationDate: formatDate(30), // 余裕あり
      quantity: '1本',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
};

export const getStoredItems = (): Item[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = getInitialItems();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveItemsToStorage = (items: Item[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};
