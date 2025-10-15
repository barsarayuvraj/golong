// GoLong Mobile App - Main App Component

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '@/constants';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>🔥 GoLong</Text>
        <Text style={styles.subtitle}>Where Streaks Become Stories</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcome}>Welcome to GoLong Mobile!</Text>
        <Text style={styles.description}>
          Your mobile streak tracking companion is ready for development.
        </Text>
        
        <View style={styles.features}>
          <Text style={styles.featureTitle}>🚀 Coming Soon:</Text>
          <Text style={styles.feature}>• Streak creation and management</Text>
          <Text style={styles.feature}>• Daily check-ins</Text>
          <Text style={styles.feature}>• Social features</Text>
          <Text style={styles.feature}>• Real-time updates</Text>
          <Text style={styles.feature}>• Push notifications</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Check the documentation in the docs/ folder to get started!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.white,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary.main,
  },
  title: {
    ...typography.h1,
    color: colors.primary.contrast,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body1,
    color: colors.primary.contrast,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  welcome: {
    ...typography.h3,
    color: colors.neutral.grey800,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body1,
    color: colors.neutral.grey600,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  features: {
    backgroundColor: colors.neutral.grey50,
    padding: spacing.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
  },
  featureTitle: {
    ...typography.h5,
    color: colors.neutral.grey800,
    marginBottom: spacing.md,
  },
  feature: {
    ...typography.body2,
    color: colors.neutral.grey700,
    marginBottom: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.neutral.grey100,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.neutral.grey600,
    textAlign: 'center',
  },
});