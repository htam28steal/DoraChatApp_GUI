import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView, ImageBackground } from 'react-native';
import bg from '../Images/bground.png';

const LoginScreen = () => {
  const handleLogin = () => {
    Alert.alert("Login Pressed", "Implement authentication here!");
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
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Image source={require('../icons/next.png')} style={styles.loginImage} />
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
        
        {/* Sign In Section */}
        <View style={styles.signInSection}>
          <Text style={styles.noAccountText}>Already had an account? </Text>
          <TouchableOpacity>
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
    height: 80,
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
  },
  loginBtn: {
    backgroundColor: '#086DC0',
    width: 100,
    height: 40,
    justifyContent: 'center',
    borderRadius: 20,
    marginTop: 15,
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

export default LoginScreen;
