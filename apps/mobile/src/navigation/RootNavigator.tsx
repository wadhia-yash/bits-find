import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';
import { useApp } from '../store/AppContext';
import { SignInScreen } from '../screens/SignInScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ReportLostScreen } from '../screens/ReportLostScreen';
import { ItemDetailScreen } from '../screens/ItemDetailScreen';
import { IFoundThisScreen } from '../screens/IFoundThisScreen';
import { MyActivityScreen } from '../screens/MyActivityScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.navy,
  },
};

function TabIcon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  return (
    <Ionicons
      name={name}
      size={23}
      color={focused ? colors.navy : colors.textFaint}
    />
  );
}

function Tabs() {
  const { unreadAlerts } = useApp();
  // Gesture-navigation devices reserve a strip at the bottom; without adding it
  // to the bar height the tab labels get clipped by the system handle.
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 62 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
        tabBarBadgeStyle: { backgroundColor: colors.red, fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={HomeScreen}
        options={{
          title: 'Lost items',
          tabBarBadge: unreadAlerts > 0 ? unreadAlerts : undefined,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'search' : 'search-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={MyActivityScreen}
        options={{
          title: 'My activity',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'albums' : 'albums-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { ready, user } = useApp();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {user ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerTitleStyle: { fontSize: 17, fontWeight: '700', color: colors.text },
            headerTintColor: colors.navy,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="ReportLost"
            component={ReportLostScreen}
            options={{ title: 'Report lost item', presentation: 'modal' }}
          />
          <Stack.Screen
            name="ItemDetail"
            component={ItemDetailScreen}
            options={{ title: 'Lost request' }}
          />
          <Stack.Screen
            name="IFoundThis"
            component={IFoundThisScreen}
            options={{ title: 'I found this item' }}
          />
        </Stack.Navigator>
      ) : (
        <SignInScreen />
      )}
    </NavigationContainer>
  );
}
