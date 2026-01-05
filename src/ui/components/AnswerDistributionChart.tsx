import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { GlassyTexture } from '../textures';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import Text from './Text';
import WordSafeText from './WordSafeText';

interface AnswerDistribution {
  option: string;
  label: string;
  count: number;
}

interface AnswerDistributionChartProps {
  distribution: AnswerDistribution[];
  correctAnswer?: string | null;
  userAnswer?: string | null;
  layoutVariant?: 'vertical' | 'horizontal';
}

const AnswerDistributionChart = ({
  distribution,
  correctAnswer,
  userAnswer,
  layoutVariant = 'vertical',
}: AnswerDistributionChartProps) => {
  const { colors } = useTheme();

  const sortedDistribution = useMemo(() => {
    return [...distribution].sort((a, b) => b.count - a.count);
  }, [distribution]);

  const animatedValues = useRef(sortedDistribution.map(() => new Animated.Value(0))).current;

  const totalCount = useMemo(() => {
    return sortedDistribution.reduce((sum, item) => sum + item.count, 0);
  }, [sortedDistribution]);

  const maxCount = useMemo(() => {
    return Math.max(...sortedDistribution.map((item) => item.count), 1);
  }, [sortedDistribution]);

  useEffect(() => {
    const animations = animatedValues.map((animValue) =>
      Animated.timing(animValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    );

    Animated.stagger(300, animations).start();
  }, [animatedValues]);

  const showLegend = correctAnswer && userAnswer && userAnswer !== correctAnswer;

  if (layoutVariant === 'horizontal') {
    return (
      <View style={styles.container}>
        {showLegend && (
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.legendText, { color: colors.muted }]}>Correct</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Text style={[styles.legendText, { color: colors.muted }]}>Your Answer</Text>
            </View>
          </View>
        )}
        <View style={styles.horizontalList}>
          {sortedDistribution.map((item, index) => {
            const percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
            const isCorrect = correctAnswer && item.option === correctAnswer;
            const isUserAnswer = userAnswer && item.option === userAnswer;

            const baseColor = isCorrect
              ? colors.success
              : isUserAnswer && correctAnswer
                ? colors.danger
                : isUserAnswer
                  ? colors.primary
                  : colors.ink;

            const bgOpacity = isCorrect ? 0.8 : isUserAnswer ? 0.5 : 0.2;
            const borderOpacity = isCorrect ? 1 : isUserAnswer ? 0.8 : 0.4;

            const animatedWidth = animatedValues[index]?.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', `${percentage}%`],
            });

            const labelLength = item.label.length;
            const baseFontSize = labelLength > 12 ? TYPOGRAPHY.SMALL - 2 : TYPOGRAPHY.SMALL;

            const testIdSuffix = isCorrect ? '-correct' : isUserAnswer ? '-user-wrong' : '';

            return (
              <View key={item.option} style={styles.horizontalRow} testID={`bar-${item.option}${testIdSuffix}`}>
                <View style={styles.horizontalLabel}>
                  <WordSafeText
                    text={item.label}
                    weight="bold"
                    minFontSize={9}
                    style={[styles.optionLabel, { color: colors.ink, fontSize: baseFontSize }]}
                  />
                </View>
                <View
                  style={[
                    styles.horizontalBarTrack,
                    {
                      borderColor: withAlpha(colors.ink, 0.12),
                      backgroundColor: withAlpha(colors.ink, 0.05),
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.horizontalBarFill,
                      {
                        width: animatedWidth,
                        backgroundColor: withAlpha(baseColor, bgOpacity),
                        borderColor: withAlpha(baseColor, borderOpacity),
                      },
                    ]}
                  />
                </View>
                <View style={styles.horizontalMeta}>
                  <Text weight="bold" style={[styles.horizontalCount, { color: baseColor }]}>
                    {item.count.toLocaleString()}
                  </Text>
                  <Text weight="medium" style={[styles.horizontalPercent, { color: baseColor }]}>
                    {percentage.toFixed(0)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {showLegend && (
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.legendText, { color: colors.muted }]}>Correct</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Text style={[styles.legendText, { color: colors.muted }]}>Your Answer</Text>
            </View>
          </View>
        )}
        {sortedDistribution.map((item, index) => {
          const percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
          const barHeight = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const isCorrect = correctAnswer && item.option === correctAnswer;
          const isUserAnswer = userAnswer && item.option === userAnswer;

          const baseColor = isCorrect
            ? colors.success
            : isUserAnswer && correctAnswer
              ? colors.danger
              : isUserAnswer
                ? colors.primary
                : colors.ink;

          const bgOpacity = isCorrect ? 0.8 : isUserAnswer ? 0.5 : 0.2;
          const borderOpacity = isCorrect ? 1 : isUserAnswer ? 0.8 : 0.4;

          const animatedHeight = animatedValues[index]?.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', `${barHeight}%`],
          });

          const testIdSuffix = isCorrect ? '-correct' : isUserAnswer ? '-user-wrong' : '';

          return (
            <View key={item.option} style={styles.barWrapper} testID={`bar-${item.option}${testIdSuffix}`}>
              <View style={styles.barContainer}>
                <Animated.View
                  style={[
                    styles.barOuter,
                    {
                      height: animatedHeight,
                    },
                  ]}
                >
                  <GlassyTexture
                    colors={colors}
                    showShine={false}
                    style={{
                      ...styles.bar,
                      backgroundColor: withAlpha(baseColor, bgOpacity),
                      borderWidth: 1.5,
                      borderColor: withAlpha(baseColor, borderOpacity),
                    }}
                  >
                    <View style={styles.barContent}>
                      <Text weight="bold" style={[styles.countInBar, { color: baseColor }]}>
                        {item.count.toLocaleString()}
                      </Text>
                      <Text weight="medium" style={[styles.percentageInBar, { color: baseColor }]}>
                        {percentage.toFixed(0)}%
                      </Text>
                    </View>
                  </GlassyTexture>
                </Animated.View>
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.labelsRow}>
        {sortedDistribution.map((item) => {
          const labelLength = item.label.length;
          const baseFontSize = labelLength > 12 ? TYPOGRAPHY.SMALL - 2 : TYPOGRAPHY.SMALL;

          return (
            <View key={item.option} style={styles.labelWrapper}>
              <WordSafeText
                text={item.label}
                weight="bold"
                minFontSize={9}
                style={[styles.optionLabel, { color: colors.ink, fontSize: baseFontSize }]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.SM,
  },
  header: {
    fontSize: TYPOGRAPHY.BODY,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 180,
    paddingVertical: SPACING.SM,
    position: 'relative',
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 140,
    width: '100%',
    justifyContent: 'flex-end',
  },
  barOuter: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: RADIUS.SM,
    borderTopRightRadius: RADIUS.SM,
  },
  bar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XS,
  },
  barContent: {
    alignItems: 'center',
    gap: 2,
  },
  countInBar: {
    fontSize: TYPOGRAPHY.SMALL,
  },
  percentageInBar: {
    fontSize: TYPOGRAPHY.SMALL - 2,
  },
  optionLabel: {
    textAlign: 'center',
    width: '100%',
  },
  labelsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  labelWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.XS,
  },
  horizontalList: {
    gap: SPACING.SM,
  },
  horizontalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.SM,
  },
  horizontalLabel: {
    flex: 1,
    minWidth: 120,
  },
  horizontalBarTrack: {
    flex: 2,
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    alignSelf: 'center',
  },
  horizontalBarFill: {
    height: '100%',
    borderWidth: 1,
    borderRadius: 999,
  },
  horizontalMeta: {
    minWidth: 54,
    alignItems: 'flex-end',
  },
  horizontalCount: {
    fontSize: TYPOGRAPHY.SMALL,
  },
  horizontalPercent: {
    fontSize: TYPOGRAPHY.SMALL - 2,
  },
  legendRow: {
    flexDirection: 'row',
    gap: SPACING.SM,
    alignItems: 'center',
  },
  legend: {
    position: 'absolute',
    top: -SPACING.SM,
    right: SPACING.MD,
    flexDirection: 'column',
    gap: 4,
    backgroundColor: withAlpha('#000000', 0.05),
    paddingHorizontal: SPACING.XS,
    paddingVertical: 4,
    borderRadius: RADIUS.SM,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: TYPOGRAPHY.SMALL - 2,
  },
});

export default AnswerDistributionChart;
