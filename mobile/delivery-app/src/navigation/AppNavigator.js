import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config';
import { useAuth } from '../context/AuthContext';

import LoginScreen     from '../screens/auth/LoginScreen';
import OTPScreen       from '../screens/auth/OTPScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProfileScreen   from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6, backgroundColor: '#fff', borderTopColor: COLORS.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const icons = { Deliveries: focused ? 'bicycle' : 'bicycle-outline', Profile: focused ? 'person' : 'person-outline' };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Deliveries" component={DashboardScreen} />
      <Tab.Screen name="Profile"    component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTP"   component={OTPScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { agent, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 48 }}>🚚</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 12 }}>GoNaatu Delivery</Text>
      </View>
    );
  }
  return (
    <NavigationContainer>
      {agent ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
