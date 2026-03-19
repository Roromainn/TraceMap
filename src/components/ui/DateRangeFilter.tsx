import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useMapStore } from '../../stores/mapStore';
import { colors } from '../../utils/colors';

type Preset = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time' | 'custom';

export function DateRangeFilter() {
  const { dateRange, setDateRange } = useMapStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset>('last_30_days');

  const applyPreset = (preset: Preset) => {
    const end = new Date();
    let start = new Date();

    switch (preset) {
      case 'last_7_days':
        start.setDate(end.getDate() - 7);
        break;
      case 'last_30_days':
        start.setDate(end.getDate() - 30);
        break;
      case 'last_90_days':
        start.setDate(end.getDate() - 90);
        break;
      case 'all_time':
        start = new Date(2000, 0, 1);
        break;
    }

    setDateRange({ start, end });
    setSelectedPreset(preset);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>
          {selectedPreset.replace('_', ' ')}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            
            <TouchableOpacity
              style={[styles.preset, selectedPreset === 'last_7_days' && styles.presetSelected]}
              onPress={() => applyPreset('last_7_days')}
            >
              <Text>Last 7 Days</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.preset, selectedPreset === 'last_30_days' && styles.presetSelected]}
              onPress={() => applyPreset('last_30_days')}
            >
              <Text>Last 30 Days</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.preset, selectedPreset === 'last_90_days' && styles.presetSelected]}
              onPress={() => applyPreset('last_90_days')}
            >
              <Text>Last 90 Days</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.preset, selectedPreset === 'all_time' && styles.presetSelected]}
              onPress={() => applyPreset('all_time')}
            >
              <Text>All Time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 16,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 16,
  },
  preset: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  presetSelected: {
    backgroundColor: colors.offWhite,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
