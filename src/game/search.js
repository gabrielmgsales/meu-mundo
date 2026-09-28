export const normalizeSearch = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
export function searchCatalog(items, query) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const kinds = {
    tree: 'árvore árvores plantar',
    animal: 'animal animais',
    furniture: 'móvel móveis mobília decoração',
    family: 'família familiar'
  };
  return items.filter(item => {
    const text = normalizeSearch([item.label, item.category, item.keywords, kinds[item.kind]].filter(Boolean).join(' '));
    return words.every(word => text.includes(word));
  });
}
