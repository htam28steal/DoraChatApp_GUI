import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Button,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from '../api/apiConfig';
// Import your assets – adjust the paths as needed
import Logo from '../Images/logoDoRa.png';



// A spinner component using the built-in ActivityIndicator.
const Spinner = () => {
  return <ActivityIndicator size="large" color="#0000ff" />;
};

// A simple form component for the reset password step.
// It uses a TextInput for the email and a Button to trigger the submission.
const ResetPassStep1Form = ({ email, setEmail, onSubmit }) => {
  return (
    <View style={styles.formContainer}>
      <TextInput
        style={styles.input}
        placeholder="Enter your email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button title="Reset Password" onPress={onSubmit} />
    </View>
  );
};

export default function ResetPassStep1Page() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  async function handleResetStep1() {
    setLoading(true);

    // Validate email is provided
    // if (!email) {
    //   Alert.alert('Error', 'Please enter your email address');
    //   setLoading(false);
    //   return;
    // }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      console.log('Email:', email);
      const response = await axios.post('/api/auth/verify-email-forgot-password',{email});
      console.log('API response:', response);

      if (!response || response.error) {
        Alert.alert('Error', 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      } else {
        Alert.alert('Success', 'Verification code sent to your email!');
        // Navigate to the ResetPassword screen (make sure your navigator has this route)
        navigation.navigate('ResetPasswordStep2Screen', { email });
      }
    } catch (error) {
      console.log('Error response:', error);
      const errorMessage =
        error.response?.data?.message ||
        (typeof error.response?.data === 'string'
          ? error.response.data
          : 'Please try again.');
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Left Panel: Form and text */}
        <View style={styles.leftPanel}>
          <View style={styles.innerContainer}>
            {/* Login Link */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>You had an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image source={Logo} style={styles.logo} />
            </View>

            {/* Welcome Text */}
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>
                We&apos;re super excited to have you join our community.
              </Text>
              <Text style={styles.welcomeText}>
                Let&apos;s dive into some fun conversations together!
              </Text>
            </View>


            {/* Conditional rendering for loading spinner or form */}
            {loading ? (
              <Spinner />
            ) : (
              <ResetPassStep1Form
                email={email}
                setEmail={setEmail}
                onSubmit={handleResetStep1}
              />
            )}
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
  rightPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Optionally hide or adjust on smaller screens
  },
  banner: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 10,
  },
});
