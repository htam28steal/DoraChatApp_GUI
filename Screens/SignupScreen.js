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
    Platform,
  } from 'react-native';
  import { Dropdown } from 'react-native-element-dropdown';
  import { useNavigation } from '@react-navigation/native';
  import bg from '../Images/bground.png';
  import React, { useState } from 'react';
  import axios from '../api/apiConfig'
  import DatePicker from 'react-native-date-picker'


  const genderData = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ];

  const birthday = [
    { date: "22/12/2000"}
  ]

  const SignupScreen = () => {
    const navigation = useNavigation();
    const [date, setDate] = useState(new Date())
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      contact: '',
      gender: null,
      dateOfBirth: new Date(),
      bio: '',
    });

    const handleInputChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    };

    const validateForm = () => {
      const { firstName, lastName, contact, gender, dateOfBirth } = formData;
      if (!firstName || !lastName || !contact || !gender || !dateOfBirth) {
        Alert.alert('Validation Error', 'Please fill in all required fields.');
        return false;
      }
      return true;
    };

    const handleNext = async () => {
      if (!validateForm()) return;

      try {
        setLoading(true);
          const registrationResponse = await axios.post('/api/auth/register', {
            contact: formData.contact,
            firstName: formData.firstName,
            lastName: formData.lastName,
            password: 'Temporary@123', 
            dateOfBirth: formData.dateOfBirth.toISOString().split('T')[0],
            gender: formData.gender,
            bio: formData.bio || '',
          });

              if (registrationResponse.data.message === 'Đã lưu thông tin người dùng') {
                navigation.navigate('OtpScreen', {
                  email: formData.contact
                });
              
            } 
      } catch (error) {
        console.error('Registration error:', error.response?.data || error);
        const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
        Alert.alert('Error', errorMessage);
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
              placeholder="First name"
              placeholderTextColor="#666"
              value={formData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
            />
            <TextInput
              style={styles.usernameInput}
              placeholder="Last name"
              placeholderTextColor="#666"
              value={formData.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
            />
      
            <View style={styles.inputContainer}>
              <Dropdown
                style={styles.halfInput}
                data={genderData}
                labelField="label"
                valueField="value"
                placeholder="Gender"
                value={formData.gender}
                onChange={(item) => handleInputChange('gender', item.value)}
                selectedTextStyle={{ color: '#333', fontSize: 14 }}
                placeholderStyle={{ color: '#666', fontSize: 14 }}
              />
            <DatePicker date={date} onDateChange={setDate} />


            </View>

            <TextInput
              style={styles.usernameInput}
              placeholder="Enter your mail or phone"
              placeholderTextColor="#666"
              value={formData.contact}
              onChangeText={(text) => handleInputChange('contact', text)}
            />



            <TextInput
              style={styles.usernameInput}
              placeholder="Bio"
              placeholderTextColor="#666"
              value={formData.bio}
              onChangeText={(text) => handleInputChange('bio', text)}
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
});

export default SignupScreen;
