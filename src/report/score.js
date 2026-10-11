import { collectProblems, computeImpactWeightedScore } from './model.js';

export const computePageScore = (page) =>
  page.error ? null : computeImpactWeightedScore(collectProblems({ pages: [page] }));
