import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import AdminDashboard from '../screens/admin/AdminDashboard';
import PharmacyPortalScreen from '../screens/admin/PharmacyPortalScreen';
import CustomDrawer from '../components/ui/CustomDrawer';

const Drawer = createDrawerNavigator();

const AdminNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} role="admin" />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: 'rgba(255,165,0,0.15)',
        drawerActiveTintColor: colors.orange,
        drawerInactiveTintColor: colors.textSecondary,
        drawerStyle: { backgroundColor: colors.bg, width: 280 },
        drawerLabelStyle: { fontSize: 15, fontWeight: '600', marginLeft: -10 },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={AdminDashboard}
        options={{ drawerIcon: ({ color }) => <Ionicons name="shield-checkmark" size={22} color={color} /> }}
      />
      <Drawer.Screen
        name="Pharmacy Portal"
        component={PharmacyPortalScreen}
        options={{ drawerIcon: ({ color }) => <Ionicons name="storefront" size={22} color={color} /> }}
      />
    </Drawer.Navigator>
  );
};

export default AdminNavigator;

