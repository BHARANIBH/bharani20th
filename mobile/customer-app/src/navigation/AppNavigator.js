import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../config';
import { useAuth } from '../context/AuthContext';

import LoginScreen        from '../screens/auth/LoginScreen';
import OTPScreen          from '../screens/auth/OTPScreen';
import HomeScreen         from '../screens/home/HomeScreen';
import CartScreen         from '../screens/cart/CartScreen';
import CheckoutScreen     from '../screens/checkout/CheckoutScreen';
import OrderTrackingScreen from '../screens/orders/OrderTrackingScreen';
import OrderHistoryScreen from '../screens/orders/OrderHistoryScreen';
import ProfileScreen      from '../screens/profile/ProfileScreen';
import AddressListScreen  from '../screens/address/AddressListScreen';
import AddAddressScreen   from '../screens/address/AddAddressScreen';
import PaymentScreen      from '../screens/checkout/PaymentScreen';
import AboutScreen        from '../screens/profile/AboutScreen';
import WelcomeScreen      from '../screens/auth/WelcomeScreen';
import CategoryScreen      from '../screens/categories/CategoryScreen';
import ProteinDetailScreen  from '../screens/categories/ProteinDetailScreen';
import ProductDetailScreen  from '../screens/product/ProductDetailScreen';

const Stack  = createNativeStackNavigator();
const Tab    = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Home:       focused ? 'home'     : 'home-outline',
            Categories: focused ? 'grid'     : 'grid-outline',
            Orders:     focused ? 'bag'      : 'bag-outline',
            Profile:    focused ? 'person'   : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"       component={HomeScreen}         options={{ title: 'Home' }} />
      <Tab.Screen name="Categories" component={CategoryScreen}     options={{ title: 'Categories' }} />
      <Tab.Screen name="Orders"     component={OrderHistoryScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="Profile"    component={ProfileScreen}      options={{ title: 'Profile' }} />
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

function AppStack({ isNewLogin }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={isNewLogin ? 'Welcome' : 'Main'}>
      <Stack.Screen name="Welcome"       component={WelcomeScreen} />
      <Stack.Screen name="Main"          component={MainTabs} />
      <Stack.Screen name="Cart"          component={CartScreen} />
      <Stack.Screen name="Checkout"      component={CheckoutScreen} />
      <Stack.Screen name="Payment"       component={PaymentScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="AddressList"   component={AddressListScreen} />
      <Stack.Screen name="AddAddress"    component={AddAddressScreen} />
      <Stack.Screen name="About"         component={AboutScreen} />
      <Stack.Screen name="ProteinDetail"  component={ProteinDetailScreen} />
      <Stack.Screen name="ProductDetail"  component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading, isNewLogin } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 48 }}>🐔</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 12 }}>GoNaatu</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack isNewLogin={isNewLogin} /> : <AuthStack />}
    </NavigationContainer>
  );
}
