export const MAP_SIZE = 20;
export const MAP_HALF = Math.floor(MAP_SIZE / 2);

export function createWorldLayout(size = MAP_SIZE) {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      const lake = row >= 7 && row <= 13 && col >= 9 && col <= 16;
      const waterfall = row === 5 && col >= 10 && col <= 15;
      const mountain = row <= 5 && col >= 9 && col <= 16;
      const river = row >= 5 && row <= 8 && col >= 3 && col <= 8;
      const trees = (row + col) % 5 === 0 && !lake && !mountain && !waterfall && row > 2;

      let type = 'meadow';

      if (lake) type = 'lake';
      else if (waterfall) type = 'waterfall';
      else if (mountain) type = 'mountain';
      else if (river) type = 'river';
      else if (trees) type = 'tree';
      else if ((row + col) % 7 === 0) type = 'rock';

      return { row, col, type };
    })
  );
}

export function getLakeBounds(tiles) {
  const bounds = { minRow: Number.POSITIVE_INFINITY, maxRow: Number.NEGATIVE_INFINITY, minCol: Number.POSITIVE_INFINITY, maxCol: Number.NEGATIVE_INFINITY };

  for (let row = 0; row < tiles.length; row += 1) {
    for (let col = 0; col < tiles[row].length; col += 1) {
      if (tiles[row][col].type !== 'lake') continue;
      bounds.minRow = Math.min(bounds.minRow, row);
      bounds.maxRow = Math.max(bounds.maxRow, row);
      bounds.minCol = Math.min(bounds.minCol, col);
      bounds.maxCol = Math.max(bounds.maxCol, col);
    }
  }

  if (!Number.isFinite(bounds.minRow)) {
    return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 };
  }

  return bounds;
}

export function isLakeTile(row, col, tiles) {
  return tiles[row]?.[col]?.type === 'lake';
}

export function canPlaceBoatAt(row, col, tiles) {
  return isLakeTile(row, col, tiles);
}

export function getTileWorldPosition(row, col, size = MAP_SIZE) {
  const offset = (size - 1) / 2;
  return {
    x: col - offset,
    z: row - offset,
  };
}
