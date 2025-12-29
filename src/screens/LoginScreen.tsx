import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ROUTES } from '../configs/routes';
import { useAuth } from '../logic/hooks/useAuth';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import Header from '../ui/components/AppHeader';
import Button from '../ui/components/Button';
import Text from '../ui/components/Text';
import { SPACING, TYPOGRAPHY, useTheme } from '../ui/theme';

const LoginScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session, loginWithGoogle, loginWithApple, loading, error } = useAuth();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session && !loading) {
      router.replace(ROUTES.CONTESTS);
    }
  }, [session, loading, router]);

  const handleGoogle = () => {
    setMessage('Opening Google login…');
    void loginWithGoogle();
  };

  const handleApple = () => {
    setMessage('Opening Apple login…');
    void loginWithApple();
  };

  return (
    <View style={styles.screen}>
      <Header user={null} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + SPACING.XXL }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text weight="bold" style={styles.title}>
            Welcome!
          </Text>
          <Text weight="medium" style={styles.subtitle}>
            Sign in to continue.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.appleButtonContainer}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={8}
              style={styles.appleButton}
              onPress={handleApple}
            />
          </View>

          <View style={styles.buttonWrapper}>
            <Button
              label="Continue with Google"
              onPress={handleGoogle}
              disabled={loading}
              variant="secondary"
            />
          </View>

          {error ? (
            <Text style={styles.errorText} weight="medium">
              {error}
            </Text>
          ) : null}
          {message && !error ? (
            <Text style={styles.message} weight="medium">
              {message}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: {
  background: string;
  ink: string;
  muted: string;
  primary: string;
}) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: SPACING.XXL,
      paddingHorizontal: SPACING.LG,
      alignItems: 'center',
    },
    hero: {
      alignItems: 'center',
      marginBottom: SPACING.XL,
    },
    title: {
      fontSize: 32,
      textAlign: 'center',
      color: colors.ink,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: TYPOGRAPHY.SUBTITLE,
      color: colors.muted,
      textAlign: 'center',
    },
    form: {
      width: '100%',
      maxWidth: 360,
      alignItems: 'center',
    },
    appleButtonContainer: {
      width: '100%',
      marginBottom: SPACING.SM,
    },
    appleButton: {
      width: '100%',
      height: 50,
    },
    buttonWrapper: {
      width: '100%',
      marginBottom: SPACING.SM,
    },
    errorText: {
      color: '#DC2626',
      width: '100%',
      maxWidth: 360,
      textAlign: 'center',
      marginTop: SPACING.SM,
    },
    message: {
      color: colors.primary,
      width: '100%',
      maxWidth: 360,
      textAlign: 'center',
      marginTop: SPACING.SM,
    },
  });

export default LoginScreen;
