import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ImageBackground, ActivityIndicator } from 'react-native';
import bg from '../Images/bground.png';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from '../api/apiConfig'; // Make sure this points to your axios config
import Toast from "react-native-toast-message";

const OtpScreens = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerifyOtp = async () => {
    setErrorMsg("");
    if (!otp.trim()) {
      setErrorMsg("Please enter the OTP code.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/auth/verify-otp", {
        contact: email,
        otp: otp.trim(),
      });

      if (response.status === 200) {
        // Success! Do whatever next step is (navigate, show success, etc.)
        // For example, navigate to a success or home screen:
        navigation.navigate("LoginScreen"); // Change this to your next screen
              Toast.show({
                type: "success",
                text1: "Sign up successfully",
              });
      } else {
        setErrorMsg("Verification failed. Please try again.");
      }
    } catch (err) {
      // Optional: get error message from server if available
      const serverMsg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string"
          ? err.response.data
          : "Verification failed. Please try again.");
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate("LoginScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={bg} style={styles.gradient} resizeMode="cover">
        {/* Logo & Slogan */}
        <View style={styles.banner}>
          <Image source={require('../Images/logoDoRa.png')} style={styles.logo} />
          <Text style={styles.statement}>Everywhere you want to be</Text>
        </View>

        {/* Input Fields */}
        <View style={styles.loginSection}>
          <Text style={styles.instructions}>
            Enter the OTP code sent to your Email or phone number
          </Text>
          <TextInput 
            style={styles.usernameInput} 
            placeholder="Your OTP code" 
            placeholderTextColor="#666"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        </View>

        {/* Next Button */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleVerifyOtp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Image source={require('../icons/next.png')} style={styles.loginImage} />
              <Text style={styles.nextText}>Next</Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* Sign In Section */}
        <View style={styles.signInSection}>
          <Text style={styles.noAccountText}>Already had an account? </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.signInText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  banner: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statement: {
    color: "#FFBD59",
    fontSize: 12,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 0,
    fontWeight: 'bold',
  },
  logo: {
    width: 300,
    height: 60,
    marginBottom: 15,
  },
  loginSection: {
    width: '100%',
    alignItems: 'center',
    height: 110,
    marginBottom: 10,
  },
  instructions: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 5,
  },
  usernameInput: {
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 30,
    width: 320,
    height: 33,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#333',
    paddingLeft: 10,
    paddingTop: 5,
    paddingBottom: 5,
    marginBottom: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 0,
    marginBottom: 5,
    marginLeft: 5,
    alignSelf: 'flex-start',
  },
  loginBtn: {
    backgroundColor: '#086DC0',
    width: 100,
    height: 40,
    justifyContent: 'center',
    borderRadius: 20,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginImage: {
    width: 20,
    height: 20,
  },
  nextText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 7,
  },
  signInSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  noAccountText: {
    fontSize: 12,
  },
  signInText: {
    fontSize: 14,
    color: '#086DC0',
    fontWeight: 'bold',
  },
});

export default OtpScreens;
