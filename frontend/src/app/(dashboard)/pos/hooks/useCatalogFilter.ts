import { useMemo } from 'react';
import { Product } from '../types';

const SYNONYMS: Record<string, string[]> = {
  refresco: ['coca', 'fanta', 'sprite', 'sidral', 'soda', 'pepsi', 'mundet', 'boing', 'cocacola'],
  soda: ['coca', 'fanta', 'sprite', 'sidral', 'soda', 'pepsi', 'mundet', 'boing', 'cocacola'],
  leche: ['alpura', 'lala', 'leche', 'santa clara'],
  sabritas: ['papas', 'chips', 'rufles', 'doritos', 'cheetos', 'fritos', 'papas fritas'],
  chips: ['chip', 'chips', 'sabritas', 'papas'],
  chip: ['chip', 'chips', 'sabritas', 'papas'],
  coca: ['cocacola', 'coca-cola', 'coca cola', 'refresco'],
  pan: ['bimbo', 'tía rosa', 'concha', 'dona', 'bolillo'],
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function useCatalogFilter(
  catalogProducts: Product[],
  searchQuery: string,
  activeCategory: string
) {
  const filteredCatalog = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) {
      if (activeCategory === 'TODOS') {
        return catalogProducts;
      }
      return catalogProducts.filter(p => p.category === activeCategory);
    }

    const normalizedQuery = normalizeText(rawQuery);
    const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

    // 1. Filtrar por categoría activa elegida en la pestaña (o TODOS)
    const categoryFiltered = catalogProducts.filter(p =>
      activeCategory === 'TODOS' || p.category === activeCategory
    );

    // 2. Evaluar y clasificar cada producto
    const scoredProducts: Array<{ product: Product; score: number }> = [];

    for (const p of categoryFiltered) {
      const normName = normalizeText(p.name);
      const normBarcode = p.barcode ? p.barcode.toLowerCase() : '';

      // Coincidencia exacta o parcial de código de barras
      if (normBarcode && normBarcode === normalizedQuery) {
        scoredProducts.push({ product: p, score: 10000 });
        continue;
      }
      if (normBarcode && normBarcode.includes(normalizedQuery)) {
        scoredProducts.push({ product: p, score: 8000 });
        continue;
      }

      // Coincidencia exacta de nombre completo
      if (normName === normalizedQuery) {
        scoredProducts.push({ product: p, score: 5000 });
        continue;
      }
      if (normName.startsWith(normalizedQuery)) {
        scoredProducts.push({ product: p, score: 4000 });
        continue;
      }
      if (normName.includes(normalizedQuery)) {
        scoredProducts.push({ product: p, score: 3000 });
        continue;
      }

      // Coincidencia de todas las palabras buscadas directamente
      const allWordsDirectMatch = queryWords.every(word => normName.includes(word));
      if (allWordsDirectMatch) {
        const nameWords = normName.split(/\s+/);
        const startsWithAllWords = queryWords.every(qWord =>
          nameWords.some(nWord => nWord.startsWith(qWord))
        );
        const score = startsWithAllWords ? 2000 : 1500;
        scoredProducts.push({ product: p, score });
        continue;
      }

      // Coincidencia por sinónimos
      const allWordsMatchWithSynonyms = queryWords.every(word => {
        if (normName.includes(word)) return true;
        const synonyms = word.length > 2 ? (SYNONYMS[word] || []) : [];
        return synonyms.some(syn => normName.includes(normalizeText(syn)));
      });

      if (allWordsMatchWithSynonyms) {
        scoredProducts.push({ product: p, score: 500 });
      }
    }

    // 3. Ordenar resultados por relevancia
    scoredProducts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.product.name.localeCompare(b.product.name);
    });

    return scoredProducts.map(sp => sp.product);
  }, [catalogProducts, searchQuery, activeCategory]);

  return { filteredCatalog };
}
