export type Category = '肉類' | '野菜' | '魚介類' | '乳製品' | '調味料' | '加工食品' | '飲料' | 'その他';

export type ExpirationStatus = 'EXPIRED' | 'URGENT' | 'WARNING' | 'SAFE';

export interface Item {
  id: string;
  name: string;
  category: Category;
  purchaseDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  quantity?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cookingTimeMinutes: number;
  difficulty: '簡単' | '普通' | 'こだわり';
  mainIngredients: string[]; // マッチング用キーワード (例: ["豚肉", "キャベツ"])
  allIngredients: string[];
  instructions: string[];
  imageUrl?: string;
}
