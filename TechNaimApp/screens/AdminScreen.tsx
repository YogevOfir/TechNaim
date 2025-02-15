import React from 'react';
import { View, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigationTypes';
import { TextInput } from 'react-native-gesture-handler';

// Define the navigation type for this screen
type AdminScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Admin'>;

interface AdminScreenProps {
    route: { params: { user: any } };
    }

const AdminScreen = ({route}: AdminScreenProps) => {
  const navigation = useNavigation<AdminScreenNavigationProp>();
  const { user } = route.params;

  return (
    <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'column' }}>
      <Text>Welcome {user.name}</Text>
      <Button 
        title="Create New Technician" 
        onPress={() => navigation.navigate('AdminCreateTechnician', { user })}
      />
      <Button 
        title="Create new Appointment" 
        onPress={() => navigation.navigate('CreateAppointment', { user })}
      />
    </View>
  );
};

export default AdminScreen;
