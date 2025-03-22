import React, { useState } from 'react'; // Import useState
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ImageBackground, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import bg from '../Images/bground.png';
import api from '../api/apiConfig'; // If you plan to use it for API calls, make sure it's properly set up.

const LoginScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState(''); // State for username
  const [password, setPassword] = useState(''); // State for password
  const [loading, setLoading] = useState(false); // State for loading (if you want to show loading spinner later)

  const handleLogin = async () => {
    // Step 1: Check if username and password are entered
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return; // Do not continue if validation fails
    }
  
    try {
      // Step 2: Set loading state to true
      setLoading(true);
  
      // Step 3: Send the login request
      const response = await api.post('/auth/login', {
        username,
        password
      });
  
      // Step 4: If login is successful, store user data and token in AsyncStorage
      if (response.data && response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
  
        // Step 5: Navigate to the WelcomeScreen
        navigation.navigate("WelcomeScreen");
      } else {
        // If no token is returned, something went wrong
        Alert.alert('Error', 'Invalid username or password');
      }
    } catch (error) {
      // Step 6: Handle any errors from the API request
      Alert.alert(
        'Login Failed',
        error.response?.data?.message || 'An error occurred during login'
      );
    } finally {
      // Step 7: Set loading state back to false after the request is done
      setLoading(false);
    }
  };
  
  const handleSignup = () => {
    navigation.navigate("SignupScreen"); // Navigate to SignupScreen (update if needed)
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
            placeholder="Username" 
            placeholderTextColor="#666"
            value={username} // Bind username state to input field
            onChangeText={setUsername} // Update state when input changes
          />
          <TextInput 
            style={styles.pwdInput} 
            placeholder="Password" 
            placeholderTextColor="#666"
            secureTextEntry={true}
            value={password} // Bind password state to input field
            onChangeText={setPassword} // Update state when input changes
          />
          <TouchableOpacity style={styles.forgotPasswordBtn}>
            <Text style={styles.forgotPasswordText}>Forgot password</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Image source={require('../icons/loginBtn.png')} style={styles.loginImage} />
        </TouchableOpacity>
        
        {/* Sign Up Section */}
        <View style={styles.signUpSection}>
          <Text style={styles.noAccountText}>You don't have an account? </Text>
          <TouchableOpacity onPress={handleSignup}>
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Google Sign In Button */}
        <TouchableOpacity style={styles.googleSignInBtn}>
          <Image source={require('../icons/google_icon.png')} style={styles.googleIcon} />
          <Text style={styles.googleSignInText}>Sign in with Google</Text>
        </TouchableOpacity>
      </ImageBackground>
    </SafeAreaView>
  );
};

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
