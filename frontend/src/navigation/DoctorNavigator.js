import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import DoctorDashboard from '../screens/doctor/DoctorDashboard';
import PatientHistoryScreen from '../screens/doctor/PatientHistoryScreen';
import CustomDrawer from '../components/ui/CustomDrawer';

const Drawer = createDrawerNavigator();

const DoctorNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} role="doctor" />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: 'rgba(0,242,169,0.15)',
        drawerActiveTintColor: colors.green,
        drawerInactiveTintColor: colors.textSecondary,
        drawerStyle: { backgroundColor: colors.bg, width: 280 },
        drawerLabelStyle: { fontSize: 15, fontWeight: '600', marginLeft: -10 },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DoctorDashboard}
        options={{ drawerIcon: ({ color }) => <Ionicons name="medkit" size={22} color={color} /> }}
      />
      <Drawer.Screen
        name="Patient Records"
        component={PatientHistoryScreen}
        options={{ drawerIcon: ({ color }) => <Ionicons name="folder-open" size={22} color={color} /> }}
      />
    </Drawer.Navigator>
  );
};

export default DoctorNavigator;
