import { StyleSheet, Dimensions } from 'react-native';

export const customerStyles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#f0f6ff',
    },
    scrollGeneralContainer: {
        // flexGrow: 1,
        backgroundColor: '#f0f6ff',
        padding: 20,
        // paddingHorizontal: 20,
        // paddingVertical: 20
      },
    icon: {
        marginBottom: 10,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionBox: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    infoLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#444',
        marginBottom: 5,
    },
    infoText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
    },
    info: {
        fontSize: 16,
        color: '#34495e',
        marginBottom: 10,
        textAlign: 'center',
      },
      header: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2c3e50',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'left',
      },
    map: {
        width: Dimensions.get('window').width - 40,
        height: 250,
        borderRadius: 10,
        marginBottom: 10,
    },
    loadingText: {
        fontSize: 14,
        color: '#888',
        marginBottom: 10,
    },
    queueText: {
        fontSize: 16,
        color: '#8e44ad',
        fontWeight: '600',
        marginTop: 5,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
        marginVertical: 10,
        color: '#2c3e50',
    },
    appointmentCard: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        width: '100%',
    },
    companyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#27ae60',
        marginBottom: 5,
        textAlign: 'center',
    },
    noAppointmentText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
    },
    logo: {
        width: 300,
        height: 300,
        marginBottom: 20,
    },
    techTabsContainer: {
        paddingVertical: 10,
      },
      techTab: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 10,
        marginRight: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      techTabText: {
        fontSize: 16,
        fontWeight: 'bold',
      },
      techTabSubText: {
        fontSize: 12,
        color: '#666',
      },
      headerContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        alignSelf: 'stretch',
      },
      logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e74c3c', // red color for logout
        padding: 8,
        borderRadius: 5,
      },
      logoutButtonText: {
        color: '#fff',
        marginLeft: 5,
        fontSize: 16,
        fontWeight: '600',
      },
});
