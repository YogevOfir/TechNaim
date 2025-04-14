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
        ? app.technicianId?.userId.country_id.toString() === id.toString()
        : selectedRoleToSearch === 'Customer'
        ? app.customerId?.country_id.toString() === id.toString()
        : app.technicianId?.userId.country_id.toString() === id.toString() || app.customerId?.country_id.toString() === id.toString()
    );
    
    console.log('searchedAppointments:', searchedAppointments);

    setShowAppointments(searchedAppointments);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Row containing the ID input and role dropdown */}
        <View style={styles.inputRow}>
          <TextInput
            placeholder='Enter ID'
            value={id}
            onChangeText={setId}
            style={styles.input}
            keyboardType= 'phone-pad'
          />
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setIsOpen(!isOpen)}
          >
            <Text style={styles.dropdownText}>
              {selectedRoleToSearch || 'Select a Role'}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Search Button placed below the row */}
        <TouchableOpacity
          onPress={() => getCards(selectedRoleToSearch, id)}
          style={styles.searchButton}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>

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
  // Row: input and dropdown in left-to-right order.
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    height: 50,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  dropdown: {
    padding: 10,
    height: 50,
    minWidth: 110,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
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
  // Search button styles
  searchButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SearchBar;
