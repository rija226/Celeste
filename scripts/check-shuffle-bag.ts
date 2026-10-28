// Provjera spila bez ponavljanja (kviz). Pokretanje:
//   npx esbuild scripts/check-shuffle-bag.ts --bundle --platform=node --log-level=warning | node
import assert from 'node:assert/strict';

import { createShuffleBag } from '../src/lib/shuffleBag';

for (const size of [1, 2, 4, 12]) {
  const items = Array.from({ length: size }, (_, i) => i);
  for (let run = 0; run < 500; run++) {
    const next = createShuffleBag(items);
    const drawn = Array.from({ length: size * 3 }, () => next());
    for (let round = 0; round < 3; round++) {
      const cycle = drawn.slice(round * size, (round + 1) * size);
      assert.deepEqual([...cycle].sort((a, b) => a! - b!), items, `size ${size}: svaki krug sadrzi svako pitanje tacno jednom`);
    }
    if (size > 1) {
      drawn.slice(1).forEach((value, i) => assert.notEqual(value, drawn[i], `size ${size}: isto pitanje dvaput zaredom`));
    }
  }
}

assert.equal(createShuffleBag([])(), undefined, 'prazan pool -> undefined');

console.log('check-shuffle-bag: OK');
