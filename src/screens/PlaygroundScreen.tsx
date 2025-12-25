import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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

import AnswerOption from '../ui/components/AnswerOption';
import AnswerSummaryCard from '../ui/components/AnswerSummaryCard';
import Button from '../ui/components/Button';
import Card from '../ui/components/Card';
import ContestListTicket from '../ui/components/ContestListTicket';
import ContestStatsCard from '../ui/components/ContestStatsCard';
import Countdown from '../ui/components/Countdown';
import Text from '../ui/components/Text';
import {
  DEFAULT_PALETTE,
  PLAYGROUND_PALETTES,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  ThemeProvider,
  isDarkHex,
  textOnHex,
  themeFromPlaygroundPalette,
  withAlpha,
  type PlaygroundPalette,
} from '../ui/theme';

// Use DEFAULT_PALETTE for static styles in playground (not a production screen)
const COLORS = {
  PRIMARY_DARK: DEFAULT_PALETTE.ink,
  BACKGROUND: DEFAULT_PALETTE.bg,
  MUTED: DEFAULT_PALETTE.ink, // Will use with alpha in styles
  SURFACE: DEFAULT_PALETTE.surface,
} as const;

type Phase = 'OPEN' | 'LOCKED' | 'REVEAL' | 'RESULT';

const PHASES: Phase[] = ['OPEN', 'LOCKED', 'REVEAL', 'RESULT'];

const footballGifs: Array<{ label: string; source: ImageSourcePropType }> = [
  { label: 'ball.gif', source: require('../../assets/gifs/ball.gif') },
  { label: 'catch_nobg.gif', source: require('../../assets/gifs/catch_nobg.gif') },
];

const noiseTexture = require('../../assets/noise.png');

const PlaygroundScreen = () => {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('OPEN');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedRealOption, setSelectedRealOption] = useState<string | null>('A');
  const [pressure, setPressure] = useState(0.25);
  const [playersRemaining, setPlayersRemaining] = useState(1482);
  const [streak, setStreak] = useState(3);
  const [gifIndex, setGifIndex] = useState(0);
  const [paletteKey, setPaletteKey] = useState<string>(PLAYGROUND_PALETTES[0]?.key ?? 'current');

  const palette: PlaygroundPalette = useMemo(() => {
    const found = PLAYGROUND_PALETTES.find((p) => p.key === paletteKey);
    return found?.palette ?? PLAYGROUND_PALETTES[0]?.palette ?? PLAYGROUND_PALETTES[0].palette;
  }, [paletteKey]);

  useEffect(() => {
    if (!__DEV__) {
      router.replace('/');
    }
  }, [router]);

  const optionData = useMemo(
    () => [
      { key: 'A', label: 'Go for it on 4th & 2', iconText: '4TH' },
      { key: 'B', label: 'Punt and pin them deep', iconText: 'PNT' },
      { key: 'C', label: 'Kick the FG', iconText: 'FG' },
      { key: 'D', label: 'Fake punt', iconText: 'FAKE' },
    ],
    [],
  );

  const darkTheme = useMemo(() => isDarkHex(palette.bg), [palette.bg]);
  const noiseOpacity = darkTheme ? 0.08 : 0.03;
  const noiseBlur = darkTheme ? 0 : 1;
  const noiseResizeMode = Platform.OS === 'ios' ? 'repeat' : 'cover';

  const countdownTargetRef = useRef<number>(Date.now() + 24_000);

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
            <ScorebugHeader
              phase={phase}
              pressure={pressure}
              playersRemaining={playersRemaining}
              streak={streak}
              gif={footballGifs[gifIndex]?.source}
              palette={palette}
            />

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
                  label={`Phase: ${phase}`}
                  onPress={() => setPhase(nextPhase(phase))}
                  palette={palette}
                />
                <Chip
                  label={`Players: ${playersRemaining.toLocaleString()}`}
                  onPress={() => setPlayersRemaining(nextPlayers(playersRemaining))}
                  palette={palette}
                />
              </Row>
              <Row>
                <Chip
                  label={`Pressure: ${Math.round(pressure * 100)}%`}
                  onPress={() => setPressure(nextPressure(pressure))}
                  palette={palette}
                />
                <Chip
                  label={`Streak: ${streak}`}
                  onPress={() => setStreak((s) => (s >= 5 ? 0 : s + 1))}
                  palette={palette}
                />
              </Row>
              <Row>
                <Chip
                  label={`GIF: ${footballGifs[gifIndex]?.label ?? 'none'}`}
                  onPress={() => setGifIndex((i) => (i + 1) % footballGifs.length)}
                  palette={palette}
                />
                <Chip
                  label="Reset"
                  onPress={() =>
                    reset(setPhase, setSelectedOption, setPressure, setPlayersRemaining, setStreak)
                  }
                  palette={palette}
                />
              </Row>
            </Section>

            <Section title="Actual Components" titleColor={palette.ink}>
              <Card>
                <Text weight="bold" style={{ fontSize: TYPOGRAPHY.SUBTITLE }}>
                  Card + Button + Countdown
                </Text>
                <View style={{ height: SPACING.SM }} />
                <Countdown targetTime={countdownTargetRef.current} />
                <View style={{ height: SPACING.MD }} />
                <Button label="Primary CTA" onPress={() => setPhase(nextPhase(phase))} />
                <View style={{ height: SPACING.SM }} />
                <Button
                  label="Secondary"
                  variant="secondary"
                  onPress={() => setStreak((s) => s + 1)}
                />
              </Card>

              <ContestListTicket
                title="Sunday Showdown"
                startLabel="12/29 @ 7PM EST"
                priceLabel="$5.00"
                roundLabel={phase === 'RESULT' ? 'Final' : '1'}
                live
                buttonLabel={phase === 'OPEN' ? 'Register' : 'Join Contest'}
                buttonVariant={phase === 'OPEN' ? 'primary' : 'success'}
                buttonDisabled={phase === 'LOCKED'}
                cutoutBackgroundColor={palette.bg}
                onPress={() => setPhase(nextPhase(phase))}
              />

              <ContestStatsCard
                numberOfRemainingPlayers={playersRemaining}
                roundNumber={Math.max(1, Math.min(99, streak))}
              />

              <AnswerSummaryCard
                header="Round Recap"
                roundLabel="Live"
                question="Which team scores first?"
                selectedAnswer={selectedRealOption ?? '—'}
                correctAnswer={phase === 'RESULT' ? 'A' : null}
              />

              <Card>
                <Text weight="bold" style={{ fontSize: TYPOGRAPHY.SUBTITLE }}>
                  AnswerOption (real)
                </Text>
                <View style={{ height: SPACING.SM }} />
                {[
                  { key: 'A', label: 'A) Home team' },
                  { key: 'B', label: 'B) Away team' },
                  { key: 'C', label: 'C) No score' },
                ].map((o) => (
                  <AnswerOption
                    key={o.key}
                    label={o.label}
                    selected={selectedRealOption === o.key}
                    onPress={() => setSelectedRealOption(o.key)}
                  />
                ))}
              </Card>
            </Section>

            <Section title="Ticket Card" titleColor={palette.ink}>
              <TicketCard palette={palette}>
                <Text weight="bold" style={[styles.cardTitle, { color: palette.ink }]}>
                  Sunday Showdown
                </Text>
                <Text style={[styles.cardSubtitle, { color: withAlpha(palette.ink, 0.65) }]}>
                  “Ticket” container with perforation + tint + texture.
                </Text>
                <View style={{ height: SPACING.MD }} />
                <EnergyBar value={pressure} palette={palette} />
                <View style={{ height: SPACING.MD }} />
                <SheenButton
                  label={phase === 'OPEN' ? 'Lock In' : 'Continue'}
                  onPress={() => setPhase(nextPhase(phase))}
                  palette={palette}
                />
              </TicketCard>
            </Section>

            <Section title="Option Rows" titleColor={palette.ink}>
              <View style={styles.optionsWrap}>
                {optionData.map((option) => (
                  <MoveOptionRow
                    key={option.key}
                    label={option.label}
                    iconText={option.iconText}
                    selected={selectedOption === option.key}
                    onPress={() => setSelectedOption(option.key)}
                    palette={palette}
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
        </View>
      </ThemeProvider>
    </SafeAreaView>
  );
};

function reset(
  setPhase: React.Dispatch<React.SetStateAction<Phase>>,
  setSelectedOption: React.Dispatch<React.SetStateAction<string | null>>,
  setPressure: React.Dispatch<React.SetStateAction<number>>,
  setPlayersRemaining: React.Dispatch<React.SetStateAction<number>>,
  setStreak: React.Dispatch<React.SetStateAction<number>>,
) {
  setPhase('OPEN');
  setSelectedOption(null);
  setPressure(0.25);
  setPlayersRemaining(1482);
  setStreak(3);
}

function nextPhase(phase: Phase): Phase {
  const index = PHASES.indexOf(phase);
  return PHASES[(index + 1) % PHASES.length] ?? 'OPEN';
}

function nextPressure(value: number): number {
  const stops = [0.15, 0.35, 0.55, 0.8, 0.95];
  const next = stops.find((s) => s > value);
  return next ?? stops[0] ?? 0.25;
}

function nextPlayers(current: number): number {
  const stops = [1482, 612, 103, 12, 1];
  const index = stops.indexOf(current);
  return stops[(index + 1) % stops.length] ?? 1482;
}

const ScorebugHeader = ({
  phase,
  pressure,
  playersRemaining,
  streak,
  gif,
  palette,
}: {
  phase: Phase;
  pressure: number;
  playersRemaining: number;
  streak: number;
  gif?: ImageSourcePropType;
  palette: PlaygroundPalette;
}) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const dotScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const dotOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  const darkTheme = isDarkHex(palette.bg);
  const hudBg = darkTheme ? palette.surface : palette.ink;
  const hudText = darkTheme ? palette.ink : '#FFFFFF';

  const danger = pressure >= 0.8;
  const timerBg = danger ? palette.danger : palette.energy;
  const timerTextColor = textOnHex(timerBg);

  return (
    <View style={styles.scorebugWrap}>
      <View style={[styles.scorebugBar, { backgroundColor: hudBg }]}>
        <View style={styles.scorebugLeft}>
          <View style={styles.livePill}>
            <Animated.View
              style={[styles.liveDot, { transform: [{ scale: dotScale }], opacity: dotOpacity }]}
            />
            <Text weight="bold" style={[styles.liveText, { color: hudText }]}>
              LIVE
            </Text>
          </View>
          <View style={[styles.timerPill, { backgroundColor: timerBg }]}>
            <Text weight="bold" style={[styles.timerText, { color: timerTextColor }]}>
              00:24
            </Text>
          </View>
        </View>

        <View style={styles.scorebugRight}>
          <View style={styles.miniPill}>
            <Text weight="medium" style={[styles.miniPillText, { color: hudText }]}>
              {playersRemaining.toLocaleString()} left
            </Text>
          </View>
          <View
            style={[
              styles.phasePill,
              { borderColor: withAlpha(darkTheme ? palette.ink : '#FFFFFF', 0.18) },
              phasePillStyle(phase, palette),
            ]}
          >
            <Text weight="bold" style={[styles.phaseText, { color: hudText }]}>
              {phase}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.scorebugSubRow}>
        <View style={styles.subLeft}>
          <View
            style={[
              styles.streakPill,
              {
                backgroundColor: withAlpha(palette.surface, 0.72),
                borderColor: withAlpha(palette.ink, 0.1),
              },
            ]}
          >
            <Text weight="bold" style={[styles.streakText, { color: palette.ink }]}>
              Streak {streak}
            </Text>
          </View>
        </View>
        <View style={styles.subRight}>
          <View
            style={[
              styles.gifChip,
              {
                backgroundColor: withAlpha(palette.surface, 0.72),
                borderColor: withAlpha(palette.ink, 0.1),
              },
            ]}
          >
            {gif ? <Image source={gif} style={styles.gifChipImg} /> : null}
            <Text weight="medium" style={[styles.gifChipText, { color: palette.ink }]}>
              Status
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

function phasePillStyle(phase: Phase, palette: PlaygroundPalette) {
  switch (phase) {
    case 'OPEN':
      return { backgroundColor: 'rgba(255,255,255,0.12)' } as const;
    case 'LOCKED':
      return { backgroundColor: withAlpha(palette.primary, 0.35) } as const;
    case 'REVEAL':
      return { backgroundColor: withAlpha(palette.energy, 0.35) } as const;
    case 'RESULT':
      return { backgroundColor: withAlpha(palette.warm, 0.35) } as const;
  }
}

const TicketCard = ({
  children,
  palette,
}: {
  children: React.ReactNode;
  palette: PlaygroundPalette;
}) => {
  return (
    <View
      style={[
        styles.ticketWrap,
        {
          backgroundColor: withAlpha(palette.surface, 0.72),
          borderColor: withAlpha(palette.ink, 0.1),
        },
      ]}
    >
      <LinearGradient
        colors={
          [
            withAlpha(palette.energy, 0.22),
            withAlpha(palette.ink, 0.06),
            'rgba(255,255,255,0)',
          ] as const
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ticketTint}
      />

      <View style={styles.ticketTexture}>
        {Array.from({ length: 10 }, (_, idx) => ({ key: `line-${idx}`, top: idx * 18 })).map(
          (line) => (
            <View
              key={line.key}
              style={[
                styles.ticketTextureLine,
                { top: line.top, backgroundColor: withAlpha(palette.ink, 0.05) },
              ]}
            />
          ),
        )}
      </View>

      <View style={[styles.ticketCutoutLeft, { backgroundColor: palette.bg }]} />
      <View style={[styles.ticketCutoutRight, { backgroundColor: palette.bg }]} />
      <View style={[styles.ticketPerforation, { borderTopColor: withAlpha(palette.ink, 0.16) }]} />

      <View style={styles.ticketContent}>{children}</View>
    </View>
  );
};

const EnergyBar = ({ value, palette }: { value: number; palette: PlaygroundPalette }) => {
  const clamped = Math.max(0, Math.min(1, value));
  const danger = clamped >= 0.8;
  const colors = danger
    ? ([palette.danger, palette.warm] as const)
    : ([palette.energy, palette.ink] as const);

  return (
    <View style={[styles.energyTrack, { backgroundColor: withAlpha(palette.ink, 0.1) }]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.energyFill, { width: `${Math.round(clamped * 100)}%` }]}
      />
    </View>
  );
};

const MoveOptionRow = ({
  label,
  iconText,
  selected,
  onPress,
  palette,
}: {
  label: string;
  iconText: string;
  selected?: boolean;
  onPress: () => void;
  palette: PlaygroundPalette;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.moveRow,
        {
          backgroundColor: withAlpha(palette.surface, 0.72),
          borderColor: withAlpha(palette.ink, 0.1),
        },
        selected && [styles.moveRowSelected, { borderColor: withAlpha(palette.energy, 0.42) }],
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={
          selected
            ? ([palette.energy, palette.ink] as const)
            : ([withAlpha(palette.ink, 0.18), withAlpha(palette.ink, 0.06)] as const)
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.moveStripe}
      />

      <View
        style={[
          styles.moveIconCapsule,
          {
            backgroundColor: withAlpha(palette.ink, 0.06),
            borderColor: withAlpha(palette.ink, 0.1),
          },
          selected && [
            styles.moveIconCapsuleSelected,
            {
              backgroundColor: withAlpha(palette.energy, 0.16),
              borderColor: withAlpha(palette.energy, 0.25),
            },
          ],
        ]}
      >
        <Text
          weight="bold"
          style={[
            styles.moveIconText,
            { color: palette.ink },
            selected && styles.moveIconTextSelected,
          ]}
        >
          {iconText}
        </Text>
      </View>

      <View style={styles.moveCopy}>
        <Text weight="medium" style={[styles.moveLabel, { color: palette.ink }]}>
          {label}
        </Text>
      </View>

      <View
        style={[
          styles.radioOuter,
          { borderColor: withAlpha(palette.ink, 0.2) },
          selected && [styles.radioOuterSelected, { borderColor: withAlpha(palette.ink, 0.45) }],
        ]}
      >
        <View
          style={[
            styles.radioInner,
            selected && [styles.radioInnerSelected, { backgroundColor: palette.ink }],
          ]}
        />
      </View>
    </Pressable>
  );
};

const SheenButton = ({
  label,
  onPress,
  palette,
}: {
  label: string;
  onPress: () => void;
  palette: PlaygroundPalette;
}) => {
  const sheen = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(sheen, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [sheen]);

  const translateX = sheen.interpolate({ inputRange: [0, 1], outputRange: [-120, 220] });
  const labelColor = textOnHex(palette.primary);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.sheenBtnWrap, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[palette.primary, palette.ink] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.sheenBtn, { shadowColor: palette.ink }]}
      >
        <Animated.View style={[styles.sheenSweep, { transform: [{ translateX }] }]} />
        <Text weight="bold" style={[styles.sheenLabel, { color: labelColor }]}>
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
};

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
  scorebugBar: {
    borderRadius: RADIUS.LG,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.PRIMARY_DARK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  scorebugLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scorebugRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4D',
  },
  liveText: {
    fontSize: 12,
    letterSpacing: 0.7,
    color: '#fff',
  },
  timerPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timerText: {
    fontSize: 12,
    letterSpacing: 0.7,
    color: '#fff',
  },
  miniPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  miniPillText: {
    fontSize: 12,
    color: '#fff',
  },
  phasePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  phaseText: {
    fontSize: 12,
    letterSpacing: 0.6,
    color: '#fff',
  },
  scorebugSubRow: {
    marginTop: SPACING.SM,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(53,74,87,0.10)',
  },
  streakText: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
  },
  gifChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(53,74,87,0.10)',
  },
  gifChipImg: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  gifChipText: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
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
});

export default PlaygroundScreen;
