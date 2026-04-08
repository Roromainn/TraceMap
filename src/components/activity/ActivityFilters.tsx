import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';

export type ActivityType = 'all' | 'run' | 'ride' | 'hike' | 'other';
export type TimePeriod = 'all' | 'week' | 'month' | 'year';

interface ActivityFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: { type: ActivityType; period: TimePeriod }) => void;
  currentType: ActivityType;
  currentPeriod: TimePeriod;
}

const TYPE_OPTIONS: { value: ActivityType; label: string; icon: any }[] = [
  { value: 'all', label: 'All Activities', icon: 'list' },
  { value: 'run', label: 'Running', icon: 'directions-run' },
  { value: 'ride', label: 'Cycling', icon: 'directions-bike' },
  { value: 'hike', label: 'Hiking', icon: 'hiking' },
  { value: 'other', label: 'Other', icon: 'directions-walk' },
];

const PERIOD_OPTIONS: { value: TimePeriod; label: string; icon: any }[] = [
  { value: 'all', label: 'All Time', icon: 'schedule' },
  { value: 'week', label: 'This Week', icon: 'date-range' },
  { value: 'month', label: 'This Month', icon: 'calendar-today' },
  { value: 'year', label: 'This Year', icon: 'calendar-month' },
];

export default function ActivityFilters({
  visible,
  onClose,
  onApply,
  currentType,
  currentPeriod,
}: ActivityFiltersProps) {
  const [selectedType, setSelectedType] = useState<ActivityType>(currentType);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(currentPeriod);

  const handleApply = () => {
    onApply({ type: selectedType, period: selectedPeriod });
    onClose();
  };

  const handleReset = () => {
    setSelectedType('all');
    setSelectedPeriod('all');
    onApply({ type: 'all', period: 'all' });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Activity Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Type</Text>
            <View style={styles.optionsGrid}>
              {TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    selectedType === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedType(option.value)}
                >
                  <MaterialIcons
                    name={option.icon}
                    size={20}
                    color={selectedType === option.value ? colors.white : colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      selectedType === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time Period */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Period</Text>
            <View style={styles.optionsGrid}>
              {PERIOD_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    selectedPeriod === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(option.value)}
                >
                  <MaterialIcons
                    name={option.icon}
                    size={20}
                    color={selectedPeriod === option.value ? colors.white : colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      selectedPeriod === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <MaterialIcons name="check" size={20} color={colors.white} />
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
  },
  section: {
    padding: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  optionsGrid: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  optionTextActive: {
    color: colors.white,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 16,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  applyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  applyButtonText: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.white,
  },
});
