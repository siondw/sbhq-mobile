import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassyTexture } from '../textures';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import Text from './Text';

interface SubmittedQuestionCardProps {
  round: number;
  question: string;
  options: Array<{ key: string; label: string }>;
  selectedOptionKey?: string;
}

const SubmittedQuestionCard = ({
  round,
  question,
  options,
  selectedOptionKey,
}: SubmittedQuestionCardProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <GlassyTexture colors={colors} style={styles.card} showShine={false}>
      {/* Header: Round + Locked Status */}
      <View style={styles.cardHeader}>
        <View style={styles.roundBadge}>
          <Text weight="bold" style={styles.roundText}>
            ROUND {round}
          </Text>
        </View>
        <View style={styles.lockedBadge}>
          <Ionicons name="lock-closed" size={12} color={colors.primary} />
          <Text weight="bold" style={styles.lockedText}>
            LOCKED IN
          </Text>
        </View>
      </View>

      {/* Question Text */}
      <View style={styles.questionSection}>
        <Text weight="bold" style={styles.questionText}>
          {question}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Options List */}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = option.key === selectedOptionKey;
          return (
            <React.Fragment key={option.key}>
              {index > 0 && <View style={styles.verticalDivider} />}
              <View style={[styles.optionItem, isSelected && styles.optionSelected]}>
                <Text
                  weight="bold"
                  style={[styles.optionKey, { color: isSelected ? colors.primary : colors.muted }]}
                >
                  {option.key}
                </Text>
                <Text
                  weight="medium"
                  style={[styles.optionLabel, { color: isSelected ? colors.ink : colors.muted }]}
                >
                  {option.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </GlassyTexture>
  );
};

const createStyles = (colors: { surface: string; ink: string; muted: string; primary: string }) =>
  StyleSheet.create({
    card: {
      borderRadius: RADIUS.LG,
      padding: SPACING.MD,
      backgroundColor: withAlpha(colors.surface, 0.6),
      borderWidth: 1,
      borderColor: withAlpha(colors.ink, 0.08),
      gap: SPACING.MD,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    roundBadge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      backgroundColor: withAlpha(colors.ink, 0.05),
    },
    roundText: {
      fontSize: 11,
      color: colors.muted,
      letterSpacing: 0.5,
    },
    lockedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 100,
      backgroundColor: withAlpha(colors.ink, 0.05),
      borderWidth: 1,
      borderColor: withAlpha(colors.ink, 0.1),
    },
    lockedText: {
      fontSize: 11,
      color: colors.ink,
      letterSpacing: 0.5,
    },
    questionSection: {
      paddingVertical: SPACING.XS,
    },
    questionText: {
      fontSize: TYPOGRAPHY.SUBTITLE,
      color: colors.ink,
      lineHeight: 28,
    },
    divider: {
      height: 1,
      backgroundColor: withAlpha(colors.ink, 0.08),
    },
    optionsContainer: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    verticalDivider: {
      width: 1,
      backgroundColor: withAlpha(colors.ink, 0.1),
      marginHorizontal: SPACING.XS,
    },
    optionItem: {
      flex: 1,
      alignItems: 'center',
      padding: SPACING.XS,
      borderRadius: RADIUS.MD,
      gap: 4,
    },
    optionSelected: {
      backgroundColor: withAlpha(colors.primary, 0.1),
    },
    optionKey: {
      fontSize: TYPOGRAPHY.SUBTITLE,
    },
    optionLabel: {
      fontSize: TYPOGRAPHY.SMALL - 2,
      textAlign: 'center',
    },
  });

export default SubmittedQuestionCard;
