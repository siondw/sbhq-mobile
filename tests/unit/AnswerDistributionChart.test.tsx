/**
 * Verifies AnswerDistributionChart renders and highlights correctly.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import AnswerDistributionChart from '../../src/ui/components/AnswerDistributionChart';
import { ThemeProvider, DEFAULT_THEME } from '../../src/ui/theme/context';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={DEFAULT_THEME}>{ui}</ThemeProvider>);

describe('AnswerDistributionChart', () => {
  const distribution = [
    { option: 'A', label: 'Zay Flowers', count: 456 },
    { option: 'B', label: 'Derrick Henry', count: 312 },
    { option: 'C', label: 'Mark Andrews', count: 289 },
  ];

  test('renders all distribution items with labels', () => {
    const { getByText } = renderWithTheme(
      <AnswerDistributionChart
        distribution={distribution}
        correctAnswer="A"
        userAnswer="A"
      />,
    );

    // Verify labels are rendered
    expect(getByText('Zay Flowers')).toBeTruthy();
    expect(getByText('Derrick Henry')).toBeTruthy();
    expect(getByText('Mark Andrews')).toBeTruthy();
  });

  test('renders correct answer bar with testID', () => {
    const { getByTestId } = renderWithTheme(
      <AnswerDistributionChart
        distribution={distribution}
        correctAnswer="A"
        userAnswer="A"
      />,
    );

    // When user got it correct, bar should have -correct suffix
    expect(getByTestId('bar-A-correct')).toBeTruthy();
  });

  test('renders user wrong answer bar with testID', () => {
    const { getByTestId } = renderWithTheme(
      <AnswerDistributionChart
        distribution={distribution}
        correctAnswer="A"
        userAnswer="B"
      />,
    );

    // Correct answer bar
    expect(getByTestId('bar-A-correct')).toBeTruthy();
    // User's wrong answer bar
    expect(getByTestId('bar-B-user-wrong')).toBeTruthy();
    // Other bars have no suffix
    expect(getByTestId('bar-C')).toBeTruthy();
  });

  test('renders without suffix when no correctAnswer provided', () => {
    const { getByTestId } = renderWithTheme(
      <AnswerDistributionChart
        distribution={distribution}
        correctAnswer={null}
        userAnswer="A"
      />,
    );

    // User answer without correctAnswer just has -user-wrong suffix
    // (since isCorrect is false when correctAnswer is null)
    expect(getByTestId('bar-A-user-wrong')).toBeTruthy();
  });

  test('renders without crashing when distribution is empty', () => {
    const { toJSON } = renderWithTheme(
      <AnswerDistributionChart
        distribution={[]}
        correctAnswer={null}
        userAnswer={null}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  test('horizontal layout also has testIDs', () => {
    const { getByTestId } = renderWithTheme(
      <AnswerDistributionChart
        distribution={distribution}
        correctAnswer="A"
        userAnswer="B"
        layoutVariant="horizontal"
      />,
    );

    expect(getByTestId('bar-A-correct')).toBeTruthy();
    expect(getByTestId('bar-B-user-wrong')).toBeTruthy();
  });
});
