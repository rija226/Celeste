export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Izvlacenje bez ponavljanja: svaka stavka izlazi jednom po krugu, a novi
// krug ne pocinje stavkom kojom je prethodni zavrsio. Prazan niz -> undefined.
export function createShuffleBag<T>(items: T[]): () => T | undefined {
  let bag: T[] = [];
  let last: T | undefined;
  return () => {
    if (bag.length === 0) {
      bag = shuffle(items);
      // pop() uzima s kraja, pa se tu provjerava prvo izvlacenje novog kruga.
      if (bag.length > 1 && bag[bag.length - 1] === last) {
        [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      }
    }
    last = bag.pop();
    return last;
  };
}
