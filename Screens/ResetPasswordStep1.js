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
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from '../api/apiConfig';
import Logo from '../Images/logoDoRa.png';

const Spinner = () => {
  return <ActivityIndicator size="large" color="#0000ff" />;
};

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/verify-email-forgot-password', { email });
      if (!response || response.error) {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } else {
        Alert.alert('Success', 'Verification code sent to your email!');
        navigation.navigate('ResetPasswordStep2Screen', { email });
      }
    } catch (error) {
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
    <ImageBackground 
      source={require('../Images/bground.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.leftPanel}>
          <View style={styles.innerContainer}>
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>You had an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.logoContainer}>
              <Image source={Logo} style={styles.logo} />
            </View>

            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>
                We're super excited to have you join our community.
              </Text>
              <Text style={styles.welcomeText}>
                Let's dive into some fun conversations together!
              </Text>
            </View>

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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  leftPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    width: '90%',
    paddingBottom: 220,
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
    textAlign: 'center',
    marginBottom: 5,
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
    backgroundColor: 'white', // Ensure input is visible
  },
});