import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import io from 'socket.io-client';

interface LocationData {
  technicianId: string;
  lat: number;
  lng: number;
}

const socket = io('http://10.0.0.14:5000/customer'); 


const CustomerScreen = ({route}: {route: any}) => {
  const { user } = route.params;
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  useEffect(() => {
    socket.on('locationUpdate', (data) => {
      console.log('Received location update:', data);
      setLocationData(data);
    });

    return () => { socket.disconnect(); };
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Hello {user.name} </Text>
      {locationData && (
        <Text>
          Technician {locationData.technicianId} is at ({locationData.lat}, {locationData.lng})
        </Text>
      )}
    </View>
  );
};

export default CustomerScreen;
