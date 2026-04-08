// Add this to src/app/(tabs)/settings.tsx

// 1. Add MaterialIcons import (already done)
import { MaterialIcons } from '@expo/vector-icons';

// 2. Add this section before the Logout Button section (around line 200):

        {/* Garmin Connect */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Integrations</Text>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/settings/garmin')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.surfaceContainerLowest }]}>
                  <MaterialIcons name="fitness-center" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Garmin Connect</Text>
                  <Text style={styles.settingDesc}>Sync your Garmin activities</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
            </TouchableOpacity>
          </View>
        )}

// 3. Add styles if needed (check if these exist first):
// sectionTitle, settingItem, settingLeft, settingIcon, settingLabel, settingDesc
