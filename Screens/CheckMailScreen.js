import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ImageBackground,
  Alert,
  ActivityIndicator,
  Button
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation } from '@react-navigation/native';
import bg from '../Images/bground.png';
import React, { useState } from 'react';
import axios from '../api/apiConfig';
// import DateTimePickerModal from "react-native-modal-datetime-picker"; // Commented out DatePicker




const CheckMailScreen = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');


  const navigation = useNavigation();



  const handleLogin = () => {
    navigation.navigate("LoginScreen", email);
  };
  const handleNext = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Email không được để trống");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/contact', { contact: email });
      // Optionally show success message: Alert.alert("Success", response.data.message);
      navigation.navigate("SignupScreen", { email }); // optionally pass email
    } catch (error) {
      const message = error?.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={bg} style={styles.gradient} resizeMode="cover">
        <View style={styles.banner}>
          <Image source={require('../Images/logoDoRa.png')} style={styles.logo} />
          <Text style={styles.statement}>Everywhere you want to be</Text>
        </View>

        <View style={styles.signUpSection}>
          <TextInput
            style={styles.usernameInput}
            placeholder="Enter your email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

        </View>

        <TouchableOpacity style={styles.signupBtn} onPress={handleNext} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Image source={require('../icons/next.png')} style={styles.loginImage} />
              <Text style={styles.nextText}>Next</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.signInSection}>
          <Text style={styles.noAccountText}>Already have an account? </Text>
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
    color: '#FFBD59',
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
  signUpSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 100,
  },
  usernameInput: {
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 10,
    width: 340,
    height: 33,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#333',
    paddingLeft: 10,
    paddingTop: 5,
    paddingBottom: 5,
    marginBottom: 20,
  },
  signupBtn: {
    backgroundColor: '#086DC0',
    width: 100,
    height: 40,
    justifyContent: 'center',
    borderRadius: 20,
    marginTop: 30,
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
    width: 360,
    marginBottom: 10,
  },
  noAccountText: {
    fontSize: 12,
  },
  signInText: {
    fontSize: 14,
    color: '#086DC0',
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: 320,
    marginBottom: 20,
  },
  halfInput: {
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 10,
    width: 160,
    height: 33,
    backgroundColor: '#fff',
    fontSize: 14,
    paddingLeft: 10,
    justifyContent: 'center',
    marginRight: 10,
  },
  input:{
    paddingTop:5,
    marginBottom:-5
  }
});

export default CheckMailScreen;
