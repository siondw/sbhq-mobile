/**
 * Verifies that distribution data from the DB (labels) is correctly
 * mapped to keys for AnswerDistributionChart comparison.
 *
 * The SQL function `get_answer_distribution` returns labels (e.g., "Zay Flowers")
 * but AnswerDistributionChart compares against keys (e.g., "A").
 */
import { normalizeQuestionOptions } from '../../src/utils/questionOptions';

describe('Answer Distribution Mapping', () => {
  const questionOptions = {
    A: 'Zay Flowers',
    B: 'Derrick Henry',
    C: 'Mark Andrews',
    D: 'Everyone else',
  };

  // This is what the DB returns (labels from get_answer_distribution RPC)
  const dbDistribution = [
    { answer: 'Zay Flowers', count: 456 },
    { answer: 'Derrick Henry', count: 312 },
    { answer: 'Mark Andrews', count: 289 },
    { answer: 'Everyone else', count: 190 },
  ];

  test('CORRECT mapping: converts labels to keys for comparison', () => {
    const options = normalizeQuestionOptions(questionOptions);

    // This is the CORRECT mapping (what screens should do)
    const correctMapping = dbDistribution.map((d) => ({
      option: options.find((o) => o.label === d.answer)?.key ?? d.answer,
      label: d.answer,
      count: d.count,
    }));

    // Verify options are now KEYS
    expect(correctMapping[0].option).toBe('A');
    expect(correctMapping[1].option).toBe('B');
    expect(correctMapping[2].option).toBe('C');
    expect(correctMapping[3].option).toBe('D');

    // Labels should still be the human-readable text
    expect(correctMapping[0].label).toBe('Zay Flowers');
    expect(correctMapping[1].label).toBe('Derrick Henry');
  });

  test('correct mapping allows AnswerDistributionChart to match correctAnswer', () => {
    const options = normalizeQuestionOptions(questionOptions);
    const correctAnswer = 'A'; // The key, as stored in DB

    const mapping = dbDistribution.map((d) => ({
      option: options.find((o) => o.label === d.answer)?.key ?? d.answer,
      label: d.answer,
      count: d.count,
    }));

    // The chart compares item.option === correctAnswer
    const correctItem = mapping.find((item) => item.option === correctAnswer);
    expect(correctItem).toBeDefined();
    expect(correctItem?.label).toBe('Zay Flowers');
  });

  test('correct mapping allows AnswerDistributionChart to match userAnswer', () => {
    const options = normalizeQuestionOptions(questionOptions);
    const userAnswer = 'B'; // User selected option B (Derrick Henry)

    const mapping = dbDistribution.map((d) => ({
      option: options.find((o) => o.label === d.answer)?.key ?? d.answer,
      label: d.answer,
      count: d.count,
    }));

    // The chart compares item.option === userAnswer
    const userItem = mapping.find((item) => item.option === userAnswer);
    expect(userItem).toBeDefined();
    expect(userItem?.label).toBe('Derrick Henry');
  });

  test('handles fallback when label not found in options', () => {
    const options = normalizeQuestionOptions(questionOptions);

    // Simulate a label that doesn't exist in options (edge case)
    const unknownDistribution = [{ answer: 'Unknown Player', count: 100 }];

    const mapping = unknownDistribution.map((d) => ({
      option: options.find((o) => o.label === d.answer)?.key ?? d.answer,
      label: d.answer,
      count: d.count,
    }));

    // Falls back to the raw answer value
    expect(mapping[0].option).toBe('Unknown Player');
    expect(mapping[0].label).toBe('Unknown Player');
  });
});
