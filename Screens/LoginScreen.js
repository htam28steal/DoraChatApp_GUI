import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ImageBackground, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import bg from '../Images/bground.png';
import { authService } from '../api/authService'; // Giữ import này

const LoginScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('handleLogin started');
    if (!username || !password) {
      console.log('Validation failed');
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }
    console.log('Data sent to API:', { username, password });
    try {
      setLoading(true);
      const response = await authService.login(username, password); // Gọi authService.login
      if (response && response.data?.token) { // Kiểm tra token
        const accessToken = response.data?.token; // Access token
        const refreshToken = response.data?.refreshToken; // Refresh token
        // Log để kiểm tra
        await AsyncStorage.setItem('userToken', accessToken);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data?.user || {}));
        const userStorage = await AsyncStorage.getItem('userData');
        console.log('User data stored:', userStorage);
        const user = JSON.parse(userStorage);

        console.log('User data stored Object:', user);
        console.log('User Id:', user._id);

        navigation.navigate("WelcomeScreen", { token: accessToken });
      } else {

      }
    } catch (error) {
      console.log('Login error:', error); // Log lỗi
      Alert.alert('Login Failed', error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
      console.log('handleLogin finished');
    }
  };

  const handleSignup = () => {
    navigation.navigate("SignupScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={bg} style={styles.gradient} resizeMode="cover">
        <View style={styles.banner}>
          <Image source={require('../Images/logoDoRa.png')} style={styles.logo} />
          <Text style={styles.statement}>Everywhere you want to be</Text>
        </View>
        <View style={styles.loginSection}>
          <TextInput
            style={styles.usernameInput}
            placeholder="Username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.pwdInput}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.forgotPasswordBtn}>
            <Text style={styles.forgotPasswordText}>Forgot password</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => {
            console.log('Login button pressed');
            handleLogin();
          }}
        >
          <Image source={require('../icons/loginBtn.png')} style={styles.loginImage} />
        </TouchableOpacity>
        <View style={styles.signUpSection}>
          <Text style={styles.noAccountText}>You don't have an account? </Text>
          <TouchableOpacity onPress={handleSignup}>
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.googleSignInBtn}>
          <Image source={require('../icons/google_icon.png')} style={styles.googleIcon} />
          <Text style={styles.googleSignInText}>Sign in with Google</Text>
        </TouchableOpacity>
      </ImageBackground>
    </SafeAreaView>
  );
};

// Styles giữ nguyên
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  banner: {
    alignItems: 'center',
    marginBottom: 40
  },
  statement: {
    color: "#FFBD59",
    fontSize: 12,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 0,
    fontWeight: 'bold'
  },
  logo: {
    width: 300,
    height: 60,
    marginBottom: 15
  },
  loginSection: {
    width: '100%',
    alignItems: 'center',
    height: 115
  },
  usernameInput: {
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 10,
    width: 285,
    height: 33,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#333',
    paddingLeft: 10,
    paddingTop: 5,
    paddingBottom: 5,
    marginBottom: 20
  },
  pwdInput: {
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 10,
    width: 285,
    height: 33,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#333',
    paddingLeft: 10,
    paddingTop: 5,
    paddingBottom: 5,
    marginBottom: 20
  },
  forgotPasswordBtn: {
    position: 'absolute',
    right: 40,
    bottom: 0
  },
  forgotPasswordText: {
    color: '#086DC0',
    textDecorationLine: 'underline',
    fontSize: 12
  },
  loginBtn: {
    backgroundColor: '#D8EDFF',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    marginTop: 15,
    marginBottom: 30
  },
  loginImage: {
    width: 30,
    height: 30
  },
  signUpSection: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  noAccountText: {
    fontSize: 12
  },
  signUpText: {
    fontSize: 14,
    color: '#F49300',
    fontWeight: 'bold'
  },
  googleSignInBtn: {
    backgroundColor: '#fff',
    width: 285,
    height: 47,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 30,
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#dcdcdc'
  },
  googleIcon: {
    marginRight: 10,
    width: 20,
    height: 20
  },
  googleSignInText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000000'
  },
});

export default LoginScreen;