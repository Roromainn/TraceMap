import React from 'react';
import { Tabs } from 'expo-router';
import { colors } from '../../utils/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.darkGray,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: () => null, // TODO: Add map icon
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: () => null, // TODO: Add list icon
        }}
      />
    </Tabs>
  );
}
