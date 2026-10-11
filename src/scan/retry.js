const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetries(attempt, { retries, backoffMs }) {
  for (let n = 0; ; n += 1) {
    const result = await attempt();
    if (!result.retryable || n >= retries) return result;
    await sleep(backoffMs * 2 ** n);
  }
}
