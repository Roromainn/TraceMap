import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../utils/colors';

interface ImportButtonProps {
  onFileSelected: (content: string, fileName: string, error?: string) => void;
  disabled?: boolean;
}

export function ImportButton({ onFileSelected, disabled }: ImportButtonProps) {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        // '*/*' nécessaire sur Android — le type GPX n'est pas reconnu par le système
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        setIsImporting(false);
        return;
      }

      const file = result.assets[0];

      // Vérification de l'extension .gpx
      if (!file.name.toLowerCase().endsWith('.gpx')) {
        onFileSelected('', file.name, 'Veuillez sélectionner un fichier .gpx');
        setIsImporting(false);
        return;
      }

      // Check file size (50MB limit)
      if (file.size && file.size > 50 * 1024 * 1024) {
        onFileSelected('', file.name, 'Fichier trop volumineux. Maximum 50MB.');
        setIsImporting(false);
        return;
      }

      // Read file content
      const response = await fetch(file.uri);
      const content = await response.text();

      onFileSelected(content, file.name);
    } catch (error) {
      console.error('Error importing GPX:', error);
      onFileSelected('', '', 'Échec de l\'import GPX');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={handleImport}
      disabled={isImporting || disabled}
      activeOpacity={0.8}
    >
      {isImporting ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <>
          <Ionicons name="download-outline" size={20} color={colors.white} style={styles.icon} />
          <Text style={styles.text}>Import GPX</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});
