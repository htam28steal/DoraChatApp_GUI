
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ImageBackground } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation } from '@react-navigation/native';
import bg from '../Images/bground.png';
import React, { useState } from 'react';
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

const genderData = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];



const SignupScreen = () => {
  const [gender, setGender] = useState(null); 
  const navigation = useNavigation();

  const [startDate, setStartDate] = useState(new Date());

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
        <View style={styles.signUpSection}>
            <TextInput 
              style={styles.usernameInput} 
              placeholder="First name" 
              placeholderTextColor="#666"
            />
            <TextInput 
            style={styles.usernameInput} 
            placeholder="Last name" 
            placeholderTextColor="#666"
            />
          <View style={styles.inputContainer}>
          <Dropdown
            style={styles.halfInput}
            data={genderData}
            labelField="label"
            valueField="value"
            placeholder="Gender"
            value={gender}
            onChange={item => {
              setGender(item.value);
            }}
            selectedTextStyle={{ color: '#333', fontSize: 14 }}
            placeholderStyle={{ color: '#666', fontSize: 14 }}
          />
  
    <DatePicker
      showIcon
      selected={startDate}
      onChange={(date) => setStartDate(date)}
      icon="fa fa-calendar"
    />
          </View>

          <TextInput 
            style={styles.usernameInput} 
            placeholder="Enter your mail or phone" 
            placeholderTextColor="#666"
          />
        </View>

        {/* Next Button */}
        <TouchableOpacity style={styles.signupBtn} onPress={handleNext}>
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
  signUpSection: {
    width: '100%',
    alignItems: 'center',
    height: 80,
    marginBottom:100
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
    marginBottom:20
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
    width:360,
    marginBottom:10
  },
  noAccountText: {
    fontSize: 12,
  },
  signInText: {
    fontSize: 14,
    color: '#086DC0',
    fontWeight: 'bold',
  },
  inputContainer:{
    flexDirection:'row',
    justifyContent:'center',
    width:320,

    marginBottom:20

  },
  halfInput:{
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 10,
    width: 160,
    height: 33,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#333',
    paddingLeft: 10,
    paddingTop: 5,
    paddingBottom: 5,
    marginRight:10
  }
});

export default SignupScreen;
