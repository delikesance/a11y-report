#!/bin/sh
cd "$(dirname "$0")/.." || exit 1
for concurrency in 1 4; do
  for pages in 10 25 50 100; do
    node --expose-gc scripts/measure-memory.js "$pages" "$concurrency" | tail -n 1
  done
done
