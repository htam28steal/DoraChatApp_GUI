import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import bg from '../assets/bg.png';

const LoginScreen = () => {
  const navigation = useNavigation();

  const handleNext = () => {
    navigation.navigate("OtpScreen"); // Navigate to OtpScreen
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
          <TextInput 
            style={styles.usernameInput} 
            placeholder="Enter your mail or phone" 
            placeholderTextColor="#666"
          />
        </View>

        {/* Next Button */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleNext}>
          <Image source={require('../icons/next.png')} style={styles.loginImage} />
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
        
        {/* Sign In Section */}
        <View style={styles.signInSection}>
          <Text style={styles.noAccountText}>Already have an account? </Text>
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
