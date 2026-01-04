import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, type TextStyle } from 'react-native';

import Text, { type TextProps } from './Text';

type WordSafeTextProps = Omit<TextProps, 'children'> & {
  text: string;
  minFontSize?: number;
  step?: number;
};

type TextLine = { text: string };

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const hasSplitWord = (lines: TextLine[], words: string[]) => {
  if (words.length === 0) return false;

  let wordIndex = 0;

  for (const line of lines) {
    const lineText = line.text.trim();
    if (!lineText) continue;

    const lineWords = lineText.split(/\s+/).filter(Boolean);
    const expected = words.slice(wordIndex, wordIndex + lineWords.length);

    if (expected.length !== lineWords.length) {
      return true;
    }

    for (let i = 0; i < lineWords.length; i += 1) {
      if (lineWords[i] !== expected[i]) {
        return true;
      }
    }

    wordIndex += lineWords.length;
  }

  return false;
};

const WordSafeText = ({ text, style, minFontSize = 10, step = 1, ...rest }: WordSafeTextProps) => {
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
  const baseFontSize = typeof flattened?.fontSize === 'number' ? flattened.fontSize : undefined;
  const baseLineHeight =
    typeof flattened?.lineHeight === 'number' ? flattened.lineHeight : undefined;

  const normalizedText = useMemo(() => normalizeText(text), [text]);
  const words = useMemo(
    () => (normalizedText.length > 0 ? normalizedText.split(' ').filter(Boolean) : []),
    [normalizedText],
  );

  const [fontSize, setFontSize] = useState(baseFontSize);

  useEffect(() => {
    if (typeof baseFontSize === 'number') {
      setFontSize(baseFontSize);
    }
  }, [baseFontSize, normalizedText]);

  const lineHeight = useMemo(() => {
    if (typeof fontSize !== 'number') return undefined;
    const ratio =
      typeof baseFontSize === 'number' && typeof baseLineHeight === 'number' && baseFontSize > 0
        ? baseLineHeight / baseFontSize
        : 1.2;
    return Math.round(fontSize * ratio);
  }, [fontSize, baseFontSize, baseLineHeight]);

  const handleTextLayout = useCallback(
    (event: { nativeEvent: { lines: TextLine[] } }) => {
      if (typeof fontSize !== 'number' || fontSize <= minFontSize) {
        return;
      }

      const lines = event.nativeEvent.lines ?? [];
      if (!hasSplitWord(lines, words)) {
        return;
      }

      setFontSize((prev) => (typeof prev === 'number' ? Math.max(prev - step, minFontSize) : prev));
    },
    [fontSize, minFontSize, step, words],
  );

  return (
    <Text
      {...rest}
      onTextLayout={handleTextLayout}
      style={[
        style,
        typeof fontSize === 'number' ? { fontSize } : null,
        lineHeight ? { lineHeight } : null,
      ]}
    >
      {normalizedText}
    </Text>
  );
};

export default WordSafeText;
