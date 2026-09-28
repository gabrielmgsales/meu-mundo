import test from 'node:test';
import assert from 'node:assert/strict';

import { createWorldLayout, getLakeBounds, isLakeTile, canPlaceBoatAt } from '../legacy/src/world-layout.js';

test('o mapa expandido cria um lago grande e uma cachoeira no topo', () => {
  const tiles = createWorldLayout();
  const lakeTiles = [];

  for (let row = 0; row < tiles.length; row += 1) {
    for (let col = 0; col < tiles[row].length; col += 1) {
      if (tiles[row][col].type === 'lake') lakeTiles.push({ row, col });
    }
  }

  assert.ok(lakeTiles.length > 30, 'o lago deve ter bastante área');

  const { minRow, maxRow, minCol, maxCol } = getLakeBounds(tiles);
  assert.ok(maxRow - minRow >= 4, 'o lago deve ser grande');
  assert.ok(maxCol - minCol >= 5, 'o lago deve ser amplo');
  assert.ok(isLakeTile(minRow, minCol, tiles), 'o lago deve possuir uma célula inicial válida');

  const waterfallCell = tiles[5]?.[11];
  assert.equal(waterfallCell?.type, 'waterfall', 'a cachoeira deve cair da montanha para o lago');
});

test('barco só pode entrar em lago ou deck e não em terreno seco', () => {
  const tiles = createWorldLayout();
  assert.equal(canPlaceBoatAt(10, 12, tiles), true, 'uma célula de lago deve aceitar o barco');
  assert.equal(canPlaceBoatAt(1, 1, tiles), false, 'um terreno seco não deve aceitar o barco');
});
