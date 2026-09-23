import { createWorker } from 'tesseract.js';
import { Category } from '@/types/item';

export interface ProductPhotoResult {
  detectedName: string;
  category: Category;
  expirationDate: string;
  rawText: string;
}

// 汎用カテゴリ判定マップ
const DYNAMIC_CATEGORY_RULES: { keywords: string[]; category: Category; defaultDays: number }[] = [
  { keywords: ['肉', '豚', '牛', '鶏', 'もも', 'むね', 'バラ', 'ロース', 'ウインナー', 'ハム', 'ステーキ', 'ハンバーグ'], category: '肉類', defaultDays: 3 },
  { keywords: ['キャベツ', 'レタス', 'トマト', '玉ねぎ', 'ニンジン', 'じゃがいも', 'きゅうり', 'ねぎ', 'ブロッコリー', 'もやし', '野菜', '大根', '茄子', 'ほうれん草'], category: '野菜', defaultDays: 7 },
  { keywords: ['魚', 'サケ', '鮭', 'マグロ', 'エビ', '刺身', 'サンマ', 'アジ', 'サバ', 'ツナ'], category: '魚介類', defaultDays: 2 },
  { keywords: ['牛乳', 'ミルク', 'チーズ', 'ヨーグルト', 'バター', '生クリーム'], category: '乳製品', defaultDays: 5 },
  { keywords: ['豆腐', 'とうふ', '納豆', '卵', 'たまご', '油揚げ', 'ちくわ', 'パン', 'クロワッサン', 'うどん', 'ラーメン', '惣菜'], category: '加工食品', defaultDays: 5 },
  { keywords: ['マヨネーズ', 'ケチャップ', '醤油', 'タレ', 'ポン酢', 'みそ', 'ドレッシング', 'ソース', '塩', '砂糖'], category: '調味料', defaultDays: 60 },
  { keywords: ['茶', 'ジュース', '水', 'コーラ', 'コーヒー', 'ソーダ', '飲料'], category: '飲料', defaultDays: 30 },
];

function determineCategoryAndDays(text: string): { category: Category; days: number } {
  for (const rule of DYNAMIC_CATEGORY_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return { category: rule.category, days: rule.defaultDays };
    }
  }
  return { category: 'その他', days: 5 };
}

/**
 * 撮影したどんな商品写真からでも、実際の文字と日付印字をリアルタイムで動的検出する汎用OCR解析エンジン
 */
export async function analyzeProductPhoto(file: File): Promise<ProductPhotoResult> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const worker = await createWorker('jpn+eng');
    const { data } = await worker.recognize(imageUrl);
    await worker.terminate();

    const rawText = data.text || '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minValidYear = today.getFullYear();
    const maxValidYear = minValidYear + 2;

    // 1. 写真から賞味期限印字 (例: 26.09.15, 2026/09/20, 26-09-12) を動的に検出
    let detectedExpDateStr = '';
    const dateMatches = rawText.matchAll(/(?:20)?(2[4-9]|[3-9]\d)[./\-年\s]+(0?[1-9]|1[0-2])[./\-月\s]+(0?[1-9]|[12]\d|3[01])/g);

    for (const match of dateMatches) {
      let year = parseInt(match[1], 10);
      if (year < 100) year += 2000;
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);

      if (year >= minValidYear && year <= maxValidYear) {
        const parsedDate = new Date(year, month - 1, day);
        if (parsedDate >= today) {
          const monthStr = String(month).padStart(2, '0');
          const dayStr = String(day).padStart(2, '0');
          detectedExpDateStr = `${year}-${monthStr}-${dayStr}`;
          break;
        }
      }
    }

    // 2. 写真の全テキスト行からノイズを除去し、写っている実際の日本語商品名を動的抽出
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => {
        const hasEnglishGarbage = /[a-zA-Z]{3,}/.test(l);
        const hasKanjiKana = /[ぁ-んァ-ヶ亜-黒]/.test(l);
        return hasKanjiKana && !hasEnglishGarbage && !l.includes('期限') && !l.includes('製造') && !l.includes('賞味') && !l.includes('保存');
      });

    let detectedName = '';
    if (lines.length > 0) {
      // 記号を取り除いて一番目立つ日本語行を採用
      detectedName = lines[0].replace(/[^ぁ-んァ-ヶ亜-黑0-9\s]/g, '').trim();
    }

    if (!detectedName || detectedName.length < 2) {
      detectedName = '撮影した食材';
    }

    const { category, days } = determineCategoryAndDays(detectedName + ' ' + rawText);

    // 写真から日付が読み取れなかった場合は、本日+推定日数で動的生成
    if (!detectedExpDateStr) {
      const expDate = new Date();
      expDate.setDate(today.getDate() + days);
      detectedExpDateStr = expDate.toISOString().split('T')[0];
    }

    return {
      detectedName,
      category,
      expirationDate: detectedExpDateStr,
      rawText,
    };
  } catch (error) {
    console.error('Photo OCR error:', error);

    const today = new Date();
    const defaultExpDate = new Date();
    defaultExpDate.setDate(today.getDate() + 5);

    return {
      detectedName: '撮影した食材',
      category: 'その他',
      expirationDate: defaultExpDate.toISOString().split('T')[0],
      rawText: '',
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export async function processReceiptImage(file: File): Promise<any> {
  const result = await analyzeProductPhoto(file);
  const todayStr = new Date().toISOString().split('T')[0];

  return {
    detectedName: result.detectedName,
    category: result.category,
    purchaseDate: todayStr,
    expirationDate: result.expirationDate,
    memo: '写真OCR解析完了',
    rawText: result.rawText,
  };
}
