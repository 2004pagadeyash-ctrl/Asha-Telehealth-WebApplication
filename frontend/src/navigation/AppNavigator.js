import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Role Navigators (will be created later)
import PatientNavigator from './PatientNavigator';
import DoctorNavigator from './DoctorNavigator';
import AshaNavigator from './AshaNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            {user.role === 'patient' && <Stack.Screen name="PatientApp" component={PatientNavigator} />}
            {user.role === 'doctor' && <Stack.Screen name="DoctorApp" component={DoctorNavigator} />}
            {user.role === 'asha' && <Stack.Screen name="AshaApp" component={AshaNavigator} />}
            {user.role === 'admin' && <Stack.Screen name="AdminApp" component={AdminNavigator} />}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppNavigator;
