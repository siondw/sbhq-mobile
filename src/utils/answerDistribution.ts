import type { AnswerDistribution as DbAnswerDistribution } from '../db/answers';
import type { QuestionOption } from './questionOptions';

export type AnswerDistributionEntry = {
  option: string;
  label: string;
  count: number;
};

export const buildAnswerDistribution = (
  options: QuestionOption[],
  distribution: DbAnswerDistribution[],
): AnswerDistributionEntry[] => {
  if (options.length === 0) {
    return distribution.map((item) => ({
      option: item.answer,
      label: item.answer,
      count: item.count,
    }));
  }

  const distributionMap = new Map<string, number>();
  distribution.forEach((item) => {
    distributionMap.set(item.answer, item.count);
  });

  const matchedAnswers = new Set<string>();
  options.forEach((option) => {
    if (distributionMap.has(option.key)) {
      matchedAnswers.add(option.key);
    }
    if (distributionMap.has(option.label)) {
      matchedAnswers.add(option.label);
    }
  });

  const normalized = options.map((option) => {
    const count = distributionMap.get(option.key) ?? distributionMap.get(option.label) ?? 0;
    return {
      option: option.key,
      label: option.label,
      count,
    };
  });

  const extras = distribution
    .filter((item) => !matchedAnswers.has(item.answer))
    .map((item) => ({
      option: item.answer,
      label: item.answer,
      count: item.count,
    }));

  return extras.length > 0 ? [...normalized, ...extras] : normalized;
};
