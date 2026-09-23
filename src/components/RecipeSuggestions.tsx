'use client';

import { useState } from 'react';
import { Item, Recipe } from '@/types/item';
import { MOCK_RECIPES } from '@/data/mockRecipes';
import { ChefHat, Clock, Sparkles, CheckCircle2, ChevronRight, X, BookOpen } from 'lucide-react';

interface RecipeSuggestionsProps {
  items: Item[];
  selectedItemIds: string[];
}

export default function RecipeSuggestions({ items, selectedItemIds }: RecipeSuggestionsProps) {
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [excludedItemIds, setExcludedItemIds] = useState<string[]>([]);

  // 選択中の食材（非選択時は全食材）、かつ除外設定されていないものを対象にする
  const baseItems = selectedItemIds.length > 0
    ? items.filter((item) => selectedItemIds.includes(item.id))
    : items;

  const targetItems = baseItems.filter((item) => !excludedItemIds.includes(item.id));

  const toggleExcludeItem = (id: string) => {
    setExcludedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 完全マッチ判定：手元の対象食材とマッチするレシピのみを抽出（一致数0件のものは除外！）
  const recipeMatches = MOCK_RECIPES.map((recipe) => {
    const matchedIngredients = targetItems.filter((item) =>
      recipe.mainIngredients.some((ing) =>
        item.name.toLowerCase().includes(ing.toLowerCase()) || ing.toLowerCase().includes(item.name.toLowerCase())
      ) ||
      recipe.allIngredients.some((ing) =>
        item.name.toLowerCase().includes(ing.toLowerCase()) || ing.toLowerCase().includes(item.name.toLowerCase())
      )
    );

    return {
      recipe,
      matchedItems: matchedIngredients,
      score: matchedIngredients.length,
    };
  })
  .filter((m) => m.score > 0) // 🔥 食材が1つも含まれないレシピは完全排除！
  .sort((a, b) => b.score - a.score);

  // 手持ち食材から動的に作る即席カスタムレシピを生成（手元にある食材だけで作れるレシピ）
  const customRecipes = targetItems.length > 0 ? [
    {
      recipe: {
        id: 'custom-1',
        title: `${targetItems.map((i) => i.name).join('と')}のさっと和え・炒め`,
        description: `手元にある【${targetItems.map((i) => i.name).join('・')}】だけを使ってパパッと作る即席アレンジおかず！`,
        cookingTimeMinutes: 5,
        difficulty: '簡単' as const,
        mainIngredients: targetItems.map((i) => i.name),
        allIngredients: [
          ...targetItems.map((i) => `${i.name} 適量`),
          'ごま油（またはオリーブオイル） 大さじ1',
          '醤油（または塩コショウ） 少々'
        ],
        instructions: [
          `${targetItems.map((i) => i.name).join('と')}を食べやすい大きさに切り揃えます。`,
          'フライパンに油を熱し、火の通りにくい食材から順に中火でサッと炒めます（サラダ・乳製品の場合はボウルで和えます）。',
          '醤油や塩コショウでシンプルに味を調えて完成です！'
        ]
      },
      matchedItems: targetItems,
      score: targetItems.length
    }
  ] : [];

  const displayRecipes = recipeMatches.length > 0 ? recipeMatches : customRecipes;

  return (
    <div className="space-y-6">
      {/* 提案ヘッダー */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-xl">
        <div className="flex items-center gap-4 mb-3">
          <div className="rounded-2xl bg-white/20 p-3.5 backdrop-blur-md">
            <ChefHat className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black">使い切りレシピ提案</h2>
            <p className="text-sm font-semibold text-emerald-100 mt-1">
              {selectedItemIds.length > 0
                ? `選択中(${targetItems.length}件)の食材を活用できる簡単レシピ`
                : '冷蔵庫の食材を活用して作れる簡単レシピ'}
            </p>
          </div>
        </div>

        {/* 対象の食材と除外切り替えタグ */}
        <div className="mt-4 border-t-2 border-white/20 pt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-black text-emerald-100">
              対象食材（タップで「作るレシピ」から除外できます）:
            </span>
            {excludedItemIds.length > 0 && (
              <button
                onClick={() => setExcludedItemIds([])}
                className="text-xs font-black underline text-amber-200 hover:text-white"
              >
                除外を全解除
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {baseItems.length === 0 ? (
              <span className="text-sm text-emerald-200">食材がありません</span>
            ) : (
              baseItems.map((item) => {
                const isExcluded = excludedItemIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleExcludeItem(item.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-extrabold transition-all shadow-sm active:scale-95 ${
                      isExcluded
                        ? 'bg-slate-800/80 text-slate-300 line-through opacity-70 border border-slate-500'
                        : 'bg-white/90 text-emerald-950 hover:bg-white'
                    }`}
                  >
                    <span>{item.name}</span>
                    {isExcluded ? (
                      <span className="text-xs bg-slate-600 text-white px-1.5 py-0.5 rounded-md font-bold">除外中</span>
                    ) : (
                      <X className="h-4 w-4 text-slate-400 hover:text-red-600" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* レシピ一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayRecipes.map(({ recipe, matchedItems, score }) => (
          <div
            key={recipe.id}
            className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-800 p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-300">
                  <Clock className="h-4 w-4" />
                  調理時間: {recipe.cookingTimeMinutes}分
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 dark:bg-slate-700 dark:text-slate-200 px-3 py-1 rounded-xl">
                  難易度: {recipe.difficulty}
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors leading-snug">
                {recipe.title}
              </h3>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {recipe.description}
              </p>

              {/* マッチした食材のハイライト */}
              {score > 0 && (
                <div className="mt-4 rounded-xl bg-amber-100 dark:bg-amber-950/60 p-3 border border-amber-300 dark:border-amber-700">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-200">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span>冷蔵庫から使える食材:</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {matchedItems.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1 text-xs sm:text-sm font-extrabold text-emerald-900 dark:text-emerald-100 bg-emerald-200 dark:bg-emerald-900 px-2.5 py-1 rounded-lg"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t-2 border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setActiveRecipe(recipe)}
                className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2 rounded-xl border border-emerald-300 transition-all active:scale-95"
              >
                <BookOpen className="h-5 w-5" />
                作り方手順を見る
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* レシピ詳細モーダル */}
      {activeRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700">
            <div className="flex items-start justify-between border-b-2 border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg mb-2">
                  <Clock className="h-4 w-4" /> {activeRecipe.cookingTimeMinutes}分 / {activeRecipe.difficulty}
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{activeRecipe.title}</h2>
              </div>
              <button
                onClick={() => setActiveRecipe(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-5 space-y-6">
              {/* 材料 */}
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                    材料 (目安)
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    🟢: 冷蔵庫にある / ⚠️: 不足している食材
                  </span>
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm sm:text-base font-bold bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {activeRecipe.allIngredients.map((ing, idx) => {
                    const hasItem = targetItems.some((item) =>
                      item.name.toLowerCase().includes(ing.split(' ')[0].toLowerCase()) ||
                      ing.toLowerCase().includes(item.name.toLowerCase())
                    );
                    return (
                      <li
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-xl border ${
                          hasItem
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200'
                            : 'bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200'
                        }`}
                      >
                        <span className="flex items-center gap-2 font-black">
                          {hasItem ? (
                            <span className="text-emerald-600 font-black">🟢</span>
                          ) : (
                            <span className="text-amber-600 font-black">⚠️</span>
                          )}
                          {ing}
                        </span>
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
                          hasItem
                            ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                            : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
                        }`}>
                          {hasItem ? '冷蔵庫あり' : '買足し要'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* 作り方手順 */}
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base mb-3 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                  作り方手順
                </h3>
                <ol className="space-y-4">
                  {activeRecipe.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3.5 text-sm sm:text-base text-slate-800 dark:text-slate-200 font-semibold bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-black text-white text-sm">
                        {idx + 1}
                      </span>
                      <p className="pt-0.5 leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t-2 border-slate-100 pt-4 dark:border-slate-800">
              <button
                onClick={() => setActiveRecipe(null)}
                className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800 transition-all"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
