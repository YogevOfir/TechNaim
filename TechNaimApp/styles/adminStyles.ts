import { StyleSheet, Dimensions } from 'react-native';

export const adminStyles = StyleSheet.create({
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
  logo: {
    width: 300,
    height: 300,
    marginBottom: 20,
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
  welcome: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center'
  }


});
