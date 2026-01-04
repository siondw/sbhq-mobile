import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassyTexture } from '../textures';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import Text from './Text';
import WordSafeText from './WordSafeText';

interface SubmittedQuestionCardProps {
  round: number;
  question: string;
  options: Array<{ key: string; label: string }>;
  selectedOptionKey?: string;
  layoutVariant?: 'columns' | 'wrap' | 'stacked';
}

const SubmittedQuestionCard = ({
  round,
  question,
  options,
  selectedOptionKey,
  layoutVariant = 'columns',
}: SubmittedQuestionCardProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const showDividers = layoutVariant === 'columns';
  const isWrap = layoutVariant === 'wrap';
  const isStacked = layoutVariant === 'stacked';

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
      <View
        style={[
          styles.optionsContainer,
          isWrap && styles.optionsContainerWrap,
          isStacked && styles.optionsContainerStacked,
        ]}
      >
        {options.map((option, index) => {
          const isSelected = option.key === selectedOptionKey;
          if (isStacked) {
            return (
              <View
                key={option.key}
                style={[styles.optionItemStacked, isSelected && styles.optionSelectedStacked]}
              >
                <View
                  style={[
                    styles.optionKeyBadge,
                    isSelected && { borderColor: withAlpha(colors.primary, 0.35) },
                  ]}
                >
                  <Text
                    weight="bold"
                    style={[
                      styles.optionKeyBadgeText,
                      { color: isSelected ? colors.primary : colors.muted },
                    ]}
                  >
                    {option.key}
                  </Text>
                </View>
                <WordSafeText
                  text={option.label}
                  weight="medium"
                  minFontSize={9}
                  style={[
                    styles.optionLabelStacked,
                    { color: isSelected ? colors.ink : colors.muted },
                  ]}
                />
              </View>
            );
          }

          return (
            <React.Fragment key={option.key}>
              {showDividers && index > 0 && <View style={styles.verticalDivider} />}
              <View
                style={[
                  styles.optionItem,
                  isWrap && styles.optionItemWrap,
                  isSelected && styles.optionSelected,
                ]}
              >
                <Text
                  weight="bold"
                  style={[styles.optionKey, { color: isSelected ? colors.primary : colors.muted }]}
                >
                  {option.key}
                </Text>
                <WordSafeText
                  text={option.label}
                  weight="medium"
                  minFontSize={9}
                  style={[styles.optionLabel, { color: isSelected ? colors.ink : colors.muted }]}
                />
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
    optionsContainerWrap: {
      flexWrap: 'wrap',
      gap: SPACING.XS,
    },
    optionsContainerStacked: {
      flexDirection: 'column',
      gap: SPACING.SM,
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
    optionItemWrap: {
      flexBasis: '48%',
      flexGrow: 1,
      minWidth: 140,
    },
    optionSelected: {
      backgroundColor: withAlpha(colors.primary, 0.1),
    },
    optionItemStacked: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.SM,
      padding: SPACING.SM,
      borderRadius: RADIUS.MD,
      borderWidth: 1,
      borderColor: withAlpha(colors.ink, 0.08),
    },
    optionSelectedStacked: {
      backgroundColor: withAlpha(colors.primary, 0.08),
      borderColor: withAlpha(colors.primary, 0.25),
    },
    optionKey: {
      fontSize: TYPOGRAPHY.SUBTITLE,
    },
    optionKeyBadge: {
      minWidth: 32,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: withAlpha(colors.ink, 0.12),
      backgroundColor: withAlpha(colors.ink, 0.04),
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionKeyBadgeText: {
      fontSize: TYPOGRAPHY.SMALL,
      letterSpacing: 0.6,
    },
    optionLabel: {
      fontSize: TYPOGRAPHY.SMALL - 2,
      textAlign: 'center',
      width: '100%',
    },
    optionLabelStacked: {
      fontSize: TYPOGRAPHY.BODY,
      textAlign: 'left',
      flex: 1,
      lineHeight: 22,
    },
  });

export default SubmittedQuestionCard;
