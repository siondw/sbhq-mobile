import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import LottieView, { type AnimationObject } from 'lottie-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';
import { useShineAnimation } from '../ui/animations';
import RollingFootball from '../ui/animations/RollingFootball';
import { FOOTBALL_DARK_RED_KEYPATHS, FOOTBALL_RED_KEYPATHS } from '../ui/animations/constants';
import AnswerDistributionChart from '../ui/components/AnswerDistributionChart';
import AnswerOption from '../ui/components/AnswerOption';
import Card from '../ui/components/Card';
import ContestListTicket from '../ui/components/ContestListTicket';
import ContestStatsCard from '../ui/components/ContestStatsCard';
import OnboardingModal from '../ui/components/OnboardingModal';
import Scorebug from '../ui/components/Scorebug';
import Text from '../ui/components/Text';
import {
  DEFAULT_PALETTE,
  PLAYGROUND_PALETTES,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  ThemeProvider,
  isDarkHex,
  themeFromPlaygroundPalette,
  withAlpha,
  darken,
  type PlaygroundPalette,
} from '../ui/theme';
import ballGif from '../../assets/gifs/ball.gif';
import catchGif from '../../assets/gifs/catch_nobg.gif';
import footballAnimationJson from '../../assets/gifs/football.json';
import noiseTexture from '../../assets/noise.png';

// Use DEFAULT_PALETTE for static styles in playground (not a production screen)
const COLORS = {
  PRIMARY_DARK: DEFAULT_PALETTE.ink,
  BACKGROUND: DEFAULT_PALETTE.bg,
  MUTED: DEFAULT_PALETTE.ink, // Will use with alpha in styles
  SURFACE: DEFAULT_PALETTE.surface,
} as const;

const footballAnimation = footballAnimationJson as AnimationObject;

const footballGifs: Array<{ label: string; source: ImageSourcePropType }> = [
  { label: 'ball.gif', source: ballGif },
  { label: 'catch_nobg.gif', source: catchGif },
];

// Correct screen animation component for playground
const CorrectAnimation = ({ color }: { color: string }) => {
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const contentAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;
  const [showChart, setShowChart] = useState(false);

  const { translateX: shineTranslateX, opacity: shineOpacity } = useShineAnimation({
    preset: 'NORMAL',
    delay: 400,
    loop: false,
  });

  useEffect(() => {
    // Reset chart visibility
    setShowChart(false);

    // Checkmark and text scale/fade in together
    Animated.parallel([
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(checkmarkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(textScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Summary container fades in after text+shine complete (~1400ms)
    Animated.sequence([
      Animated.delay(1400),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Chart fades in after summary (~2100ms)
    setTimeout(() => setShowChart(true), 2100);
    Animated.sequence([
      Animated.delay(2100),
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [checkmarkScale, checkmarkOpacity, textScale, textOpacity, contentAnim, chartAnim]);

  return (
    <View style={styles.eliminatedPreview}>
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.SM,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              opacity: textOpacity,
              transform: [{ scale: textScale }],
            }}
          >
            <Text
              weight="bold"
              style={{ fontSize: 56, color, textAlign: 'center', letterSpacing: -1 }}
            >
              Correct!
            </Text>
          </Animated.View>
          <Animated.View
            style={{
              opacity: checkmarkOpacity,
              transform: [{ scale: checkmarkScale }],
            }}
          >
            <Ionicons name="checkmark" size={64} color={color} />
          </Animated.View>
          <Animated.View
            style={{
              position: 'absolute',
              top: -120,
              left: -150,
              width: 600,
              height: 200,
              borderRadius: 200,
              overflow: 'hidden',
              zIndex: 2,
              opacity: shineOpacity,
              transform: [{ translateX: shineTranslateX }, { rotate: '-35deg' }],
            }}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0.04)',
                'rgba(255, 255, 255, 0.08)',
                'rgba(255, 255, 255, 0.03)',
                'rgba(255, 255, 255, 0.1)',
                'rgba(255, 255, 255, 0.12)',
                'rgba(255, 255, 255, 0.08)',
                'rgba(255, 255, 255, 0.04)',
                'rgba(255, 255, 255, 0)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, width: '100%', height: '100%' }}
            />
          </Animated.View>
        </View>
      </View>
      <Animated.View style={{ marginTop: SPACING.LG, width: '100%', opacity: contentAnim }}>
        <ContestStatsCard numberOfRemainingPlayers={342} roundNumber={5} variant="success" />
      </Animated.View>
      <Animated.View style={{ marginTop: SPACING.XL, width: '100%', opacity: chartAnim }}>
        {showChart && (
          <AnswerDistributionChart
            distribution={[
              { option: 'A', label: 'Go for it', count: 523 },
              { option: 'B', label: 'Punt', count: 312 },
              { option: 'C', label: 'Kick FG', count: 487 },
              { option: 'D', label: 'Fake punt', count: 160 },
            ]}
            correctAnswer="C"
            userAnswer="C"
          />
        )}
      </Animated.View>
    </View>
  );
};

const PlaygroundScreen = () => {
  const router = useRouter();
  const [selectedRealOption, setSelectedRealOption] = useState<string | null>('A');
  const [playersRemaining, setPlayersRemaining] = useState(1482);
  const [gifIndex] = useState(0);
  const [paletteKey, setPaletteKey] = useState<string>(PLAYGROUND_PALETTES[0]?.key ?? 'current');
  const [chartKey, setChartKey] = useState(0);
  const [chartState, setChartState] = useState<'submitted' | 'correct' | 'eliminated'>('submitted');
  const [statsVariant, setStatsVariant] = useState<'success' | 'eliminated'>('success');
  const [checkmarkKey, setCheckmarkKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const palette: PlaygroundPalette = useMemo(() => {
    const found = PLAYGROUND_PALETTES.find((p) => p.key === paletteKey);
    return found?.palette ?? PLAYGROUND_PALETTES[0]?.palette ?? PLAYGROUND_PALETTES[0].palette;
  }, [paletteKey]);

  const colorFilters = useMemo(() => {
    const primaryFilters = FOOTBALL_RED_KEYPATHS.map((keypath) => ({
      keypath,
      color: palette.primary,
    }));

    const darkFilters = FOOTBALL_DARK_RED_KEYPATHS.map((keypath) => ({
      keypath,
      color: darken(palette.primary, 0.4),
    }));

    return [...primaryFilters, ...darkFilters];
  }, [palette.primary]);

  useEffect(() => {
    if (!__DEV__) {
      router.replace('/');
    }
  }, [router]);

  const darkTheme = useMemo(() => isDarkHex(palette.bg), [palette.bg]);
  const noiseOpacity = darkTheme ? 0.08 : 0.03;
  const noiseBlur = darkTheme ? 0 : 1;
  const noiseResizeMode = Platform.OS === 'ios' ? 'repeat' : 'cover';

  const theme = useMemo(() => themeFromPlaygroundPalette(palette), [palette]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.bg }]}
      edges={['top', 'bottom']}
    >
      <ThemeProvider theme={theme}>
        <View style={styles.screen}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <ImageBackground
              source={noiseTexture}
              style={StyleSheet.absoluteFill}
              resizeMode={noiseResizeMode}
              imageStyle={[styles.noiseImage, { opacity: noiseOpacity }]}
              blurRadius={noiseBlur}
            />
          </View>

          <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Section title="Haptics Testing" titleColor={palette.ink}>
              <Row>
                <Chip
                  label="Selection"
                  onPress={() => void Haptics.selectionAsync()}
                  palette={palette}
                />
                <Chip
                  label="Light"
                  onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  palette={palette}
                />
                <Chip
                  label="Medium"
                  onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                  palette={palette}
                />
                <Chip
                  label="Heavy"
                  onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
                  palette={palette}
                />
              </Row>
              <Row>
                <Chip
                  label="Rigid"
                  onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)}
                  palette={palette}
                />
                <Chip
                  label="Soft"
                  onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}
                  palette={palette}
                />
              </Row>
              <Row>
                <Chip
                  label="Success"
                  onPress={() =>
                    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                  }
                  palette={palette}
                />
                <Chip
                  label="Warning"
                  onPress={() =>
                    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
                  }
                  palette={palette}
                />
                <Chip
                  label="Error"
                  onPress={() =>
                    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
                  }
                  palette={palette}
                />
              </Row>
              <Row>
                <Chip
                  label="Vibrate 1s"
                  onPress={() => Vibration.vibrate(1000)}
                  palette={palette}
                />
                <Chip
                  label="Vibrate 3s"
                  onPress={() => Vibration.vibrate(3000)}
                  palette={palette}
                />
                <Chip
                  label="Pattern"
                  onPress={() => Vibration.vibrate([0, 200, 100, 200, 100, 400])}
                  palette={palette}
                />
              </Row>
            </Section>

            <Section title="Knobs" titleColor={palette.ink}>
              <View style={styles.palettePicker}>
                <Text weight="medium" style={[styles.palettePickerLabel, { color: palette.ink }]}>
                  Palettes
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.palettePickerScroll}
                  contentContainerStyle={styles.palettePickerRow}
                >
                  {PLAYGROUND_PALETTES.map((p) => (
                    <Chip
                      key={p.key}
                      label={p.name}
                      selected={p.key === paletteKey}
                      onPress={() => setPaletteKey(p.key)}
                      palette={palette}
                    />
                  ))}
                </ScrollView>
              </View>
              <Row>
                <Chip
                  label={`Players: ${playersRemaining.toLocaleString()}`}
                  onPress={() => setPlayersRemaining(nextPlayers(playersRemaining))}
                  palette={palette}
                />
              </Row>
              <Row>
                <Chip
                  label="Reset"
                  onPress={() => reset(setSelectedRealOption, setPlayersRemaining)}
                  palette={palette}
                />
              </Row>
              <Row>
                <Chip
                  label="Open Onboarding"
                  onPress={() => setShowOnboarding(true)}
                  palette={palette}
                />
              </Row>
            </Section>

            <Section title="Actual Components" titleColor={palette.ink}>
              <Card>
                <Text weight="bold" style={{ fontSize: TYPOGRAPHY.SUBTITLE }}>
                  Lottie Football Animation
                </Text>
                <View style={{ height: SPACING.MD }} />
                <View style={{ alignItems: 'center' }}>
                  <LottieView
                    source={footballAnimation}
                    autoPlay
                    loop
                    style={{ width: 120, height: 120 }}
                    colorFilters={colorFilters}
                  />
                  <Text style={{ color: palette.ink, marginTop: SPACING.SM, textAlign: 'center' }}>
                    Ball: Primary • Laces: Energy
                  </Text>
                </View>
              </Card>

              <Card>
                <Text weight="bold" style={{ fontSize: TYPOGRAPHY.SUBTITLE }}>
                  Rolling Football Animation (SVG + Reanimated)
                </Text>
                <View style={{ height: 100, overflow: 'hidden', position: 'relative' }}>
                  <RollingFootball />
                </View>
                <Text style={{ color: palette.ink, marginTop: SPACING.SM, textAlign: 'center' }}>
                  Pure SVG animation - No assets required
                </Text>
              </Card>

              <ContestListTicket
                title="Sunday Showdown"
                startLabel="12/29 @ 7PM EST"
                priceLabel="$5.00"
                roundLabel="1"
                live
                buttonLabel="Register"
                buttonVariant="primary"
                cutoutBackgroundColor={palette.bg}
                onPress={() => {}}
              />

              <ContestStatsCard numberOfRemainingPlayers={playersRemaining} roundNumber={5} />
            </Section>

            <Section title="Scorebug" titleColor={palette.ink}>
              <View style={styles.scorebugWrap}>
                <Scorebug playerCount={playersRemaining} />
              </View>
            </Section>

            <Section title="Contest Stats Card" titleColor={palette.ink}>
              <Row>
                <Chip
                  label="Success"
                  onPress={() => setStatsVariant('success')}
                  palette={palette}
                />
                <Chip
                  label="Eliminated"
                  onPress={() => setStatsVariant('eliminated')}
                  palette={palette}
                />
              </Row>
              <ContestStatsCard
                numberOfRemainingPlayers={playersRemaining}
                roundNumber={3}
                variant={statsVariant}
              />
            </Section>

            <Section title="Correct Screen Header" titleColor={palette.ink}>
              <Row>
                <Chip
                  label="Replay Animation"
                  onPress={() => setCheckmarkKey((k) => k + 1)}
                  palette={palette}
                />
              </Row>
              <CorrectAnimation key={checkmarkKey} color={theme.colors.success} />
            </Section>

            <Section title="Answer Distribution" titleColor={palette.ink}>
              <Row>
                <Chip
                  label="Submitted"
                  onPress={() => setChartState('submitted')}
                  palette={palette}
                />
                <Chip label="Correct" onPress={() => setChartState('correct')} palette={palette} />
                <Chip
                  label="Eliminated"
                  onPress={() => setChartState('eliminated')}
                  palette={palette}
                />
                <Chip label="Replay" onPress={() => setChartKey((k) => k + 1)} palette={palette} />
              </Row>

              <AnswerDistributionChart
                key={chartKey}
                distribution={[
                  { option: 'A', label: 'Go for it', count: 523 },
                  { option: 'B', label: 'Punt', count: 312 },
                  { option: 'C', label: 'Kick FG', count: 487 },
                  { option: 'D', label: 'Fake punt', count: 160 },
                ]}
                correctAnswer={chartState === 'submitted' ? null : 'C'}
                userAnswer={chartState === 'submitted' ? 'B' : chartState === 'correct' ? 'C' : 'A'}
              />
            </Section>

            <Section title="AnswerOption (real)" titleColor={palette.ink}>
              <View style={styles.optionsWrap}>
                {[
                  { key: 'A', label: 'Home team' },
                  { key: 'B', label: 'Away team' },
                  { key: 'C', label: 'No score' },
                ].map((o) => (
                  <AnswerOption
                    key={o.key}
                    label={o.label}
                    iconText={o.key}
                    selected={selectedRealOption === o.key}
                    onPress={() => setSelectedRealOption(o.key)}
                  />
                ))}
              </View>
            </Section>

            <Section title="GIF Punctuation" titleColor={palette.ink}>
              <View style={styles.gifRow}>
                <View
                  style={[
                    styles.gifBadge,
                    {
                      backgroundColor: withAlpha(palette.ink, 0.1),
                      borderColor: withAlpha(palette.ink, 0.12),
                    },
                  ]}
                >
                  <Image source={footballGifs[gifIndex]?.source} style={styles.gif} />
                </View>
                <View style={styles.gifCopy}>
                  <Text weight="bold" style={[styles.gifTitle, { color: palette.ink }]}>
                    Use as status, not decoration
                  </Text>
                  <Text style={[styles.gifText, { color: withAlpha(palette.ink, 0.65) }]}>
                    Loop on suspense states; do one-shot on results; dock into a chip after “Lock
                    In”.
                  </Text>
                </View>
              </View>
            </Section>

            <Section title="Spacing" titleColor={palette.ink}>
              <Card>
                <Text weight="bold">SPACING scale</Text>
                <View style={{ height: SPACING.XS }} />
                <View style={[styles.spacingBar, { height: SPACING.XS }]} />
                <View style={{ height: SPACING.SM }} />
                <View style={[styles.spacingBar, { height: SPACING.SM }]} />
                <View style={{ height: SPACING.MD }} />
                <View style={[styles.spacingBar, { height: SPACING.MD }]} />
                <View style={{ height: SPACING.LG }} />
                <View style={[styles.spacingBar, { height: SPACING.LG }]} />
              </Card>
            </Section>

            <Section title="Typography" titleColor={palette.ink}>
              <Card>
                <Text weight="bold" style={{ fontSize: TYPOGRAPHY.TITLE }}>
                  Title / {TYPOGRAPHY.TITLE}
                </Text>
                <Text weight="medium" style={{ fontSize: TYPOGRAPHY.SUBTITLE }}>
                  Subtitle / {TYPOGRAPHY.SUBTITLE}
                </Text>
                <Text style={{ fontSize: TYPOGRAPHY.BODY }}>
                  Body / {TYPOGRAPHY.BODY} — The quick brown fox jumps over the lazy dog.
                </Text>
                <Text style={{ fontSize: TYPOGRAPHY.SMALL }}>
                  Small / {TYPOGRAPHY.SMALL} — Secondary caption text.
                </Text>
              </Card>
            </Section>
          </ScrollView>

          <OnboardingModal
            visible={showOnboarding}
            onComplete={() => {
              setShowOnboarding(false);
              return Promise.resolve(true);
            }}
            onDismiss={() => setShowOnboarding(false)}
          />
        </View>
      </ThemeProvider>
    </SafeAreaView>
  );
};

function reset(
  setSelectedOption: React.Dispatch<React.SetStateAction<string | null>>,
  setPlayersRemaining: React.Dispatch<React.SetStateAction<number>>,
) {
  setSelectedOption(null);
  setPlayersRemaining(1482);
}

function nextPlayers(current: number): number {
  const stops = [1482, 612, 103, 12, 1];
  const index = stops.indexOf(current);
  return stops[(index + 1) % stops.length] ?? 1482;
}

const Section = ({
  title,
  children,
  titleColor,
}: {
  title: string;
  children: React.ReactNode;
  titleColor?: string;
}) => {
  return (
    <View style={styles.section}>
      <Text weight="bold" style={[styles.sectionTitle, titleColor ? { color: titleColor } : null]}>
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
};

const Row = ({ children }: { children: React.ReactNode }) => {
  return <View style={styles.row}>{children}</View>;
};

const Chip = ({
  label,
  onPress,
  palette,
  selected,
}: {
  label: string;
  onPress: () => void;
  palette: PlaygroundPalette;
  selected?: boolean;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: withAlpha(palette.surface, 0.72),
          borderColor: withAlpha(palette.ink, 0.1),
        },
        selected && {
          backgroundColor: withAlpha(palette.energy, 0.16),
          borderColor: withAlpha(palette.energy, 0.4),
        },
        pressed && styles.pressed,
      ]}
    >
      <Text
        weight="medium"
        style={[styles.chipText, { color: palette.ink }, selected && { color: palette.ink }]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  noiseImage: {
    transform: [{ scale: 1.15 }],
  },
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XXL,
  },

  scorebugWrap: {
    marginBottom: SPACING.LG,
  },

  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    color: COLORS.PRIMARY_DARK,
    marginBottom: SPACING.SM,
  },
  sectionBody: {
    gap: SPACING.SM,
  },

  palettePicker: {
    gap: 10,
  },
  palettePickerLabel: {
    fontSize: 13,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.9,
  },
  palettePickerRow: {
    gap: 10,
    paddingHorizontal: SPACING.MD,
  },
  palettePickerScroll: {
    marginHorizontal: -SPACING.MD,
  },

  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(53,74,87,0.10)',
  },
  chipText: {
    fontSize: 13,
    color: COLORS.PRIMARY_DARK,
  },

  ticketWrap: {
    borderRadius: RADIUS.LG,
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(53,74,87,0.10)',
  },
  ticketTint: {
    ...StyleSheet.absoluteFillObject,
  },
  ticketTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  ticketTextureLine: {
    position: 'absolute',
    left: -40,
    right: -40,
    height: 10,
    transform: [{ rotate: '-16deg' }],
    backgroundColor: 'rgba(53,74,87,0.05)',
  },
  ticketCutoutLeft: {
    position: 'absolute',
    left: -10,
    top: 74,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.BACKGROUND,
  },
  ticketCutoutRight: {
    position: 'absolute',
    right: -10,
    top: 74,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.BACKGROUND,
  },
  ticketPerforation: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 84,
    borderTopWidth: 1,
    borderTopColor: 'rgba(53,74,87,0.16)',
    borderStyle: 'dashed',
  },
  ticketContent: {
    padding: SPACING.LG,
  },
  cardTitle: {
    fontSize: 20,
    color: COLORS.PRIMARY_DARK,
  },
  cardSubtitle: {
    marginTop: 6,
    color: COLORS.MUTED,
  },

  energyTrack: {
    height: 14,
    width: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(53,74,87,0.10)',
    overflow: 'hidden',
  },
  energyFill: {
    height: '100%',
    borderRadius: 999,
  },

  sheenBtnWrap: {
    width: '100%',
  },
  sheenBtn: {
    width: '100%',
    paddingVertical: SPACING.SM + 4,
    borderRadius: RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: COLORS.PRIMARY_DARK,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 3,
  },
  sheenSweep: {
    position: 'absolute',
    top: -30,
    bottom: -30,
    width: 70,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '18deg' }],
  },
  sheenLabel: {
    fontSize: TYPOGRAPHY.BODY,
    color: '#fff',
    letterSpacing: 0.5,
  },

  optionsWrap: {
    gap: SPACING.SM,
  },
  moveRow: {
    width: '100%',
    borderRadius: RADIUS.LG,
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(53,74,87,0.10)',
    paddingVertical: SPACING.SM + 2,
    paddingHorizontal: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  moveRowSelected: {
    borderColor: 'rgba(53,74,87,0.25)',
  },
  moveStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
  },
  moveIconCapsule: {
    marginLeft: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(53,74,87,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(53,74,87,0.10)',
  },
  moveIconCapsuleSelected: {
    backgroundColor: 'rgba(95,140,120,0.16)',
    borderColor: 'rgba(95,140,120,0.25)',
  },
  moveIconText: {
    fontSize: 12,
    letterSpacing: 0.8,
    color: COLORS.PRIMARY_DARK,
  },
  moveIconTextSelected: {
    color: COLORS.PRIMARY_DARK,
  },
  moveCopy: {
    flex: 1,
    paddingHorizontal: SPACING.SM,
  },
  moveLabel: {
    color: COLORS.PRIMARY_DARK,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(53,74,87,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: 'rgba(53,74,87,0.45)',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  radioInnerSelected: {
    backgroundColor: COLORS.PRIMARY_DARK,
  },

  gifRow: {
    flexDirection: 'row',
    gap: SPACING.MD,
    alignItems: 'center',
  },
  gifBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(53,74,87,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(53,74,87,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gif: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  gifCopy: {
    flex: 1,
  },
  gifTitle: {
    color: COLORS.PRIMARY_DARK,
  },
  gifText: {
    marginTop: 4,
    color: COLORS.MUTED,
    fontSize: TYPOGRAPHY.SMALL,
    lineHeight: 18,
  },

  pressed: {
    opacity: 0.9,
  },
  spacingBar: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  eliminatedPreview: {
    padding: SPACING.LG,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Lobby Preview Styles
  lobbyPreviewContainer: {
    height: 400,
    borderRadius: RADIUS.XL,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(53,74,87,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lobbyContent: {
    alignItems: 'center',
    gap: SPACING.XL,
    zIndex: 10,
    width: '100%',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 100,
    gap: 8,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lockedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
});

export default PlaygroundScreen;
