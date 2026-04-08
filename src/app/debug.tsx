import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { testSupabaseConnection, NetworkTestResult } from '../services/testNetwork';
import { useSessionStore } from '../stores/sessionStore';
import { colors } from '../utils/colors';
import { useRouter } from 'expo-router';

export default function DebugScreen() {
  const router = useRouter();
  const { user, signOut, isLoading } = useSessionStore();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<NetworkTestResult[]>([]);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      const testResults = await testSupabaseConnection();
      setResults(testResults);
      
      const allPassed = testResults.every(r => r.success);
      if (!allPassed) {
        Alert.alert(
          'Network Issues Detected',
          'Some connectivity tests failed. Check your internet connection and Supabase URL.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Test Error', error.message);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (success: boolean) => (
    <MaterialIcons
      name={success ? 'check-circle' : 'error'}
      size={24}
      color={success ? colors.success : colors.error}
    />
  );

  const getDurationColor = (duration?: number) => {
    if (!duration) return colors.onSurfaceVariant;
    if (duration < 500) return colors.success;
    if (duration < 1000) return colors.warning;
    return colors.error;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Debug & Network Test</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 User Session</Text>
          <View style={styles.infoCard}>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : user ? (
              <>
                <View style={styles.statusRow}>
                  {getStatusIcon(true)}
                  <Text style={styles.statusText}>Authenticated</Text>
                </View>
                <Text style={styles.emailText}>{user.email}</Text>
                <Text style={styles.userIdText}>ID: {user.id}</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                  <MaterialIcons name="logout" size={20} color={colors.white} />
                  <Text style={styles.logoutButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.statusRow}>
                  {getStatusIcon(false)}
                  <Text style={[styles.statusText, styles.statusTextError]}>Not Authenticated</Text>
                </View>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => router.push('/(auth)/sign-in')}
                >
                  <Text style={styles.loginButtonText}>Go to Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Network Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 Network Tests</Text>
          
          <TouchableOpacity
            style={[styles.testButton, testing && styles.testButtonDisabled]}
            onPress={runTests}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <MaterialIcons name="refresh" size={20} color={colors.white} />
                <Text style={styles.testButtonText}>Run Tests Again</Text>
              </>
            )}
          </TouchableOpacity>

          {results.map((result, index) => (
            <View key={index} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.resultHeaderLeft}>
                  {getStatusIcon(result.success)}
                  <Text style={styles.resultName}>{result.name}</Text>
                </View>
                {result.duration && (
                  <Text style={[styles.durationText, { color: getDurationColor(result.duration) }]}>
                    {result.duration}ms
                  </Text>
                )}
              </View>
              <Text style={styles.resultMessage}>{result.message}</Text>
            </View>
          ))}
        </View>

        {/* Supabase Config */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Supabase Config</Text>
          <View style={styles.infoCard}>
            <Text style={styles.configLabel}>URL:</Text>
            <Text style={styles.configValue}>https://uavoefrjobxbyshiftwul.supabase.co</Text>
            
            <Text style={styles.configLabel}>Storage:</Text>
            <Text style={styles.configValue}>expo-secure-store (encrypted)</Text>
            
            <Text style={styles.configLabel}>Auto Refresh:</Text>
            <Text style={styles.configValue}>Enabled</Text>
            
            <Text style={styles.configLabel}>Persist Session:</Text>
            <Text style={styles.configValue}>Enabled</Text>
          </View>
        </View>

        {/* Troubleshooting Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Troubleshooting</Text>
          <View style={styles.tipsCard}>
            <Text style={styles.tipItem}>• Check your internet connection</Text>
            <Text style={styles.tipItem}>• Verify Supabase URL is correct</Text>
            <Text style={styles.tipItem}>• Check Supabase dashboard for outages</Text>
            <Text style={styles.tipItem}>• Ensure RLS policies are configured</Text>
            <Text style={styles.tipItem}>• Try signing up instead of signing in</Text>
          </View>
        </View>

        {/* Summary */}
        {results.length > 0 && (
          <View style={[
            styles.summaryCard,
            { backgroundColor: results.every(r => r.success) ? colors.successLight : colors.errorLight }
          ]}>
            <Text style={styles.summaryTitle}>
              {results.every(r => r.success) ? '✅ All Tests Passed' : '❌ Some Tests Failed'}
            </Text>
            <Text style={styles.summaryText}>
              {results.filter(r => r.success).length} / {results.length} tests successful
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurface,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Lexend',
    fontWeight: '600',
    color: colors.onSurface,
  },
  statusTextError: {
    color: colors.error,
  },
  emailText: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginLeft: 32,
  },
  userIdText: {
    fontSize: 11,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.outline,
    marginLeft: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.white,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.white,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.white,
  },
  resultCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultName: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '600',
    color: colors.onSurface,
  },
  durationText: {
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '700',
  },
  resultMessage: {
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginLeft: 32,
  },
  configLabel: {
    fontSize: 12,
    fontFamily: 'Lexend',
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  configValue: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurface,
    marginBottom: 8,
  },
  tipsCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
  },
  tipItem: {
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginBottom: 8,
    lineHeight: 20,
  },
  summaryCard: {
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
});
