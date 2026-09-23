import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Category } from '@/types/item';

const envApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userApiKey = (formData.get('userApiKey') as string) || '';

    if (!file) {
      return NextResponse.json({ error: '画像ファイルが見つかりません' }, { status: 400 });
    }

    const activeApiKey = userApiKey.trim() || envApiKey.trim();

    if (!activeApiKey) {
      return NextResponse.json({
        success: false,
        error: 'NO_API_KEY',
        message: 'Gemini APIキーが設定されていません。右上の「🔑」からAPIキーを保存してください。',
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const todayStr = new Date().toISOString().split('T')[0];

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

    // 1. まず標準の REST API エンドポイント直接呼び出し (v1beta および v1) でモデル確認と自動フォールバックを行う
    const apiEndpoints = [
      { ver: 'v1beta', model: 'gemini-3.6-flash' },
      { ver: 'v1beta', model: 'gemini-3.1-pro-preview' },
      { ver: 'v1beta', model: 'gemini-1.5-flash-latest' },
      { ver: 'v1', model: 'gemini-1.5-flash-latest' }
    ];

    let lastErrorMsg = '';

    const processItemsJson = (parsed: any) => {
      let rawItems: any[] = [];
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        rawItems = parsed.items;
      } else if (parsed.detectedName) {
        rawItems = [parsed];
      } else {
        rawItems = [{ detectedName: '判定した食品', category: '加工食品', expirationDate: todayStr }];
      }

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

      return {
        success: true,
        items: formattedItems,
        // 下位互換性のため先頭1件のプロパティも保持
        detectedName: formattedItems[0].detectedName,
        category: formattedItems[0].category,
        expirationDate: formattedItems[0].expirationDate,
        purchaseDate: formattedItems[0].purchaseDate,
      };
    };

    for (const ep of apiEndpoints) {
      try {
        const url = `https://generativelanguage.googleapis.com/${ep.ver}/models/${ep.model}:generateContent?key=${activeApiKey}`;
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
            return NextResponse.json(processItemsJson(parsed));
          }
        } else {
          const errJson = await res.json().catch(() => ({}));
          lastErrorMsg = errJson?.error?.message || `HTTP ${res.status}`;
          console.warn(`Direct fetch to ${ep.model} (${ep.ver}) failed:`, lastErrorMsg);
        }
      } catch (e: any) {
        console.warn(`Fetch error for ${ep.model}:`, e?.message || e);
        lastErrorMsg = e?.message || '通信エラー';
      }
    }

    // 2. SDKリトライ
    const genAI = new GoogleGenerativeAI(activeApiKey);
    for (const modelName of ['gemini-3.6-flash', 'gemini-1.5-flash-latest']) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          prompt,
          { inlineData: { data: base64Image, mimeType } },
        ]);
        const rawText = result.response.text();
        if (rawText) {
          const cleanJsonStr = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJsonStr);
          return NextResponse.json(processItemsJson(parsed));
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || 'SDKエラー';
      }
    }

    return NextResponse.json({
      success: false,
      error: 'GEMINI_ERROR',
      message: `Gemini APIエラー: ${lastErrorMsg}`,
    }, { status: 500 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'サーバー処理エラーが発生しました',
    }, { status: 500 });
  }
}
