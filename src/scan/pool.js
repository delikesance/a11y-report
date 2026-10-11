export async function mapWithConcurrency(items, concurrency, task) {
  const results = new Array(items.length);
  let next = 0;
  const runNext = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index]);
    }
  };
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, runNext);
  const failure = (await Promise.allSettled(runners)).find((outcome) => outcome.status === 'rejected');
  if (failure) throw failure.reason;
  return results;
}
