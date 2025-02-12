import { StyleSheet } from 'react-native';

export const signupStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
      },
      keyboardAvoidingView: {
        flex: 1,
      },
      contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
      },
      headerContainer: {
        marginBottom: 40,
        alignItems: 'center',
      },
      title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
      },
      subtitle: {
        fontSize: 16,
        color: '#666',
      },
      inputContainer: {
        marginBottom: 20,
      },
      inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 15,
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
      inputIcon: {
        marginRight: 10,
      },
      input: {
        flex: 1,
        height: 50,
        color: '#333',
        fontSize: 16,
      },
      eyeIcon: {
        padding: 10,
      },
      signupButton: {
        backgroundColor: '#007AFF',
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#007AFF',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      signupButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
      },
      loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      },
      loginText: {
        color: '#666',
        fontSize: 16,
      },
      loginLink: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
      },
});