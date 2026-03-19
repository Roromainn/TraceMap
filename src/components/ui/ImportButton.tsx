import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../utils/colors';

interface ImportButtonProps {
  onFileSelected: (content: string, fileName: string) => void;
}

export function ImportButton({ onFileSelected }: ImportButtonProps) {
  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/gpx+xml',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled || !result.assets?.[0]) {
        return;
      }
      
      const file = result.assets[0];
      
      // Check file size (50MB limit)
      if (file.size && file.size > 50 * 1024 * 1024) {
        alert('File too large. Maximum size is 50MB.');
        return;
      }
      
      // Read file content
      const response = await fetch(file.uri);
      const content = await response.text();
      
      onFileSelected(content, file.name);
    } catch (error) {
      console.error('Error importing GPX:', error);
      alert('Failed to import GPX file');
    }
  };
  
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleImport}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>Import GPX</Text>
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
  },
  text: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});
