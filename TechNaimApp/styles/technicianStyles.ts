import { StyleSheet } from 'react-native';

export const technicianStyles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#f0f6ff',
        padding: 20,
        alignItems: 'center',
      },
      scrollGeneralContainer: {
        // flexGrow: 1,
        backgroundColor: '#f0f6ff',
        padding: 20,
        // paddingHorizontal: 20,
        // paddingVertical: 20
      },
      title: {
        marginTop: 40,
        fontSize: 26,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 10,
      },
      status: {
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 20,
        color: '#333',
      },
      button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginVertical: 8,
        alignSelf: 'center',
      },
      buttonIcon: {
        marginRight: 10,
      },
      buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
      },
      sectionHeader: {
        // center the text
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 25,
        marginBottom: 10,
      },
      appointmentCard: {
        padding: 15,
        marginBottom: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      companyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#007AFF',
        marginBottom: 5,
        textAlign: 'center',
      },
      infoText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 3,
      },
      noAppointments: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
      },
      queueContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#e6f0ff',
        borderRadius: 10,
      },
      queueItem: {
        paddingVertical: 5,
      },
      modalContainer: {
        flex: 1,
        padding: 20,
      },
      modalScrollContent: {
        padding: 20,
        minHeight: '100%',
      },
      detailsContainer: {
        marginTop: 20,
      },
      scrollContainer: {
        marginVertical: 10,
      },
      closeButton: {
        marginTop: 10,
        alignSelf: 'center',
      },
      closeText: {
        color: '#007AFF',
        fontWeight: 'bold',
        fontSize: 16,
      },
      logo: {
        width: 300,
        height: 300,
        marginBottom: 20,
      },
});