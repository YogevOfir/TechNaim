import React from 'react';
import { View, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigationTypes';

// Define the navigation type for this screen
type AdminScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Admin'>;

const AdminScreen = () => {
  const navigation = useNavigation<AdminScreenNavigationProp>();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Admin Dashboard</Text>
      <Text>Manage Technicians</Text>
      <Button
        title="Create Technician"
        onPress={() => navigation.navigate('AdminCreateTechnician')} // This is type-safe now
      />
    </View>
  );
};

export default AdminScreen;
