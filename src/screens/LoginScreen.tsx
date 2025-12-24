import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ROUTES } from '../configs/routes';
import { useAuth } from '../logic/hooks/useAuth';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import Button from '../ui/Button';
import Text from '../ui/Text';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../ui/theme';
import Header from '../ui/AppHeader';

const LoginScreen = () => {
  const { session, loginWithGoogle, sendEmailOtp, verifyEmailOtp, loading, error } = useAuth();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) {
      router.replace(ROUTES.CONTESTS);
    }
  }, [loading, session, router]);

  const handleGoogle = () => {
    setMessage('Opening Google login…');
    void loginWithGoogle();
  };

  const handleEmailOtp = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email.');
      return;
    }
    setSending(true);
    setMessage(null);
    await sendEmailOtp(email.trim());
    setSending(false);
    setOtpSent(true);
    setMessage('Check your email for the code.');
  };

  const handleVerifyOtp = async () => {
    if (!email.trim() || !otp.trim()) {
      setMessage('Enter your email and the code we sent.');
      return;
    }
    setVerifying(true);
    setMessage(null);
    await verifyEmailOtp(email.trim(), otp.trim());
    setVerifying(false);
  };

  return (
    <View style={styles.screen}>
      <Header user={null} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={headerHeight}
      >
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
            <Pressable
              style={({ pressed }) => [styles.googleButton, pressed && styles.googlePressed]}
              onPress={handleGoogle}
              disabled={loading || sending || verifying}
            >
              <Text weight="bold" style={styles.googleLabel}>
                Continue with Google
              </Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.field}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.75)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!sending && !verifying}
              />
            </View>

            {otpSent && (
              <View style={styles.field}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter code"
                  placeholderTextColor="rgba(255,255,255,0.75)"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  editable={!verifying}
                />
              </View>
            )}

            {error ? (
              <Text style={styles.errorText} weight="medium">
                {error}
              </Text>
            ) : null}
            {message ? (
              <Text style={styles.message} weight="medium">
                {message}
              </Text>
            ) : null}

            <View style={styles.buttons}>
              <View style={styles.buttonWrapper}>
                <Button
                  label={otpSent ? 'Resend Email OTP' : 'Send Email OTP'}
                  onPress={() => void handleEmailOtp()}
                  disabled={loading || sending}
                />
              </View>
              {otpSent && (
                <View style={styles.buttonWrapper}>
                  <Button
                    variant="secondary"
                    label="Verify Email OTP"
                    onPress={() => void handleVerifyOtp()}
                    disabled={loading || verifying}
                  />
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  flex: {
    flex: 1,
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
    color: COLORS.PRIMARY_DARK,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    color: COLORS.MUTED,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  googleButton: {
    width: 320,
    height: 56,
    backgroundColor: '#608ce5',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#507ac5',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 10,
    marginBottom: SPACING.SM,
  },
  googlePressed: {
    backgroundColor: '#507ac5',
  },
  googleLabel: {
    color: '#F3F4F6',
    fontSize: 18,
  },
  divider: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.SM,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#C7CED4',
  },
  dividerText: {
    color: '#4B5563',
    marginHorizontal: SPACING.XS,
  },
  field: {
    width: '100%',
    maxWidth: 360,
    marginBottom: SPACING.SM,
  },
  input: {
    width: '100%',
    height: 64,
    borderRadius: RADIUS.SM,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: SPACING.MD,
    backgroundColor: '#54627B',
    color: '#F8FAFC',
    fontSize: TYPOGRAPHY.BODY,
  },
  errorText: {
    color: '#DC2626',
    width: '100%',
    maxWidth: 360,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  message: {
    color: COLORS.PRIMARY,
    width: '100%',
    maxWidth: 360,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  buttons: {
    width: '100%',
    maxWidth: 360,
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: SPACING.SM,
  },
});

export default LoginScreen;
