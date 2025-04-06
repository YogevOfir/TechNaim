// // MapWithETA.tsx
// import React, { useState, useEffect } from 'react';
// import { View, Text, Button, Linking, StyleSheet, ActivityIndicator } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';

// interface Coordinates {
//   lat: number;
//   lng: number;
// }

// interface MapWithETAProps {
//   technicianLocation: Coordinates;
//   destinationLocation: Coordinates;
// }

// const MapWithETA: React.FC<MapWithETAProps> = ({ technicianLocation, destinationLocation }) => {
//   const [eta, setEta] = useState<number | null>(null);
//   const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

//   useEffect(() => {
//     // Call OSRM API to fetch route and travel duration.
//     const fetchRoute = async () => {
//       try {
//         // OSRM expects lng,lat order
//         const url = `https://router.project-osrm.org/route/v1/driving/${technicianLocation.lng},${technicianLocation.lat};${destinationLocation.lng},${destinationLocation.lat}?overview=full&geometries=geojson`;
//         const response = await fetch(url);
//         const data = await response.json();
//         if (data.routes && data.routes.length > 0) {
//           const route = data.routes[0];
//           // duration is in seconds – convert to minutes and round up.
//           setEta(Math.ceil(route.duration / 60));
//           // Convert route geometry into coordinates for Polyline.
//           const coords = route.geometry.coordinates.map((coord: number[]) => ({
//             longitude: coord[0],
//             latitude: coord[1]
//           }));
//           setRouteCoords(coords);
//         }
//       } catch (error) {
//         console.error('Error fetching route:', error);
//       }
//     };

//     fetchRoute();
//   }, [technicianLocation, destinationLocation]);

//   const openWaze = () => {
//     const url = `waze://?ll=${destinationLocation.lat},${destinationLocation.lng}&navigate=yes`;
//     Linking.openURL(url).catch(err => console.error('Error opening Waze', err));
//   };

//   return (
//     <View style={styles.mapContainer}>
//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: technicianLocation.lat,
//           longitude: technicianLocation.lng,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//         // To use OSM tiles, you can customize the map provider (if needed)
//       >
//         <Marker
//           coordinate={{ latitude: technicianLocation.lat, longitude: technicianLocation.lng }}
//           title="Technician"
//         />
//         <Marker
//           coordinate={{ latitude: destinationLocation.lat, longitude: destinationLocation.lng }}
//           title="Destination"
//         />
//         {routeCoords.length > 0 && (
//           <Polyline coordinates={routeCoords} strokeColor="#0000FF" strokeWidth={3} />
//         )}
//       </MapView>
//       <View style={styles.infoContainer}>
//         {eta !== null ? (
//           <Text>Estimated Arrival Time: {eta} minute{eta === 1 ? '' : 's'}</Text>
//         ) : (
//           <ActivityIndicator size="small" />
//         )}
//         <Button title="Open in Waze" onPress={openWaze} />
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   mapContainer: {
//     height: 300,
//     width: '100%',
//     marginVertical: 10,
//   },
//   map: {
//     flex: 1,
//   },
//   infoContainer: {
//     padding: 10,
//     alignItems: 'center',
//   },
// });

// export default MapWithETA;
