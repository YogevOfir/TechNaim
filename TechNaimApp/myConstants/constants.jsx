import Constants from 'expo-constants';

const ConstantsConfig = {
    expoConfig: {
        extra: {
            googleMapsApiKey: Constants.expoConfig.extra.googleMapsApiKey, // Dynamically loaded
        },
    },
};

export default ConstantsConfig;