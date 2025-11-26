import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ImageBackground, TextInput } from 'react-native';
import { useAuth } from '../logic/auth/useAuth';
import Text from '../ui/primitives/Text';
import Button from '../ui/primitives/Button';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../ui/theme';

const LoginScreen = () => {
  const { loginWithGoogle, sendEmailOtp, verifyEmailOtp, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGoogle = () => {
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

  const heroGradient = useMemo(
    () => ({
      backgroundColor: COLORS.PRIMARY_DARK,
    }),
    [],
  );

  return (
    <ImageBackground style={styles.container} source={undefined} resizeMode="cover">
      <View style={styles.header}>
        <View style={[styles.hero, heroGradient]}>
          <Text weight="bold" style={styles.heroText}>
            SBHQ
          </Text>
          <Text style={styles.heroSubtext}>Live sports-prop contests</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text weight="bold" style={styles.title}>
          Login
        </Text>
        {error ? (
          <Text style={styles.error} weight="medium">
            {error}
          </Text>
        ) : null}
        {message ? (
          <Text style={styles.message} weight="medium">
            {message}
          </Text>
        ) : null}
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="Email"
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
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              editable={!verifying}
            />
          </View>
        )}
        <View style={styles.buttons}>
          <Button label="Continue with Google" onPress={handleGoogle} disabled={loading || sending || verifying} />
          <View style={styles.spacer} />
          <Button label={otpSent ? 'Resend Email OTP' : 'Send Email OTP'} onPress={() => void handleEmailOtp()} disabled={loading || sending} />
          {otpSent && (
            <>
              <View style={styles.spacer} />
              <Button variant="secondary" label="Verify Email OTP" onPress={() => void handleVerifyOtp()} disabled={loading || verifying} />
            </>
          )}
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.XL,
  },
  header: {
    marginBottom: SPACING.LG,
  },
  hero: {
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
  },
  heroText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.TITLE,
  },
  heroSubtext: {
    color: '#E5E7EB',
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    shadowColor: COLORS.PRIMARY_DARK,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    fontSize: TYPOGRAPHY.TITLE,
    marginBottom: SPACING.SM,
  },
  buttons: {
    width: '100%',
    marginTop: SPACING.SM,
  },
  spacer: {
    height: SPACING.SM,
  },
  error: {
    color: '#DC2626',
    marginBottom: SPACING.SM,
  },
  message: {
    color: COLORS.PRIMARY_DARK,
    marginBottom: SPACING.SM,
  },
  field: {
    width: '100%',
    marginBottom: SPACING.SM,
  },
  input: {
    width: '100%',
    borderRadius: RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    backgroundColor: COLORS.SURFACE,
    fontSize: TYPOGRAPHY.BODY,
  },
});

export default LoginScreen;
