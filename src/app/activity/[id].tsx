import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityDetail } from '../../components/activity/ActivityDetail';
import { useActivity } from '../../hooks/useActivity';
import { colors } from '../../utils/colors';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = useActivity(id);
  const router = useRouter();

  if (!activity) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Activité introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{activity.title}</Text>
      </View>
      <ActivityDetail activity={activity} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backArrow: { fontSize: 22, color: colors.primary, marginRight: 12 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.darkGray, flex: 1 },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { fontSize: 18, color: colors.darkGray, marginBottom: 16 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 8 },
  backBtnText: { color: colors.white, fontWeight: '600' },
});
