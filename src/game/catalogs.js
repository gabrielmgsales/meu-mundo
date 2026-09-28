import { familyCatalog } from './family.js';
export { familyCatalog };
// Each animal has a stable save identifier and an anatomical family.
const animalGroups = [['Fazenda e companhia', [['galinha', 'Galinha', 'hen', '#bd7845', .7], ['porco', 'Porco', 'pig', '#d79f98', 1], ['vaca', 'Vaca', 'cow', '#eee4d2', 1.4], ['boi', 'Boi', 'bull', '#8d6750', 1.5], ['cachorro', 'Cachorro', 'dog', '#b18a58', .8], ['gato', 'Gato', 'cat', '#b7a294', .6], ['cavalo', 'Cavalo', 'horse', '#865038', 1.5], ['burro', 'Burro', 'donkey', '#8a8175', 1.2], ['mula', 'Mula', 'donkey', '#6b5644', 1.3], ['ponei', 'Pônei', 'horse', '#c39c6c', 1], ['cabra', 'Cabra', 'goat', '#dbc9a2', .9], ['ovelha', 'Ovelha', 'sheep', '#eee4cb', 1], ['coelho', 'Coelho', 'rabbit', '#d5c2ab', .5], ['pato', 'Pato', 'duck', '#e8e2c5', .7], ['ganso', 'Ganso', 'goose', '#eee9d6', .85], ['peru', 'Peru', 'hen', '#554c43', 1], ['codorna', 'Codorna', 'hen', '#a28a60', .45], ['pavao', 'Pavão', 'peacock', '#327f84', 1], ['hamster', 'Hamster', 'rodent', '#cfa775', .3], ['porquinho', 'Porquinho-da-índia', 'rodent', '#a66a4b', .4]]], ['Aves', [['passaro', 'Pássaro', 'bird', '#af9c6b', .45], ['papagaio', 'Papagaio', 'bird', '#5f9a48', .65], ['arara', 'Arara', 'bird', '#d86349', .85], ['periquito', 'Periquito', 'bird', '#9ebd4c', .4], ['canario', 'Canário', 'bird', '#e4c956', .35], ['tucano', 'Tucano', 'toucan', '#303a3a', .8], ['coruja', 'Coruja', 'owl', '#9b8262', .8], ['aguia', 'Águia', 'raptor', '#7b6049', 1], ['gaviao', 'Gavião', 'raptor', '#897c6a', .8], ['pombo', 'Pombo', 'bird', '#8c9ba0', .5], ['beijaflor', 'Beija-flor', 'bird', '#479e89', .25], ['flamingo', 'Flamingo', 'wader', '#e8a0a3', 1], ['garca', 'Garça', 'wader', '#e6e6da', 1], ['avestruz', 'Avestruz', 'ostrich', '#504b43', 1.6], ['pinguim', 'Pinguim', 'penguin', '#323d45', .8]]], ['Silvestres', [['lobo', 'Lobo', 'dog', '#92958c', 1.1], ['raposa', 'Raposa', 'dog', '#bd743e', .8], ['urso', 'Urso', 'bear', '#74533e', 1.6], ['leao', 'Leão', 'lion', '#c4a05e', 1.3], ['tigre', 'Tigre', 'tiger', '#c48a42', 1.3], ['onca', 'Onça-pintada', 'jaguar', '#c3a262', 1.2], ['elefante', 'Elefante', 'elephant', '#96978c', 2], ['girafa', 'Girafa', 'giraffe', '#c3a163', 1.8], ['zebra', 'Zebra', 'zebra', '#e5ddc8', 1.3], ['macaco', 'Macaco', 'monkey', '#98724c', .8], ['gorila', 'Gorila', 'ape', '#53534d', 1.3], ['capivara', 'Capivara', 'rodent', '#98805b', 1], ['veado', 'Veado', 'deer', '#b28c5e', 1.2], ['tatu', 'Tatu', 'armadillo', '#9b8b75', .65], ['tamandua', 'Tamanduá', 'anteater', '#7d796c', 1.2], ['preguica', 'Preguiça', 'ape', '#a0987d', .7], ['morcego', 'Morcego', 'bat', '#62574e', .55]]], ['Água e répteis', [['peixes', 'Peixes', 'fish', '#d5a35b', .55], ['jacare', 'Jacaré', 'crocodile', '#6d8055', 1.2], ['tartaruga', 'Tartaruga', 'turtle', '#788259', .7], ['sapo', 'Sapo', 'frog', '#7e9d55', .4], ['cobra', 'Cobra', 'snake', '#929450', .8], ['lagarto', 'Lagarto', 'lizard', '#7b945b', .6]]]];
export const animals = animalGroups.flatMap(([category, entries]) => entries.map(([id, label, family, color, size]) => ({
  id,
  label,
  family,
  color,
  size,
  category,
  kind: 'animal'
})));
export const trees = [['carvalho', 'Carvalho', '#68864e', 1, 'round'], ['pinheiro', 'Pinheiro', '#3e7155', 1.2, 'pine'], ['ipe', 'Ipê-amarelo', '#dbbc48', .9, 'round'], ['cerejeira', 'Cerejeira', '#d79fa9', .85, 'round'], ['jacaranda', 'Jacarandá', '#a498ca', 1, 'round'], ['mangueira', 'Mangueira', '#49784e', 1.1, 'fruit'], ['macieira', 'Macieira', '#7b984e', .75, 'fruit'], ['laranjeira', 'Laranjeira', '#668542', .8, 'fruit'], ['coqueiro', 'Coqueiro', '#708e45', 1.1, 'palm'], ['salgueiro', 'Salgueiro', '#8b9f62', 1, 'willow'], ['eucalipto', 'Eucalipto', '#89a88a', 1.35, 'round'], ['araucaria', 'Araucária', '#476d4a', 1.25, 'pine']].map(([id, label, color, size, family]) => ({
  id,
  label,
  color,
  size,
  family,
  kind: 'tree',
  category: 'Árvores'
}));
export const furniture = [['cadeira', 'Cadeira', 'Assentos'], ['poltrona', 'Poltrona', 'Assentos'], ['sofa', 'Sofá', 'Assentos'], ['banco', 'Banco', 'Assentos'], ['mesa', 'Mesa de jantar', 'Mesas'], ['mesinha', 'Mesa de centro', 'Mesas'], ['escrivaninha', 'Escrivaninha', 'Mesas'], ['cama', 'Cama de solteiro', 'Quarto'], ['cama-casal', 'Cama de casal', 'Quarto'], ['armario', 'Armário', 'Quarto'], ['comoda', 'Cômoda', 'Quarto'], ['bau', 'Baú', 'Quarto'], ['estante', 'Estante de livros', 'Decoração'], ['tapete', 'Tapete', 'Decoração'], ['vaso', 'Vaso de flores', 'Decoração'], ['quadro', 'Quadro em cavalete', 'Decoração'], ['barril', 'Barril', 'Decoração'], ['tocha', 'Tocha', 'Iluminação'], ['luminaria', 'Luminária', 'Iluminação'], ['fogueira', 'Fogueira', 'Iluminação']].map(([id, label, category]) => ({
  id,
  label,
  category,
  kind: 'furniture'
}));
export const biomes = [{
  id: 'vale',
  label: 'Vale verde',
  ground: '#ffffff',
  leaf: '#526342',
  grass: '#79845b'
}, {
  id: 'outono',
  label: 'Outono dourado',
  ground: '#c8a479',
  leaf: '#ba783f',
  grass: '#b4a063'
}, {
  id: 'floresta',
  label: 'Floresta úmida',
  ground: '#8bab8a',
  leaf: '#3c784b',
  grass: '#5f8957'
}, {
  id: 'neve',
  label: 'Bosque nevado',
  ground: '#eef2ee',
  leaf: '#bbcbbb',
  grass: '#d6dfcf'
}, {
  id: 'seco',
  label: 'Savana',
  ground: '#dfc28b',
  leaf: '#8e9149',
  grass: '#bcb074'
}];
export const allItems = [...animals, ...trees, ...furniture, ...familyCatalog];
export function getFurnitureAction(item) {
  const id = typeof item === 'string' ? item : item?.id;
  if (!id || item && item.kind !== 'furniture') return null;
  if (['cadeira', 'poltrona', 'sofa', 'banco'].includes(id)) return {
    type: 'sit',
    label: 'Sentar'
  };
  if (id.startsWith('cama')) return {
    type: 'lie',
    label: 'Deitar'
  };
  return null;
}
