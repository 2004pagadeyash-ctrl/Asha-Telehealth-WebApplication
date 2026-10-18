import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import AshaDashboard from '../screens/asha/AshaDashboard';
import AddVitalsScreen from '../screens/asha/AddVitalsScreen';
import RegisterPatientScreen from '../screens/asha/RegisterPatientScreen';
import CustomDrawer from '../components/ui/CustomDrawer';

const Drawer = createDrawerNavigator();

const AshaNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} role="asha" />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: 'rgba(168,85,247,0.15)',
        drawerActiveTintColor: colors.purple,
        drawerInactiveTintColor: colors.textSecondary,
        drawerStyle: { backgroundColor: colors.bg, width: 280 },
        drawerLabelStyle: { fontSize: 15, fontWeight: '600', marginLeft: -10 },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={AshaDashboard}
        options={{ drawerIcon: ({ color }) => <Ionicons name="people" size={22} color={color} /> }}
      />
      <Drawer.Screen
        name="Register Patient"
        component={RegisterPatientScreen}
        options={{ drawerIcon: ({ color }) => <Ionicons name="person-add" size={22} color={color} /> }}
      />
      <Drawer.Screen
        name="Record Vitals"
        component={AddVitalsScreen}
        options={{ drawerIcon: ({ color }) => <Ionicons name="heart" size={22} color={color} /> }}
      />
    </Drawer.Navigator>
  );
};

export default AshaNavigator;
