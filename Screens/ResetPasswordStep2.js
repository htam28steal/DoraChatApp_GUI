import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Button,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import bg from '../Images/bground.png';

// Adjust asset paths as needed
import Logo from '../Images/logoDoRa.png';

// Import your API configuration (adjust the path accordingly)
import axios from '../api/apiConfig';

// Simple progress step indicator component
const ProgressSteps = ({ currentStep }) => {
  return (
    <View style={styles.progressSteps}>
      <Text>Step {currentStep} of 3</Text>
    </View>
  );
};

// A spinner component using the built-in ActivityIndicator
const Spinner = () => {
  return <ActivityIndicator size="large" color="#0000ff" />;
};

// A simple form component for the reset password step.
// This form collects the OTP, new password, and retype new password.
const ResetPassStep2Form = ({ onSubmit }) => {
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');

  const handleSubmit = () => {
    if (password !== retypePassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    // Call the parent's onSubmit with the form data.
    // The key "retypepassword" is used here for consistency.
    onSubmit({ otp, password, retypepassword: retypePassword });
  };

  return (
    <View style={styles.formContainer}>
      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter New Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Retype New Password"
        value={retypePassword}
        onChangeText={setRetypePassword}
        secureTextEntry
      />
      <Button title="Reset Password" onPress={handleSubmit} />
    </View>
  );
};

export default function ResetPassStep2Page() {
  const navigation = useNavigation();
  const route = useRoute();
  // Retrieve email passed via navigation parameters
  const { email } = route.params || {};
  const [loading, setLoading] = useState(false);
  const handleResetStep2 = async (formData) => {
    setLoading(true);
    try {
      // Ensure you send only the fields required by your API
      const submitData = {
        otp: formData.otp,
        newPassword: formData.password, // Changed key as per backend expectations
        email,                         // Ensure email is included if required
      };
  
      console.log('Submit Data:', submitData);
      const response = await axios.post('/api/auth/forgot-password', submitData);
  
      if (!response || response.error) {
        Alert.alert('Error', response?.data?.message || 'Something went wrong. Please try again.');
        return;
      } else {
        Alert.alert('Success', 'Information saved successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (error) {
      console.log('Error response:', error.response);
      const errorMessage =
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : 'Please try again.');
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Left side - Form section */}
        <View style={styles.leftPanel}>
          <View style={styles.innerContainer}>
            {/* Login link */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>You had an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image source={Logo} style={styles.logo} />
            </View>

            {/* Welcome text */}
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>
                We&apos;re super excited to have you join our community.
              </Text>
              <Text style={styles.welcomeText}>
                Let&apos;s dive into some fun conversations together!
              </Text>
            </View>

            <ProgressSteps currentStep={2} />

            {/* Show spinner if loading; otherwise display form */}
            {loading ? <Spinner /> : <ResetPassStep2Form onSubmit={handleResetStep2} />}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D8EDFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    flexDirection: 'row',
    width: '100%',
    flex: 1,
  },
  leftPanel: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    width: '80%',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: 'black',
  },
  loginLink: {
    fontSize: 14,
    color: 'blue',
    marginLeft: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 350,
    height: 65,
    resizeMode: 'contain',
  },
  welcomeTextContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeText: {
    color: 'gray',
    textAlign: 'center',
    marginBottom: 5,
  },
  progressSteps: {
    alignItems: 'center',
    marginBottom: 20,
  },
  formContainer: {
    marginVertical: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});
