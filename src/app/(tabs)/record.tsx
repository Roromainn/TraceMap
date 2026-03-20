import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useToast } from '../../contexts/ToastContext';
import { useMapStore } from '../../stores/mapStore';
import { parseGPX } from '../../services/gpxParser';
import { colors } from '../../utils/colors';

const ACTIVITY_TYPES = [
  { value: 'run', label: '🏃 Running', icon: 'directions-run' },
  { value: 'ride', label: '🚴 Cycling', icon: 'directions-bike' },
  { value: 'hike', label: '🥾 Hiking', icon: 'hiking' },
  { value: 'other', label: '📍 Other', icon: 'directions-walk' },
];

export default function RecordScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { addActivity } = useMapStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedType, setSelectedType] = useState('run');
  const [activityName, setActivityName] = useState('');

  const handleImportGPX = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const file = result.assets[0];
      
      if (!file.name.toLowerCase().endsWith('.gpx')) {
        showError('Please select a .gpx file');
        return;
      }

      if (file.size && file.size > 50 * 1024 * 1024) {
        showError('File too large (max 50MB)');
        return;
      }

      setIsImporting(true);
      const response = await fetch(file.uri);
      const content = await response.text();
      const parsed = await parseGPX(content);

      // Override type from selection
      parsed.stats.type = selectedType as any;

      const title = activityName.trim() || file.name.replace(/\.gpx$/i, '');
      await addActivity(parsed, title, content);

      showSuccess(`${title} imported successfully!`);
      setModalVisible(false);
      setActivityName('');
      setSelectedType('run');
      router.push('/(tabs)');
    } catch (error: any) {
      showError(error.message || 'Failed to import GPX');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity>
            <MaterialIcons name="menu" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.logo}>KINETIC</Text>
          <TouchableOpacity>
            <MaterialIcons name="notifications-none" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="radio-button-unchecked" size={80} color={colors.primary} />
          </View>
          <Text style={styles.title}>Start Recording</Text>
          <Text style={styles.subtitle}>Track your activity in real-time</Text>
          
          <TouchableOpacity style={styles.importButton} onPress={() => setModalVisible(true)}>
            <MaterialIcons name="upload-file" size={24} color={colors.onPrimary} />
            <Text style={styles.importButtonText}>Import GPX File</Text>
          </TouchableOpacity>

          <Text style={styles.comingSoon}>Recording coming soon...</Text>
        </View>
      </View>

      {/* Import Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Activity</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Activity Type Selection */}
              <Text style={styles.sectionLabel}>Activity Type</Text>
              <View style={styles.typeGrid}>
                {ACTIVITY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      selectedType === type.value && styles.typeOptionSelected,
                    ]}
                    onPress={() => setSelectedType(type.value)}
                  >
                    <MaterialIcons
                      name={type.icon as any}
                      size={28}
                      color={selectedType === type.value ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                    />
                    <Text style={[
                      styles.typeLabel,
                      selectedType === type.value && styles.typeLabelSelected,
                    ]}>
                      {type.label.replace(/^[^\s]+\s/, '')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Activity Name */}
              <Text style={styles.sectionLabel}>Activity Name</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="e.g., Morning Run, Evening Ride..."
                placeholderTextColor={colors.outline}
                value={activityName}
                onChangeText={setActivityName}
                maxLength={50}
              />

              {/* Info */}
              <View style={styles.infoBox}>
                <MaterialIcons name="info" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  Select a .GPX file from your device. Max size: 50MB
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={isImporting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.importButtonModal, (!activityName || isImporting) && styles.importButtonDisabled]}
                onPress={handleImportGPX}
                disabled={isImporting}
              >
                {isImporting ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <>
                    <MaterialIcons name="file-download" size={20} color={colors.onPrimary} />
                    <Text style={styles.importButtonTextModal}>Import</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Lexend',
    fontWeight: '900',
    color: colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginBottom: 40,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 28,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  importButtonText: {
    fontSize: 16,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onPrimary,
  },
  comingSoon: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginTop: 40,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
  },
  modalBody: {
    padding: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  typeOption: {
    width: '48%',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  typeOptionSelected: {
    backgroundColor: colors.primaryContainer,
  },
  typeLabel: {
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  typeLabelSelected: {
    color: colors.onPrimaryContainer,
  },
  nameInput: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    opacity: 0.1,
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.primary,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  cancelButton: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  importButtonModal: {
    backgroundColor: colors.primary,
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonTextModal: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
