import { ANSWER_OPTION, type AnswerOptionValue } from '../configs/constants';

export type QuestionOption = {
  key: AnswerOptionValue;
  label: string;
  value: string;
};

const OPTION_ORDER: AnswerOptionValue[] = [
  ANSWER_OPTION.A,
  ANSWER_OPTION.B,
  ANSWER_OPTION.C,
  ANSWER_OPTION.D,
  ANSWER_OPTION.E,
  ANSWER_OPTION.F,
];

export const isAnswerOptionValue = (value: string): value is AnswerOptionValue =>
  Object.prototype.hasOwnProperty.call(ANSWER_OPTION, value);

export const normalizeQuestionOptions = (options: unknown): QuestionOption[] => {
  if (!options) return [];

  if (Array.isArray(options)) {
    return options.slice(0, OPTION_ORDER.length).map((value, index) => {
      const label = typeof value === 'string' ? value : String(value);
      const key = OPTION_ORDER[index];
      return { key, label, value: label };
    });
  }

  if (typeof options === 'object') {
    const normalized: QuestionOption[] = [];
    for (const [key, value] of Object.entries(options as Record<string, unknown>)) {
      if (!isAnswerOptionValue(key)) {
        continue;
      }
      const label = typeof value === 'string' ? value : String(value);
      normalized.push({ key, label, value: label });
    }
    return normalized;
  }

  return [];
};

export const resolveOptionLabel = (options: unknown, answer?: string | null): string | null => {
  if (!answer) return null;
  const normalized = normalizeQuestionOptions(options);
  const match = normalized.find((option) => option.value === answer || option.key === answer);
  return match?.label ?? answer;
};

export const resolveOptionLabels = (
  options: unknown,
  answers?: string[] | null,
): string[] | null => {
  if (!answers || answers.length === 0) return null;
  return answers.map((answer) => resolveOptionLabel(options, answer) ?? answer);
};
