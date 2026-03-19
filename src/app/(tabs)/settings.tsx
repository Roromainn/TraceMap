import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSessionStore } from '../../stores/sessionStore';
import { SpeedUnit, SPEED_UNIT_LABELS } from '../../utils/units';
import { colors } from '../../utils/colors';
import { useRouter } from 'expo-router';

const SPEED_OPTIONS: { value: SpeedUnit; label: string; description: string }[] = [
  { value: 'min_km',   label: 'min/km',  description: 'Allure (course à pied, rando)' },
  { value: 'km_h',     label: 'km/h',    description: 'Vitesse métrique (vélo, ski)' },
  { value: 'min_mile', label: 'min/mi',  description: 'Allure (miles, course USA)' },
  { value: 'mph',      label: 'mph',     description: 'Vitesse impériale' },
];

export default function SettingsScreen() {
  const { speedUnit, setSpeedUnit } = useSettingsStore();
  const { user, signOut } = useSessionStore();
  const router = useRouter();

  console.log('[Settings] user:', user?.email || 'null');

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)');
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Paramètres</Text>

      {/* User Info */}
      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <View style={styles.userCard}>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userId}>ID: {user.id.slice(0, 8)}...</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unité de vitesse</Text>
        <Text style={styles.sectionSubtitle}>
          Utilisée dans les stats et le graphique de vitesse
        </Text>

        {SPEED_OPTIONS.map((option) => {
          const selected = speedUnit === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => setSpeedUnit(option.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={styles.optionDesc}>{option.description}</Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>TraceMap</Text>
          <Text style={styles.aboutVersion}>Version MVP · Mars 2026</Text>
          <Text style={styles.aboutDesc}>
            Importez vos traces GPX, visualisez-les sur une carte interactive et analysez vos performances.
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      {user && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutButtonText}>🚪 Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.darkGray,
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  section: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkGray,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: colors.offWhite,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: colors.primary,
  },
  optionLeft: { flex: 1 },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.darkGray,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  userCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  userEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 4,
  },
  userId: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  aboutCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  aboutTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.darkGray,
  },
  aboutVersion: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    marginTop: 2,
  },
  aboutDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
});
