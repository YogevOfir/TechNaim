import { StyleSheet } from 'react-native';

export const createAppointmentStyles = StyleSheet.create({

    container: {
        flexGrow: 1,
        backgroundColor: '#f0f6ff',
    },
    scrollGeneralContainer: {
        // flexGrow: 1,
        backgroundColor: '#f0f6ff',
        padding: 20,
        // paddingHorizontal: 20,
        // paddingVertical: 20
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    buttonWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginTop: 3,
        paddingHorizontal: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    notesTextHeader: {
        marginTop: 20,
         marginBottom:3
    },
    notesHolder: {
        height: 100,
        padding: 15, // Match padding with buttonWrapper
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 10, // Add rounded corners like buttonWrapper
        backgroundColor: '#fff', // Match background color with buttonWrapper
        elevation: 2, // Add shadow to match buttonWrapper
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    cancelButton: {
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
      },
      cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
      },
});