// AppointmentCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AppointmentCardProps {
    appointment: {
        _id: string;
        customerId?: {
            name: string;
            phone: string;
            address: string;
            country_id: string,
        };
        technicianId?: {
            companyId: { name: string };
            userId: { name: string; phone: string, country_id: string, };
        };
        scheduledTime: string;
        notes?: string;
    };
    role: 'Technician' | 'Customer' | 'Admin';
    onComplete?: (appointmentId: string) => Promise<void>; // Allow a function or undefined
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, role, onComplete = null }) => {
    return (
        <View key={appointment._id} style={styles.appointmentCard}>
            {/* Technician Role - show customer info only */}
            {role === 'Technician' && appointment.customerId && (
                <>
                    <Text style={styles.companyTitle}>🙎‍♂️Customer Name: {appointment.customerId.name}</Text>
                    <Text>📞Phone: {appointment.customerId.phone}</Text>
                    <Text>📍Address: {appointment.customerId.address}</Text>
                    {appointment.notes && <Text>📝Notes: {appointment.notes}</Text>}
                </>
            )}

            {/* Customer Role - show technician info only */}
            {role === 'Customer' && appointment.technicianId && (
                <>
                    <Text style={styles.companyTitle}>🏢Company: {appointment.technicianId.companyId.name}</Text>
                    <Text>🔧Technician Name: {appointment.technicianId.userId.name}</Text>
                    <Text>📞Phone: {appointment.technicianId.userId.phone}</Text>
                </>
            )}

            {/* Admin Role - show everything */}
            {role === 'Admin' && (
                <>
                    {appointment.customerId ? (
                        <>
                            <Text style={styles.companyTitle}>
                                🙎‍♂️ Customer Name: {appointment.customerId.name ?? "N/A"}
                            </Text>
                            <Text>
                                📞 Phone: {appointment.customerId.phone ?? "N/A"}
                            </Text>
                            <Text>
                                📍 Address: {appointment.customerId.address ?? "N/A"}
                            </Text>
                            {appointment.notes && (
                                <Text>
                                    📝 Notes: {appointment.notes}
                                </Text>
                            )}
                            <Text>
                                🆔 Customer ID: {appointment.customerId.country_id ?? "N/A"}
                            </Text>
                        </>
                    ) : (
                        <Text>No customer data available.</Text>
                    )}

                    {appointment.technicianId ? (
                        <>
                            <Text>
                                🔧 Technician Name: {appointment.technicianId.userId?.name ?? "N/A"}
                            </Text>
                            <Text>
                                📞 Phone: {appointment.technicianId.userId?.phone ?? "N/A"}
                            </Text>
                            <Text>
                                🆔 Technician ID: {appointment.technicianId.userId?.country_id ?? "N/A"}
                            </Text>
                        </>
                    ) : (
                        <Text>No technician data available.</Text>
                    )}
                </>
            )}


            {/* Scheduled Time */}
            <Text>🕒Scheduled Time: {new Date(appointment.scheduledTime).toLocaleString()}</Text>

            {onComplete && (
                <TouchableOpacity onPress={() => onComplete(appointment._id)} style={styles.finishAppointmentButton}>
                    <Text style={styles.finishAppointmentButtonText}>Complete Task</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    appointmentCard: {
        padding: 15,
        margin: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    companyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    finishAppointmentButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#007BFF',
        borderRadius: 5,
        alignItems: 'center',
    },
    finishAppointmentButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});

export default AppointmentCard;