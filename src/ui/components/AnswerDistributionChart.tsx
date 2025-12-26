import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { GlassyTexture } from '../textures';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import Text from './Text';

interface AnswerDistribution {
  option: string;
  label: string;
  count: number;
}

interface AnswerDistributionChartProps {
  distribution: AnswerDistribution[];
  correctAnswer?: string | null;
  userAnswer?: string | null;
}

const AnswerDistributionChart = ({
  distribution,
  correctAnswer,
  userAnswer,
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
        duration: 500,
        useNativeDriver: false,
      }),
    );

    Animated.stagger(100, animations).start();
  }, [animatedValues]);

  return (
    <View style={styles.container}>
      <Text weight="bold" style={[styles.header, { color: colors.ink }]}>
        Answer Distribution
      </Text>

      <View style={styles.chartContainer}>
        {correctAnswer && userAnswer && userAnswer !== correctAnswer && (
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

          return (
            <View key={item.option} style={styles.barWrapper}>
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
              <Text weight="bold" style={[styles.optionLabel, { color: colors.ink }]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.MD,
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
    gap: SPACING.XS,
  },
  barContainer: {
    flex: 1,
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
    fontSize: TYPOGRAPHY.BODY,
  },
  legend: {
    position: 'absolute',
    top: SPACING.XS,
    right: SPACING.XS,
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
