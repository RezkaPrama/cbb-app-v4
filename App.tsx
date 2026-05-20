import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import Toast from 'react-native-toast-message';
import Routes from './app/navigations/Route';
import Store from './app/redux/Store/Store';

const App = () => {
  const [fontsLoaded] = useFonts({
    'NunitoSans-Bold': require('./app/assets/fonts/NunitoSans-Bold.ttf'),
    'NunitoSans-Regular': require('./app/assets/fonts/NunitoSans-Regular.ttf'),
    'Poppins-SemiBold': require('./app/assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Medium': require('./app/assets/fonts/Poppins-Medium.ttf'),
  });

  if (!fontsLoaded) {
    return null; // Atau loading component
  }

  return (
    <Provider store={Store}>
        <Routes />
        {/* <StatusBar translucent backgroundColor="transparent" /> */}
        <StatusBar style="dark" />
        <Toast />
      </Provider>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;