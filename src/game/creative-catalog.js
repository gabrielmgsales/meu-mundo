import { animals, trees, furniture, allItems, biomes, familyCatalog } from './catalogs.js';
import { searchCatalog } from './search.js';
const $ = id => document.getElementById(id);
export function createCreativeCatalog({
  data,
  buildOptions,
  onBuild,
  visitOverlook,
  navigation,
  select,
  cancel,
  biome,
  save,
  spawnFamily,
  cancelFamily,
  current
}) {
  let currentTab = 'animal';
  const dock = document.createElement('aside');
  dock.id = 'creative-dock';
  dock.innerHTML = `<div class="dock-heading"><small>FAÇA DO SEU JEITO</small><button id="dock-fold" aria-label="Recolher catálogo" aria-expanded="true">−</button></div><nav class="catalog-tabs" aria-label="Catálogos"><button data-tab="animal">Animais</button><button data-tab="tree">Árvores</button><button data-tab="furniture">Mobília</button><button data-tab="nature">Bioma</button><button data-tab="tools">Explorar</button><button data-tab="family">Família</button></nav><div id="catalog-body"><label class="sr-only" for="catalog-search">Buscar no catálogo</label><input id="catalog-search" type="search" placeholder="Pesquisar tudo: barco, árvore, família…"><label class="sr-only" for="catalog-category">Categoria</label><select id="catalog-category"></select><div id="catalog-items"></div></div><p id="creative-help">Selecione um item e clique no mundo.</p><div class="dock-actions"><button id="camera-mode">Primeira pessoa · V</button><button id="save-world">Salvar</button><button id="home-menu">Mundos</button></div>`;
  document.body.append(dock);
  const rail = document.createElement('aside');
  rail.id = 'left-rail';
  rail.setAttribute('aria-label', 'Ferramentas do mundo');
  document.body.append(rail);
  rail.append(dock);
  for (const [selector, label] of [['footer', 'Construções'], ['.resources', 'Mochila'], ['.quest', 'Minha jornada'], ['#map-panel', 'Mapa do vale']]) {
    const details = document.createElement('details'),
      summary = document.createElement('summary');
    summary.textContent = label;
    details.append(summary, document.querySelector(selector));
    rail.append(details);
    if (selector === '#map-panel') $('map-toggle').onclick = () => {
      details.open = !details.open;
    };
  }
  const tools = [furniture.find(i => i.id === 'tocha'), furniture.find(i => i.id === 'fogueira')];
  const actions = [{
    label: 'Colocar barco',
    category: 'Explorar',
    keywords: 'lago navegar',
    run: () => select({
      id: 'boat',
      kind: 'tool',
      label: 'Barco'
    })
  }, {
    label: 'Trazer barco ao deck',
    category: 'Explorar',
    run: () => {
      cancel();
      navigation.recall();
    }
  }, {
    label: 'Visitar lago',
    category: 'Explorar',
    run: () => navigation.visit()
  }, {
    label: 'Visitar mirante',
    category: 'Explorar',
    keywords: 'oeste vale ladeira deck paisagem',
    run: () => {
      cancel();
      visitOverlook();
    }
  }, {
    label: 'Ver pôr do sol no mirante',
    category: 'Explorar',
    keywords: 'oeste entardecer',
    run: () => {
      cancel();
      visitOverlook(18);
    }
  }, {
    label: 'Ver céu noturno no mirante',
    category: 'Explorar',
    keywords: 'lua estrela cadente noite',
    run: () => {
      cancel();
      visitOverlook(21);
    }
  }, {
    label: 'Pintar água',
    category: 'Bioma',
    keywords: 'poca lago agua',
    run: () => select({
      id: 'lake',
      kind: 'tool',
      label: 'Poças e lagos'
    })
  }, {
    label: 'Retirar água',
    category: 'Bioma',
    run: () => select({
      id: 'dry',
      kind: 'tool',
      label: 'Retirar água'
    })
  }];
  function renderCatalog(reset = false) {
    const {
      selected,
      familyAdding
    } = current();
    document.querySelectorAll('[data-tab]').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === currentTab);
      b.setAttribute('aria-pressed', String(b.dataset.tab === currentTab));
    });
    const list = $('catalog-items'),
      category = $('catalog-category'),
      search = $('catalog-search');
    list.replaceChildren();
    const source = currentTab === 'animal' ? animals : currentTab === 'tree' ? trees : currentTab === 'furniture' ? furniture : currentTab === 'family' ? familyCatalog : [];
    if (reset) {
      search.value = '';
      category.replaceChildren();
      for (const name of ['Todas', ...new Set(source.map(i => i.category))]) {
        const o = document.createElement('option');
        o.value = name;
        o.textContent = name;
        category.append(o);
      }
    }
    search.hidden = false;
    category.hidden = !!search.value.trim() || ['nature', 'tools', 'family', 'tree'].includes(currentTab);
    const button = (label, fn, active = false) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.classList.toggle('active', active);
      b.onclick = fn;
      list.append(b);
      return b;
    };
    const query = search.value.trim();
    if (query) {
      const options = [...allItems.map(i => ({
        ...i,
        run: () => select(i)
      })), ...actions, ...biomes.map(b => ({
        ...b,
        category: 'Bioma',
        run: () => {
          biome(b.id);
          save();
        }
      })), ...buildOptions.map(b => ({
        ...b,
        category: 'Construções',
        run: () => {
          cancel();
          onBuild(b.id);
        }
      }))];
      const matches = searchCatalog(options, query);
      for (const option of matches) button(option.label + ' · ' + option.category, option.run);
      if (!matches.length) {
        const p = document.createElement('p');
        p.textContent = 'Nenhum resultado. Experimente outro nome.';
        list.append(p);
      }
      return;
    }
    if (currentTab === 'family') {
      const count = data.items.filter(i => i.kind === 'family').length,
        p = document.createElement('p');
      p.textContent = 'Sua família: ' + count + ' pessoa(s). Adicione uma esposa e quantas crianças desejar.';
      list.append(p);
      button('Adicionar esposa', () => spawnFamily(familyCatalog[0])).disabled = familyAdding || data.items.some(i => i.kind === 'family' && i.type === 'esposa');
      const form = document.createElement('form');
      form.className = 'family-form';
      form.innerHTML = '<label>Quantidade de crianças<input name="quantity" type="number" min="1" step="1" value="1" required></label><label>Gênero<select name="gender"><option value="filho">Masculino — menino</option><option value="filha">Feminino — menina</option></select></label><button type="submit">Adicionar crianças</button>';
      form.onsubmit = e => {
        e.preventDefault();
        spawnFamily(familyCatalog.find(i => i.id === form.elements.gender.value), Number(form.elements.quantity.value));
      };
      form.querySelector('button').disabled = familyAdding;
      list.append(form);
      if (familyAdding) button('Cancelar adição', () => {
        cancelFamily();
      });
    } else if (currentTab === 'nature') {
      for (const b of biomes) button(b.label, () => {
        biome(b.id);
        save();
        renderCatalog();
      }, data.biome === b.id);
      for (const a of actions) button(a.label, a.run);
    } else if (currentTab === 'tools') {
      for (const t of tools) button(t.label, () => select(t), selected?.id === t.id);
      for (const a of actions.filter(a => a.category === 'Explorar')) button(a.label, a.run);
    } else for (const item of source.filter(i => category.value === 'Todas' || category.value === i.category || currentTab === 'tree')) button(item.label, () => select(item), selected?.id === item.id && selected?.kind === item.kind);
  }
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    currentTab = b.dataset.tab;
    renderCatalog(true);
  });
  $('catalog-search').oninput = () => renderCatalog();
  $('catalog-category').onchange = () => renderCatalog();
  $('dock-fold').onclick = () => {
    const folded = dock.classList.toggle('folded');
    $('dock-fold').textContent = folded ? '+' : '−';
    $('dock-fold').setAttribute('aria-expanded', String(!folded));
  };
  return renderCatalog;
}
