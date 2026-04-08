import React, { useReducer, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore, SpeedUnit } from '../../stores/settingsStore';
import { useMapStore } from '../../stores/mapStore';
import { colors } from '../../utils/colors';

// Types
type ProfileState = {
  showUnitSelector: boolean;
  activeTab: 'stats' | 'routes' | 'settings';
};

type ProfileAction =
  | { type: 'TOGGLE_UNIT_SELECTOR' }
  | { type: 'SET_ACTIVE_TAB'; payload: 'stats' | 'routes' | 'settings' }
  | { type: 'RESET' };

// Reducer
const profileReducer = (state: ProfileState, action: ProfileAction): ProfileState => {
  switch (action.type) {
    case 'TOGGLE_UNIT_SELECTOR':
      return { ...state, showUnitSelector: !state.showUnitSelector };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'RESET':
      return { showUnitSelector: false, activeTab: 'stats' };
    default:
      return state;
  }
};

const initialState: ProfileState = {
  showUnitSelector: false,
  activeTab: 'stats',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useSessionStore();
  const { speedUnit, setSpeedUnit } = useSettingsStore();
  const { getMonthlyDistance } = useMapStore();
  const [state, dispatch] = useReducer(profileReducer, initialState);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            dispatch({ type: 'RESET' });
            await signOut();
            router.replace('/(auth)');
          },
        },
      ]
    );
  };

  // Calculate monthly distance
  const monthlyDistance = getMonthlyDistance();
  const monthlyGoal = 200;
  const monthlyPercent = monthlyGoal > 0 ? (monthlyDistance / monthlyGoal) * 100 : 0;
  const now = new Date();

  const SPEED_UNITS: { value: SpeedUnit; label: string }[] = [
    { value: 'min_km', label: 'min/km' },
    { value: 'km_h', label: 'km/h' },
    { value: 'min_mile', label: 'min/mile' },
    { value: 'mph', label: 'mph' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <MaterialIcons name="menu" size={24} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
        <Text style={styles.logo}>KINETIC</Text>
        <TouchableOpacity>
          <MaterialIcons name="notifications-none" size={24} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Profile Hero */}
      <View style={styles.profileHero}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <TouchableOpacity style={styles.editAvatar}>
            <MaterialIcons name="edit" size={16} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.badge}>Active Athlete</Text>
          <Text style={styles.name}>{user?.email?.split('@')[0].toUpperCase() || 'ATHLETE'}</Text>
        </View>
      </View>

      {/* Monthly Goal */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View>
            <Text style={styles.goalTitle}>Monthly Distance</Text>
            <Text style={styles.goalSubtitle}>{now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
          </View>
          <View style={styles.goalValue}>
            <Text style={styles.goalNumber}>{monthlyDistance.toFixed(1)}</Text>
            <Text style={styles.goalUnit}>/ {monthlyGoal} KM</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${monthlyPercent}%` }]} />
        </View>
        <View style={styles.goalFooter}>
          <Text style={styles.goalPercent}>{monthlyPercent.toFixed(0)}% Complete</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity style={[styles.statCard, styles.statCardLarge]}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="bar-chart" size={24} color={colors.onPrimary} />
          </View>
          <Text style={styles.statTitle}>My Stats</Text>
          <Text style={styles.statSubtitle}>Lifetime metrics & PRs</Text>
        </TouchableOpacity>
        <View style={styles.statCardsSmall}>
          <TouchableOpacity style={[styles.statCard, styles.statCardSmall, { borderLeftWidth: 4, borderLeftColor: colors.primary }]}>
            <View>
              <Text style={styles.statTitle}>My Routes</Text>
              <Text style={styles.statCount}>24 Saved</Text>
            </View>
            <MaterialIcons name="route" size={24} color={colors.primaryFixedDim} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, styles.statCardSmall, { borderLeftWidth: 4, borderLeftColor: colors.tertiary }]}>
            <View>
              <Text style={styles.statTitle}>Equipment</Text>
              <Text style={styles.statCount}>4 Active</Text>
            </View>
            <MaterialIcons name="inventory-2" size={24} color={colors.tertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>APP SETTINGS</Text>
        <View style={styles.settingsList}>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => dispatch({ type: 'TOGGLE_UNIT_SELECTOR' })}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceContainerLowest }]}>
                <MaterialIcons name="speed" size={20} color={colors.onSurfaceVariant} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Display Preferences</Text>
                <Text style={styles.settingValue}>Speed: {SPEED_UNITS.find(u => u.value === speedUnit)?.label}</Text>
              </View>
            </View>
            <MaterialIcons 
              name={state.showUnitSelector ? 'expand-less' : 'expand-more'} 
              size={24} 
              color={colors.outline} 
            />
          </TouchableOpacity>

          {/* Unit Selector */}
          {state.showUnitSelector && (
            <View style={styles.unitSelector}>
              {SPEED_UNITS.map((unit) => (
                <TouchableOpacity
                  key={unit.value}
                  style={[
                    styles.unitOption,
                    speedUnit === unit.value && styles.unitOptionSelected,
                  ]}
                  onPress={() => setSpeedUnit(unit.value)}
                >
                  <Text style={[
                    styles.unitOptionText,
                    speedUnit === unit.value && styles.unitOptionTextSelected,
                  ]}>
                    {unit.label}
                  </Text>
                  {speedUnit === unit.value && (
                    <MaterialIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceContainerLowest }]}>
                <MaterialIcons name="lock" size={20} color={colors.onSurfaceVariant} />
              </View>
              <Text style={styles.settingLabel}>Privacy & Security</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceContainerLowest }]}>
                <MaterialIcons name="palette" size={20} color={colors.onSurfaceVariant} />
              </View>
              <Text style={styles.settingLabel}>Appearance</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.error, opacity: 0.1 }]}>
                <MaterialIcons name="logout" size={20} color={colors.error} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.error }]}>Log Out</Text>
            </View>
            <TouchableOpacity onPress={handleLogout}>
              <MaterialIcons name="chevron-right" size={24} color={colors.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>KEEP MOVING.</Text>
      </View>
    </ScrollView>
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
  logo: {
    fontSize: 24,
    fontFamily: 'Lexend',
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.primary,
    letterSpacing: -1,
  },
  profileHero: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarText: {
    fontSize: 40,
    fontFamily: 'Lexend',
    fontWeight: '900',
    color: colors.onPrimaryContainer,
  },
  editAvatar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  profileInfo: {
    flex: 1,
    paddingBottom: 8,
  },
  badge: {
    fontSize: 10,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  name: {
    fontSize: 32,
    fontFamily: 'Lexend',
    fontWeight: '900',
    color: colors.onSurface,
    letterSpacing: -1,
    lineHeight: 36,
  },
  goalCard: {
    marginHorizontal: 24,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.03,
    shadowRadius: 24,
    elevation: 2,
    borderBottomWidth: 4,
    borderBottomColor: colors.primary,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  goalTitle: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurface,
  },
  goalSubtitle: {
    fontSize: 11,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  goalValue: {
    alignItems: 'flex-end',
  },
  goalNumber: {
    fontSize: 28,
    fontFamily: 'Lexend',
    fontWeight: '900',
    color: colors.primary,
  },
  goalUnit: {
    fontSize: 11,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  goalPercent: {
    fontSize: 10,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },
  statCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  statCardLarge: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'space-between',
  },
  statCardsSmall: {
    flex: 1,
    gap: 16,
  },
  statCardSmall: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    aspectRatio: 'auto',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statTitle: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurface,
    marginTop: 12,
  },
  statSubtitle: {
    fontSize: 11,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  statCount: {
    fontSize: 10,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  settingsSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 8,
  },
  settingsList: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 24,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurface,
  },
  settingValue: {
    fontSize: 12,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  unitSelector: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  unitOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  unitOptionSelected: {
    backgroundColor: colors.primaryContainer,
  },
  unitOptionText: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  unitOptionTextSelected: {
    color: colors.onPrimaryContainer,
  },
  settingDivider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: 16,
    opacity: 0.1,
  },
  version: {
    fontSize: 9,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.error,
    opacity: 0.4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingRight: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 32,
    fontFamily: 'Lexend',
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.surfaceContainerHighest,
    letterSpacing: -1,
    opacity: 0.4,
  },
});
