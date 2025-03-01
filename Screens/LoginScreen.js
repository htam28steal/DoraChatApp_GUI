import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import bg from '../Images/bground.png';

const SignupScreen = () => {
  const navigation = useNavigation();

  const handleLogin = () => {
    navigation.navigate("WelcomeScreen"); // Navigate to WelcomeScreen
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
          />
          <TextInput 
            style={styles.pwdInput} 
            placeholder="Password" 
            placeholderTextColor="#666"
            secureTextEntry={true}
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

export default SignupScreen;
