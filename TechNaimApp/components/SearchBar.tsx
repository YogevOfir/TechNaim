import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Keyboard,
    TouchableWithoutFeedback,
    TextInput
} from 'react-native';
import AppointmentCard from './AppointmentCard';

interface AppointmentCardProps {
    appointment: {
        _id: string;
        customerId?: {
            _id: string;
            name: string;
            phone: string;
            address: string;
            country_id: string;
        };
        technicianId?: {
            _id: string;
            companyId: { name: string };
            userId: { name: string; phone: string; country_id: string };
        };
        scheduledTime: string;
        notes?: string;
    };
}

interface SearchBarProps {
    appointments: AppointmentCardProps['appointment'][];
}

const SearchBar: React.FC<SearchBarProps> = ({ appointments }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRoleToSearch, setselectedRoleToSearch] = useState<string | null>(null);
    const [id, setId] = useState('');
    const [showAppointments, setShowAppointments] = useState<AppointmentCardProps['appointment'][]>([]);

    const options: string[] = ['Technician', 'Customer', 'All'];

    const handleSelect = (item: string) => {
        setselectedRoleToSearch(item);
        setIsOpen(false);
    };

    const getCards = async (selectedRoleToSearch: string | null, id: string): Promise<void> => {
        if (!selectedRoleToSearch) {
            alert('Please select a role');
            return;
        }
        if (!id) {
            alert('Please enter a valid Id');
            return;
        }

        console.log('SelectedRole:', selectedRoleToSearch, 'id:', id);

        let searchedAppointments = appointments.filter(app =>
            selectedRoleToSearch === 'Technician'
                ? app.technicianId?.userId.country_id.toString() === id
                : selectedRoleToSearch === 'Customer'
                ? app.customerId?.country_id.toString() === id
                : app.technicianId?.userId.country_id.toString() === id || app.customerId?.country_id.toString() === id
        );
        
        console.log('searchedAppointments:', searchedAppointments);

        setShowAppointments(searchedAppointments);
    };


    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                {/* Row with button, input, and role dropdown */}
                <View style={styles.row}>
                    {/* Search Button */}
                    <TouchableOpacity
                        onPress={() => getCards(selectedRoleToSearch, id)}
                        style={styles.getCardsButton}
                    >
                        <Text style={styles.getCardsButtonText}>Search</Text>
                    </TouchableOpacity>

                    {/* ID Input */}
                    <TextInput
                        placeholder='ID'
                        value={id}
                        onChangeText={setId}
                        style={styles.input}
                        keyboardType='phone-pad'
                    />

                    {/* Role Dropdown */}
                    <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => setIsOpen(!isOpen)}
                    >
                        <Text style={styles.dropdownText}>
                            {selectedRoleToSearch || 'Select a Role'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Dropdown List */}
                {isOpen && (
                    <View style={styles.dropdownList}>
                        <FlatList
                            horizontal
                            data={options}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleSelect(item)}>
                                    <Text style={styles.listItem}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Appointment Results */}
                {showAppointments.length > 0 && (
                    <View style={{ marginTop: 20 }}>
                        {showAppointments.map((appointment) => (
                            <AppointmentCard key={appointment._id} appointment={appointment} role={'Admin'} />
                        ))}
                    </View>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        width: '100%',
    },
    row: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    dropdown: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        backgroundColor: '#fff',
        minWidth: 110,
    },
    dropdownText: {
        fontSize: 16,
    },
    dropdownList: {
        marginTop: 5,
        paddingHorizontal: 10,
    },
    listItem: {
        padding: 10,
        fontSize: 16,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 4,
        backgroundColor: '#f8f8f8',
    },
    input: {
        flex: 1,
        marginHorizontal: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
    getCardsButton: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#007BFF',
        borderRadius: 5,
        alignItems: 'center',
    },
    getCardsButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});

export default SearchBar;
