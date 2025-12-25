import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../logic/hooks/useAuth';
import LoginScreen from './LoginScreen';

const DevLandingScreen = () => {
  const { session, logout } = useAuth();
  const router = useRouter();
  const [previewScreen, setPreviewScreen] = useState<'picker' | 'login'>('picker');

  if (previewScreen === 'login') {
    return <LoginScreen />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, styles.heading]}>Screen Preview</Text>
        <Text style={styles.subtitle}>Select a screen to preview:</Text>

        <View style={styles.buttonGroup}>
          <Pressable style={styles.button} onPress={() => setPreviewScreen('login')}>
            <Text style={styles.buttonText}>Login Screen</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={() => router.push('/contests')}>
            <Text style={styles.buttonText}>Contest List Screen</Text>
          </Pressable>

          <View style={styles.divider} />

          <Link href="/lobby" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Lobby Screen</Text>
            </Pressable>
          </Link>

          <Link
            href={{
              pathname: '/contest/[contestId]',
              params: { contestId: '00000000-0000-0000-0000-0000000000aa' },
            }}
            asChild
          >
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Game Screen (Sunday Showdown)</Text>
            </Pressable>
          </Link>

          <Link href="/submitted" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Submitted Screen</Text>
            </Pressable>
          </Link>

          <Link href="/correct" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Correct Screen</Text>
            </Pressable>
          </Link>

          <Link href="/eliminated" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Eliminated Screen</Text>
            </Pressable>
          </Link>

          <Link href="/winner" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Winner Screen</Text>
            </Pressable>
          </Link>

          <View style={styles.divider} />

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{session ? 'Logged in' : 'Not logged in'}</Text>
          </View>

          {__DEV__ && session ? (
            <Pressable style={[styles.button, styles.logoutButton]} onPress={() => void logout()}>
              <Text style={styles.buttonText}>Log Out</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  buttonGroup: {
    gap: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#9F2430',
  },
  divider: {
    height: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 12,
  },
  infoBox: {
    padding: 12,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    alignItems: 'center',
  },
  infoText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DevLandingScreen;
