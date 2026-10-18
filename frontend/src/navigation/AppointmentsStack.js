import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AppointmentsScreen from '../screens/patient/AppointmentsScreen';
import BookAppointmentScreen from '../screens/patient/BookAppointmentScreen';

const Stack = createStackNavigator();

const AppointmentsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppointmentsList" component={AppointmentsScreen} />
      <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
    </Stack.Navigator>
  );
};

export default AppointmentsStack;
