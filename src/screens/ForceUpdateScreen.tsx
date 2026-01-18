import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import Button from '../ui/components/Button';
import Text from '../ui/components/Text';
import { SPACING, TYPOGRAPHY, useTheme } from '../ui/theme';

interface ForceUpdateScreenProps {
  message?: string | null;
}

const IOS_APP_STORE_ID = '6757280045';

const openStore = () => {
  const url = Platform.select({
    ios: `https://apps.apple.com/app/id${IOS_APP_STORE_ID}`,
    android: 'market://details?id=com.sbhq.mobile',
    default: '',
  });

  if (url) {
    void Linking.openURL(url);
  }
};

const ForceUpdateScreen = ({ message }: ForceUpdateScreenProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const displayMessage =
    message || 'A new version of the app is available. Please update to continue.';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="cloud-download-outline" size={80} color={colors.primary} />

        <Text weight="bold" style={styles.title}>
          Update Required
        </Text>

        <Text style={styles.message}>{displayMessage}</Text>

        <View style={styles.buttonContainer}>
          <Button label="Update Now" onPress={openStore} />
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: { background: string; text: string; muted: string }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.LG,
    },
    content: {
      alignItems: 'center',
      width: '100%',
      maxWidth: 400,
      paddingHorizontal: SPACING.MD,
    },
    title: {
      fontSize: TYPOGRAPHY.TITLE,
      color: colors.text,
      marginTop: SPACING.LG,
      textAlign: 'center',
    },
    message: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.muted,
      marginTop: SPACING.MD,
      textAlign: 'center',
      lineHeight: TYPOGRAPHY.BODY + 6,
    },
    buttonContainer: {
      width: '100%',
      marginTop: SPACING.XL,
    },
  });

export default ForceUpdateScreen;
