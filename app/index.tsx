import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../src/logic/auth/useAuth';
import ContestListScreen from '../src/screens/ContestListScreen';
import LoginScreen from '../src/screens/LoginScreen';

const DEV_MODE = true; // Set to false for production

const Index = () => {
  const { session } = useAuth();
  const [previewScreen, setPreviewScreen] = useState<'picker' | 'login' | 'contests'>('picker');

  // Development screen picker
  if (DEV_MODE) {
    if (previewScreen === 'login') {
      return <LoginScreen />;
    }
    
    if (previewScreen === 'contests') {
      return <ContestListScreen />;
    }

    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={[styles.title, styles.heading]}>
            Screen Preview
          </Text>
          <Text style={styles.subtitle}>Select a screen to preview:</Text>

          <View style={styles.buttonGroup}>
            <Pressable style={styles.button} onPress={() => setPreviewScreen('login')}>
              <Text style={styles.buttonText}>Login Screen</Text>
            </Pressable>

            <Pressable style={styles.button} onPress={() => setPreviewScreen('contests')}>
              <Text style={styles.buttonText}>Contest List Screen</Text>
            </Pressable>

            <View style={styles.divider} />

            <Link href="/lobby" asChild>
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Lobby Screen</Text>
              </Pressable>
            </Link>

            <Link href="/pregame" asChild>
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Pregame Screen</Text>
              </Pressable>
            </Link>

            <Link href={{ pathname: '/contest/[contestId]', params: { contestId: 'test' } }} asChild>
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Game Screen</Text>
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
              <Text style={styles.infoText}>
                {session ? '✓ Logged in' : '○ Not logged in'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Production flow
  if (session) {
    return <ContestListScreen />;
  }

  return <LoginScreen />;
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
  buttonSecondary: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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

export default Index;
