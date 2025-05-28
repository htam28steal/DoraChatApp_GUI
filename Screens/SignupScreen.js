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
import { useNavigation, useRoute } from '@react-navigation/native';
import bg from '../Images/bground.png';
import React, { useState} from 'react';
import axios from '../api/apiConfig';
// import DateTimePickerModal from "react-native-modal-datetime-picker"; // Commented out DatePicker

const genderData = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

// --- Validation helpers ---
const nameRegex = /^[a-zA-ZÀ-ỹ\s'-]+$/;
const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+=-]).{8,}$/;

function validateDateOfBirth(date) {
  if (!date) return false;
  if (!(date instanceof Date) || isNaN(date)) return false;
  const year = date.getFullYear();
  if (year < 1900) return false;

  // Must be at least 10 years ago
  const tenYearsLater = new Date(date);
  tenYearsLater.setFullYear(year + 10);
  if (tenYearsLater > new Date()) return false;
  return true;
}

const SignupScreen = () => {
  // Set default date to December 22, 1990
  const defaultDOB = new Date("1990-12-22");

  // Date picker states - these remain here if you plan to re-enable later
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(defaultDOB);
const [formErrors, setFormErrors] = useState({});

  const route = useRoute();
  const { email } = route.params || {};


  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    handleInputChange('dateOfBirth', date); // ✅ update formData directly
    hideDatePicker();
  };
  

  const getFormattedDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const navigation = useNavigation();
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contact: email || '', // ✅ assign the passed email here
    password: '',
    passwordConfirm: '',
    gender: null,
    dateOfBirth: defaultDOB,
  });
  

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
const validateForm = () => {
  const errors = {};

  // Name validation
  if (!formData.firstName || !formData.firstName.trim() || formData.firstName.length > 50 || !nameRegex.test(formData.firstName.trim())) {
    errors.firstName = "Letters and spaces, max 50 characters*";
  }
  if (!formData.lastName || !formData.lastName.trim() || formData.lastName.length > 50 || !nameRegex.test(formData.lastName.trim())) {
    errors.lastName = "Letters and spaces, max 50 characters*";
  }

  // Email
  if (!formData.contact || !formData.contact.trim() || !emailRegex.test(formData.contact.trim().toLowerCase())) {
    errors.contact = "Please enter a valid email address.";
  }

  // Gender
  if (!formData.gender || !['male', 'female'].includes(formData.gender)) {
    errors.gender = "Please select your gender.";
  }

  // DOB
  if (!validateDateOfBirth(formData.dateOfBirth)) {
    errors.dateOfBirth = "Invalid date of birth. You must be at least 10 years old.";
  }

  // Password
  if (!formData.password || !formData.password.trim()) {
    errors.password = "Please enter your password*";
  } else if (!passwordRegex.test(formData.password)) {
    errors.password = "Password must have at least 8 characters, including uppercase, lowercase, number and special character*";
  } else if (formData.password.length > 50) {
    errors.password = "Password cannot exceed 50 characters*";
  }

  // Password confirm
  if (formData.password !== formData.passwordConfirm) {
    errors.passwordConfirm = "Passwords do not match*";
  }

  setFormErrors(errors);

  return Object.keys(errors).length === 0;
};

  
  const handleLogin = () => {
    navigation.navigate("LoginScreen");
  };
  const handleNext = async () => {
    if (!validateForm()) return;
  
    try {
      setLoading(true);
      const payload = {
        contact: formData.contact.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        password: formData.password,
        dateOfBirth: getFormattedDate(formData.dateOfBirth),
        gender: formData.gender,
      };
  
      const response = await axios.post('/api/auth/register', payload);

      if (response.status === 200 || response.status === 201) {
        navigation.navigate('OtpScreen', {
          email: formData.contact,
        });
      } else {
        Alert.alert('Error', 'Save user information failed');
      }
      
    } catch (error) {
      console.error('Information submission error:', error.response?.data || error);
      const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
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
                  {formErrors.firstName && <Text style={styles.errorText}>{formErrors.firstName}</Text>}
          <TextInput
            style={styles.usernameInput}
            placeholder="First name"
            placeholderTextColor="#666"
            value={formData.firstName}
            onChangeText={(text) => handleInputChange('firstName', text)}
          />
            {formErrors.lastName && <Text style={styles.errorText}>{formErrors.lastName}</Text>}
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
            <View style={styles.halfInput}>
            <TouchableOpacity onPress={showDatePicker}>
  <TextInput
    style={styles.input}
    placeholder="Ngày sinh"
    value={getFormattedDate(formData.dateOfBirth)} // ✅ correct
    editable={false}
    pointerEvents="none"
  />
</TouchableOpacity>

              {/*
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
                value={formData.dateOfBirth}
              />
              */}
            </View>
          </View>
          {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}
          <TextInput
  style={styles.usernameInput}
  placeholder="Enter your password"
  placeholderTextColor="#666"
  value={formData.password}
  onChangeText={(text) => handleInputChange('password', text)}
  secureTextEntry
/>
{formErrors.passwordConfirm && <Text style={styles.errorText}>{formErrors.passwordConfirm}</Text>}
<TextInput
  style={styles.usernameInput}
  placeholder="Enter your password again"
  placeholderTextColor="#666"
  value={formData.passwordConfirm}
  onChangeText={(text) => handleInputChange('passwordConfirm', text)}
  secureTextEntry
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
  },
  errorText:{
    color:'red',
    fontSize:14,
    alignSelf:'flex-start',
    marginLeft:8

  }
});

export default SignupScreen;
