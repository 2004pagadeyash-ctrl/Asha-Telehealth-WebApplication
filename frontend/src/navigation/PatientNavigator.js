import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Screens
import PatientDashboard from '../screens/patient/PatientDashboard';
import SymptomCheckerScreen from '../screens/patient/SymptomCheckerScreen';
import MedicineSearchScreen from '../screens/patient/MedicineSearchScreen';
import AppointmentsStack from '../navigation/AppointmentsStack';
import HealthEducationScreen from '../screens/patient/HealthEducationScreen';
import FinancialSupportScreen from '../screens/patient/FinancialSupportScreen';
import HealthRecordsScreen from '../screens/patient/HealthRecordsScreen';
import CustomDrawer from '../components/ui/CustomDrawer';

const Drawer = createDrawerNavigator();

const PatientNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} role="patient" />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: 'rgba(0,201,255,0.15)',
        drawerActiveTintColor: colors.cyan,
        drawerInactiveTintColor: colors.textSecondary,
        drawerStyle: { backgroundColor: colors.bg, width: 280 },
        drawerLabelStyle: { fontSize: 15, fontWeight: '600', marginLeft: -10 },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={PatientDashboard}
        options={{ drawerIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }}
      />
      <Drawer.Screen
        name="Symptoms & AI"
        component={SymptomCheckerScreen}
        options={{ drawerIcon: ({ color }) => <Ionicons name="medical" size={22} color={color} /> }}
      />
      <Drawer.Screen
        name="Appointments"
        component={AppointmentsStack}
        options={{ drawerIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} /> }}
      />
      <Drawer.Screen
        name="Medicines"
        component={MedicineSearchScreen}
        options={{ drawerIcon: ({ color }) => <Ionicons name="flask" size={22} color={color} /> }}
      />
      <Drawer.Screen
        name="Health Ed."
        component={HealthEducationScreen}
        options={{ drawerIcon: ({ color }) => <Ionicons name="book" size={22} color={color} /> }}
      />
      <Drawer.Screen
        name="My Records"
        component={HealthRecordsScreen}
        options={{ drawerIcon: ({ color }) => <Ionicons name="folder" size={22} color={color} /> }}
      />
      <Drawer.Screen
        name="Financial Aid"
        component={FinancialSupportScreen}
        options={{ drawerIcon: ({ color }) => <Ionicons name="cash" size={22} color={color} /> }}
      />
    </Drawer.Navigator>
  );
};

export default PatientNavigator;
