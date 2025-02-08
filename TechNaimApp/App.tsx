import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import CustomerScreen from './screens/CustomerScreen';
import TechnicianScreen from './screens/TechnicianScreen';
import AdminScreen from './screens/AdminScreen';
import AdminCreateTechnician from './screens/AdminCreateTechnician';

// Import types for navigation
import { RootStackParamList } from './types/navigationTypes'; 

// Create a stack navigator with types
const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Customer" component={CustomerScreen} />
        <Stack.Screen name="Technician" component={TechnicianScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="AdminCreateTechnician" component={AdminCreateTechnician} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
