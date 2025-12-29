import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { useNotifications } from '../../logic/contexts';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import GlassyTexture from '../textures/GlassyTexture';
import Button from './Button';
import Text from './Text';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (username: string, phoneNumber: string) => Promise<boolean>;
  error?: string | null;
  /** Only works in __DEV__ mode - allows dismissing for testing in Playground */
  onDismiss?: () => void;
}

const formatPhoneNumber = (text: string): string => {
  // Strip all non-digits
  const digits = text.replace(/\D/g, '');

  // Limit to 10 digits
  const limited = digits.slice(0, 10);

  // Format as (XXX) XXX-XXXX
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
};

const getDigitsOnly = (formatted: string): string => {
  return formatted.replace(/\D/g, '');
};

const OnboardingModal = ({ visible, onComplete, error, onDismiss }: OnboardingModalProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { requestPermissions } = useNotifications();

  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneInputRef = useRef<TextInput>(null);

  const phoneDigits = useMemo(() => getDigitsOnly(phoneNumber), [phoneNumber]);

  const isPhoneValid = phoneDigits.length === 10;
  const isUsernameValid = username.trim().length >= 3;
  const isFormValid = isUsernameValid && isPhoneValid;

  const handlePhoneChange = useCallback((text: string) => {
    setPhoneNumber(formatPhoneNumber(text));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || isSubmitting) return;

    Keyboard.dismiss();
    setIsSubmitting(true);

    // Request notification permissions if user opted in
    if (enableNotifications) {
      await requestPermissions();
    }

    const success = await onComplete(username.trim(), phoneDigits);
    if (!success) {
      setIsSubmitting(false);
    }
  }, [isFormValid, isSubmitting, onComplete, username, phoneDigits, enableNotifications, requestPermissions]);

  const toggleNotifications = useCallback(() => {
    setEnableNotifications((prev) => !prev);
  }, []);

  const handleOverlayPress = useCallback(() => {
    Keyboard.dismiss();
    // Allow dismissing modal only in dev mode (for Playground testing)
    if (__DEV__ && onDismiss) {
      onDismiss();
    }
  }, [onDismiss]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <View style={styles.overlay}>
          {/* Dimming Background */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]} />

          <TouchableWithoutFeedback>
            <View style={styles.modalWrapper}>
              <GlassyTexture colors={colors} showShine={false} style={styles.modalGlass}>
                <View style={styles.content}>
                  {/* Header */}
                  <View style={styles.header}>
                    <Ionicons name="trophy" size={32} color={colors.energy} />
                    <View style={styles.headerText}>
                      <Text style={styles.title}>Create Your Profile</Text>
                      <Text style={styles.subtitle}>
                        Choose a username and provide your phone number to get started.
                      </Text>
                    </View>
                  </View>

                  {/* Inputs */}
                  <View style={styles.form}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>USERNAME</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={[styles.input, error && styles.inputError]}
                          value={username}
                          onChangeText={setUsername}
                          placeholder="e.g. username"
                          placeholderTextColor={withAlpha(colors.ink, 0.4)}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => phoneInputRef.current?.focus()}
                        />
                        <View style={styles.inputIcon}>
                          <Ionicons
                            name={isUsernameValid ? 'checkmark-circle' : 'at'}
                            size={18}
                            color={isUsernameValid ? colors.energy : withAlpha(colors.ink, 0.3)}
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>PHONE NUMBER</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          ref={phoneInputRef}
                          style={[
                            styles.input,
                            phoneNumber.length > 0 && !isPhoneValid && styles.inputWarning,
                          ]}
                          value={phoneNumber}
                          onChangeText={handlePhoneChange}
                          placeholder="(555) 555-5555"
                          placeholderTextColor={withAlpha(colors.ink, 0.4)}
                          keyboardType="phone-pad"
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                        />
                        <View style={styles.inputIcon}>
                          <Ionicons
                            name={isPhoneValid ? 'checkmark-circle' : 'call'}
                            size={18}
                            color={isPhoneValid ? colors.energy : withAlpha(colors.ink, 0.3)}
                          />
                        </View>
                      </View>
                      {phoneNumber.length > 0 && !isPhoneValid && (
                        <Text style={styles.hintText}>Enter a 10-digit phone number</Text>
                      )}
                    </View>
                  </View>

                  {/* Notification opt-in */}
                  <Pressable style={styles.checkboxRow} onPress={toggleNotifications}>
                    <View
                      style={[
                        styles.checkbox,
                        enableNotifications && styles.checkboxChecked,
                      ]}
                    >
                      {enableNotifications && (
                        <Ionicons name="checkmark" size={14} color={colors.surface} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      Notify me when my contests start and new rounds begin
                    </Text>
                  </Pressable>

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color={colors.danger} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.buttonContainer}>
                    <Button
                      label={isSubmitting ? 'Saving...' : 'Save and Continue'}
                      onPress={() => void handleSubmit()}
                      disabled={!isFormValid || isSubmitting}
                      variant="primary"
                    />
                  </View>
                </View>
              </GlassyTexture>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

function createStyles(colors: {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  border: string;
  primary: string;
  energy: string;
  danger: string;
}) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.LG,
    },
    modalWrapper: {
      width: '100%',
      maxWidth: 380,
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 10,
    },
    modalGlass: {
      borderRadius: RADIUS.XXL,
      borderWidth: 1,
      borderColor: withAlpha(colors.surface, 0.6),
      backgroundColor: withAlpha(colors.surface, 0.9),
    },
    content: {
      padding: SPACING.XL,
    },
    header: {
      alignItems: 'center',
      marginBottom: SPACING.XL,
      gap: SPACING.MD,
    },
    headerText: {
      alignItems: 'center',
      gap: SPACING.XS,
    },
    title: {
      fontSize: TYPOGRAPHY.TITLE,
      fontFamily: TYPOGRAPHY.FONT_FAMILY_BOLD,
      color: colors.ink,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: TYPOGRAPHY.BODY,
      fontFamily: TYPOGRAPHY.FONT_FAMILY_REGULAR,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 22,
    },
    form: {
      gap: SPACING.LG,
    },
    inputGroup: {
      gap: SPACING.XS,
    },
    label: {
      fontSize: TYPOGRAPHY.SMALL,
      fontFamily: TYPOGRAPHY.FONT_FAMILY_BOLD,
      color: withAlpha(colors.ink, 0.7),
      paddingLeft: SPACING.XS,
      letterSpacing: 0.5,
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      backgroundColor: withAlpha(colors.background, 0.6),
      borderRadius: RADIUS.MD,
      borderWidth: 1,
      borderColor: withAlpha(colors.ink, 0.1),
      paddingHorizontal: SPACING.MD,
      paddingVertical: 14,
      paddingRight: 40,
      fontSize: TYPOGRAPHY.BODY,
      fontFamily: TYPOGRAPHY.FONT_FAMILY_REGULAR,
      color: colors.ink,
    },
    inputIcon: {
      position: 'absolute',
      right: SPACING.MD,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    inputError: {
      borderColor: colors.danger,
      backgroundColor: withAlpha(colors.danger, 0.05),
    },
    inputWarning: {
      borderColor: colors.energy,
    },
    hintText: {
      fontSize: TYPOGRAPHY.SMALL,
      fontFamily: TYPOGRAPHY.FONT_FAMILY_REGULAR,
      color: colors.energy,
      marginTop: 4,
      marginLeft: SPACING.XS,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
      marginTop: SPACING.LG,
      paddingHorizontal: SPACING.XS,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: RADIUS.SM,
      borderWidth: 2,
      borderColor: withAlpha(colors.ink, 0.3),
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxLabel: {
      flex: 1,
      fontSize: TYPOGRAPHY.SMALL,
      fontFamily: TYPOGRAPHY.FONT_FAMILY_REGULAR,
      color: colors.muted,
      lineHeight: 18,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: SPACING.MD,
      padding: SPACING.SM,
      backgroundColor: withAlpha(colors.danger, 0.1),
      borderRadius: RADIUS.SM,
      justifyContent: 'center',
    },
    errorText: {
      fontSize: TYPOGRAPHY.SMALL,
      fontFamily: TYPOGRAPHY.FONT_FAMILY_MEDIUM,
      color: colors.danger,
      textAlign: 'center',
    },
    buttonContainer: {
      marginTop: SPACING.XL,
    },
  });
}

export default OnboardingModal;
