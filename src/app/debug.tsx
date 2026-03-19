import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getCurrentUser } from '../services/activities';

export default function DebugScreen() {
  const [userInfo, setUserInfo] = useState<string>('Loading...');

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserInfo(`✅ Connecté:\n${user.email}\nID: ${user.id}`);
      } else {
        setUserInfo('❌ Non connecté\nVa dans l\'écran Paramètres pour te connecter');
      }
    } catch (error: any) {
      setUserInfo(`❌ Erreur: ${error.message}`);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Auth</Text>
      <Text style={styles.info}>{userInfo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  info: {
    fontSize: 14,
    lineHeight: 24,
  },
});
