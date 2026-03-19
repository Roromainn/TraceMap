import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from '../services/activities';
import { colors } from '../utils/colors';

// Validation email simple
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validation mot de passe fort (8+ chars, 1 maj, 1 min, 1 chiffre, 1 spécial)
function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Faible' };
  if (score <= 4) return { score, label: 'Moyen' };
  return { score, label: 'Fort' };
}

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const passwordStrength = getPasswordStrength(password);

  const handleAuth = async () => {
    // Validations
    if (!email.trim()) {
      Alert.alert('Email requis', 'Veuillez entrer votre adresse email.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Email invalide', 'Veuillez entrer une adresse email valide (ex: user@example.com).');
      return;
    }

    if (!password) {
      Alert.alert('Mot de passe requis', 'Veuillez entrer un mot de passe.');
      return;
    }

    if (!isStrongPassword(password)) {
      Alert.alert(
        'Mot de passe trop faible',
        'Le mot de passe doit contenir au moins 8 caractères, dont :\n• 1 majuscule\n• 1 minuscule\n• 1 chiffre\n• 1 caractère spécial (!@#$%^&*)'
      );
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Mots de passe différents', 'Les deux mots de passe ne correspondent pas.');
      return;
    }

    // Debug user auto-login
    if (email === 'debug@tracemap.com' && password === 'Debug123!') {
      setIsLoading(true);
      try {
        // Try to sign in, if user doesn't exist, create it
        try {
          await signInWithEmail(email, password);
        } catch {
          // User doesn't exist, create it
          await signUpWithEmail(email, password);
        }
        Alert.alert('✅ Compte debug connecté', 'Bienvenue !');
        router.replace('/(tabs)');
      } catch (error: any) {
        Alert.alert('Erreur', error.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Normal auth flow
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await signUpWithEmail(email, password);
        if (error) throw error;
        
        if (data.user) {
          Alert.alert(
            '✅ Compte créé !',
            'Un email de confirmation a été envoyé. Vérifiez votre boîte mail.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
          );
        }
      } else {
        await signInWithEmail(email, password);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // User will be redirected to Google, then back to app
    } catch (error: any) {
      Alert.alert('Erreur Google', error.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Logo / Title */}
      <View style={styles.header}>
        <Text style={styles.logo}>🗺️</Text>
        <Text style={styles.title}>TraceMap</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Créez votre compte' : 'Connectez-vous'}
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        {/* Password strength indicator */}
        {isSignUp && password.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBar}>
              <View
                style={[
                  styles.strengthFill,
                  {
                    width: `${(passwordStrength.score / 6) * 100}%`,
                    backgroundColor:
                      passwordStrength.score <= 2
                        ? '#EF4444'
                        : passwordStrength.score <= 4
                        ? '#F59E0B'
                        : '#10B981',
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.strengthLabel,
                {
                  color:
                    passwordStrength.score <= 2
                      ? '#EF4444'
                      : passwordStrength.score <= 4
                      ? '#F59E0B'
                      : '#10B981',
                },
              ]}
            >
              {passwordStrength.label}
            </Text>
          </View>
        )}

        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!isLoading}
          />
        )}

        {/* Password requirements */}
        {isSignUp && (
          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Le mot de passe doit contenir :</Text>
            <RequirementItem met={password.length >= 8} text="8 caractères minimum" />
            <RequirementItem met={/[A-Z]/.test(password)} text="1 majuscule" />
            <RequirementItem met={/[a-z]/.test(password)} text="1 minuscule" />
            <RequirementItem met={/[0-9]/.test(password)} text="1 chiffre" />
            <RequirementItem met={/[^A-Za-z0-9]/.test(password)} text="1 caractère spécial" />
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? "S'inscrire" : 'Se connecter'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.or}>OU</Text>
          <View style={styles.line} />
        </View>

        {/* Google Sign In */}
        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.googleButtonText}>🔵 Continuer avec Google</Text>
        </TouchableOpacity>

        {/* Toggle Login/Signup */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Déjà un compte ? ' : "Pas encore de compte ? "}
          </Text>
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} disabled={isLoading}>
            <Text style={styles.toggleLink}>
              {isSignUp ? 'Se connecter' : "S'inscrire"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={styles.requirementItem}>
      <View
        style={[styles.checkIcon, { backgroundColor: met ? '#10B981' : '#E5E7EB' }]}
      >
        {met && <Text style={styles.checkText}>✓</Text>}
      </View>
      <Text
        style={[
          styles.requirementText,
          { color: met ? '#10B981' : '#9CA3AF' },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: -8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 50,
  },
  requirements: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  requirementText: {
    fontSize: 13,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.lightGray,
  },
  or: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 13,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: 15,
    color: colors.darkGray,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  toggleText: {
    fontSize: 14,
    color: '#6B7280',
  },
  toggleLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
});
