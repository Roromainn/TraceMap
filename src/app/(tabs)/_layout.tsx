import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { useMapStore } from '../../stores/mapStore';

function KINETICTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const color = isFocused ? colors.primary : colors.onSurfaceVariant;
        const icon = options.tabBarIcon;

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => {
              if (route.name === 'record') {
                return;
              }
              navigation.navigate(route.name);
            }}
            activeOpacity={0.7}
          >
            {icon && icon({ focused: isFocused, color, size: 24 })}
            <Text
              style={[
                styles.tabLabel,
                { color, fontWeight: isFocused ? '700' : '500' },
              ]}
            >
              {options.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { loadActivities } = useMapStore();

  useEffect(() => {
    loadActivities();
  }, []);

  return (
    <Tabs tabBar={(props) => <KINETICTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused, color }: any) => (
            <MaterialIcons
              name={focused ? 'explore' : 'explore-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
          tabBarIcon: ({ focused, color }: any) => (
            <MaterialIcons
              name="radio-button-unchecked"
              size={32}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }: any) => (
            <MaterialIcons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: Dimensions.get('window').width / 3,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Lexend',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },
});
