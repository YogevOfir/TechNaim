import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import CustomerScreen from '../screens/CustomerScreen';
import TechnicianScreen from '../screens/TechnicianScreen';
import AdminScreen from '../screens/AdminScreen';
import AdminCreateTechnicianScreen from '../screens/AdminCreateTechnicianScreen';
import AdminCreationScreen from '../screens/AdminCreationScreen';
import { RootStackParamList } from '../types/navigationTypes'; 
import CreateAppointmentScreen from '../screens/CreateAppointmentScreen';


const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Technician" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Customer" component={CustomerScreen} />
      <Stack.Screen name="Technician" component={TechnicianScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="AdminCreateTechnician" component={AdminCreateTechnicianScreen} />
      <Stack.Screen name="AdminCreation" component={AdminCreationScreen} options={{title: 'Create Admin'}} />
      <Stack.Screen name="CreateAppointment" component={CreateAppointmentScreen} options={{title: 'Create Appointment'}} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
