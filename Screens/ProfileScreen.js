import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { updatePassword } from '../api/meSevice';
import { updateAvatarUser } from '../api/meSevice';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "../api/apiConfig";
import { getUserById } from '../api/meSevice';
import dayjs from 'dayjs';



export default function ProfileScreen({ navigation }) {
  const [screen, setScreen] = useState('home');
const [userInfo, setUserInfo] = useState(null);
const [token, setToken] = useState(null);


  const [uId, setUId] = useState('');
  const [avatarColor, setAvatarColor] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [currentPasswordError, setCurrentPasswordError] = useState('*');
  const [newPasswordError, setNewPasswordError] = useState('*');
  const [confirmPasswordError, setConfirmPasswordError] = useState('*');

  // State for success message
  const [successMessage, setSuccessMessage] = useState('');


const handleLogout = async () => {
  try {
    const userRaw = await AsyncStorage.getItem('userInfo');
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    if (!userRaw || !refreshToken) {
      console.warn('Missing user or refreshToken');
      Alert.alert('Logout Failed', 'Missing user session info.');
      return;
    }

    const user = JSON.parse(userRaw);

    console.log('Sending to logout:', {
      user,
      refreshToken,
    });

    const response = await axios.post('/api/auth/logout', {
      user,
      refreshToken,
    });

    console.log('Logout response:', response.data);

    await AsyncStorage.multiRemove([
      'userId',
      'userToken',
      'refreshToken',
      'userInfo',
    ]);

    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });
  } catch (error) {
    console.error('Logout failed:', error.response?.data || error.message);
    Alert.alert('Logout Failed', error.response?.data?.message || 'Unexpected error');
  }
};


useEffect(() => {
  const fetchUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedToken = await AsyncStorage.getItem('userToken');

      if (!storedUserId || !storedToken) {
        console.warn('Missing userId or token');
        return;
      }

      setToken(storedToken);

      const user = await getUserById(storedUserId, storedToken);
      setUserInfo(user);
      setUId(user._id);
      setAvatarColor(user.avatarColor || 'gray');
      setAvatarUrl(user.avatar || '');
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  fetchUserData();
}, []);


  useEffect(() => {
    if (userInfo) {
      setAvatarColor(userInfo.avatarColor || 'gray');

    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo && userInfo._id) {
      setUId(userInfo._id);
    }
  }, [userInfo]);

  const clearInputs = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  const clearErrors = () => {
    setCurrentPasswordError('*');
    setNewPasswordError('*');
    setConfirmPasswordError('*');
    setSuccessMessage('*');
  };

  const [avatarUrl, setAvatarUrl] = useState(userInfo?.avatar || userInfo?.userInfo);
  const [timestamp, setTimestamp] = useState(Date.now());

  const handleChooseAvatar = () => {
    ({ mediaType: 'photo', includeBase64: true }, async (response) => {
      const asset = response.assets?.[0];
      if (!asset) {
        console.error('Không có ảnh nào được chọn');
        return;
      }

      // Tạo đối tượng file cho việc upload
      const file = {
        uri: asset.uri,
        name: asset.fileName || `avatar-${Date.now()}.jpg`, // Tạo tên file nếu không có
        type: asset.type || 'image/jpeg', // Loại file mặc định là 'image/jpeg'
      };


      try {
        const res = await updateAvatarUser(userInfo._id, file, token);
        console.log('Cập nhật avatar thành công:', res);
        setTimestamp(Date.now());
        if (res && res.avatar) {
          setAvatarUrl(res.avatar);
        } else {
          setAvatarUrl(`${userInfo.avatar}?t=${Date.now()}`);
        }

      } catch (e) {
        console.error('Lỗi khi cập nhật avatar:', e);
        console.error('Lỗi khi cập nhật avatar:', e.response?.data || e.message);

      }
    });
  };
  const getAvatarUrlWithTimestamp = () => {
    if (!avatarUrl) return null;

    if (avatarUrl.includes('?')) {
      return `${avatarUrl}&t=${timestamp}`;
    } else {
      return `${avatarUrl}?t=${timestamp}`;
    }
  };

  const handleUpdatePassword = async () => {
    // Clear previous error messages
    clearErrors();

    // Client-side validation
    let hasError = false;

    if (!currentPassword) {
      setCurrentPasswordError('Vui lòng nhập mật khẩu hiện tại');
      hasError = true;
    }

    if (!newPassword) {
      setNewPasswordError('Vui lòng nhập mật khẩu mới');
      hasError = true;
    } else if (newPassword.length < 8) {
      setNewPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Vui lòng xác nhận mật khẩu mới');
      hasError = true;
    } else if (confirmPassword !== newPassword) {

      setConfirmPasswordError('Mật khẩu xác nhận không khớp');
      hasError = true;
    }



    try {
      const response = await updatePassword(uId, currentPassword, newPassword, token);

      clearInputs();
      clearErrors();
    } catch (error) {
      console.log(error)
    } finally {
    }
  }

  return (
    <ImageBackground style={styles.container} source={require('../Images/bground.png')}>
      <View style={styles.fTop}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../icons/back.png')}
            style={styles.btnBack}></Image>
        </TouchableOpacity>
        <Text style={styles.title}>My profile</Text>
        <View style={styles.fEdit}>
          <TouchableOpacity style={styles.btnEdit}>
            <Image
              source={require('../icons/edit.png')}
              style={styles.iconEdit}></Image>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fProfile}>
        <Image
          source={require('../Images/backgroundProfile.png')}
          style={styles.imgProfile}></Image>

        <View style={styles.detailProfile}>
          <View style={styles.favatar}>
            <TouchableOpacity onPress={handleChooseAvatar}>
              {getAvatarUrlWithTimestamp() ? (
                <Image
                  source={{ uri: getAvatarUrlWithTimestamp() }}
                  style={styles.imgAvatar}
                />
              ) : (
                <View style={[styles.imgAvatar, { backgroundColor: avatarColor }]} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.fName}>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.txtName}>{userInfo?.name}</Text>

            </View>
          </View>
        </View>

        <Image source={require('../icons/QR.png')} style={styles.qR}></Image>
      </View>


      <View style={styles.fDetailInfor}>
        {screen === 'home' && (
          <View>
            <View style={styles.fRow}>
              <View style={styles.fHalfRow}>
                <View style={styles.fPro}>
                  <Text style={styles.txtPro}>Name</Text>
                </View>

                <View style={styles.fTxtInput}>
                  <Text style={styles.txtInput} numberOfLines={1}>{userInfo?.name}</Text>
                </View>
              </View>

              <View style={styles.fHalfRow}>
                <View style={styles.fPro}>
                  <Text style={styles.txtPro}>Email</Text>
                </View>

                <View style={styles.fTxtInput}>
                  <Text style={styles.txtInput} numberOfLines={1}>{userInfo?.username}</Text>
                </View>
              </View>
            </View>
            <View style={styles.fRow}>
              <View style={styles.fHalfRow}>
                <View style={styles.fPro}>

                  {(() => {
                    const rawDate = userInfo?.dateOfBirth;
                    const parsedDate = rawDate?.$date || rawDate;
                    return (
                      <Text style={styles.txtPro}>       
                        Date of birth:
                      </Text>
                    );
                  })()}

                </View>

                <View style={styles.fTxtInput}>
                   <Text style={styles.txtInput}>  
                          {userInfo?.dateOfBirth
  ? dayjs(`${userInfo.dateOfBirth.year}-${userInfo.dateOfBirth.month}-${userInfo.dateOfBirth.day}`).format('MMMM D, YYYY')
  : '—'}</Text> 
                </View>
              </View>

              <View style={styles.fHalfRow}>
                <View style={styles.fPro}>
                  <Text style={styles.txtPro}>Gender</Text>
                </View>

                <View style={styles.fTxtInput}>
                  <Text style={styles.txtInput}>{userInfo?.gender === true ? 'Female' : 'Male'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.fRow}>
              <View style={styles.fPro}>
                <Text style={styles.txtPro}>Phone number</Text>
              </View>

              <View style={styles.fTxtInput}>
                <Text style={styles.txtInput}>{userInfo?.phoneNumber}</Text>
              </View>
            </View>
            <View style={styles.fRow}>
              <View style={styles.fPro}>
                <Text style={styles.txtPro}>Your hobbies</Text>
              </View>
<View style={styles.fHobbies}>
{userInfo?.hobbies?.length > 0 ? (
  userInfo.hobbies.map((hobby, i) => (
    <View key={i} style={styles.fHobbie}>
      <Text style={styles.txtHobbies}>{hobby}</Text>
    </View>
  ))
) : (
  <Text style={{ marginLeft: 20, color: '#666' }}>
    No hobbies listed.
  </Text>
)}

        </View>
            </View>
          </View>
        )}

        {screen === 'friends' && (
          <View>
            <TouchableOpacity style={styles.fMessage}>
              <View style={styles.fRow}>
                <Image
                  source={require('../Images/nike.png')}
                  style={styles.avatar}
                />
                <View style={styles.fInfor}>
                  <Text style={styles.name}></Text>
                  <Text style={styles.email}>johnNguyen@gmail.com</Text>
                  <View style={styles.fbtn}>
                    <TouchableOpacity style={styles.btnDetail}>
                      <Image
                        source={require('../icons/detail.png')}
                        style={styles.iconDetail}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {screen === 'account' && (

          <View>

            <View style={styles.header}>
              <Image
                source={require('../icons/lock.png')}
                style={styles.iconLock}></Image>
              <Text style={styles.txtChangePass}>Đổi Mật Khẩu</Text>
            </View>

            <View style={styles.fRow}>
              <View style={styles.fPro}>
                <Text style={styles.txtPro}>Current password</Text>
              </View>

              <View style={styles.fTxtInput}>
                <TextInput
                  style={styles.txtInput}
                  placeholder="Enter current password"
                  placeholderTextColor={'#086DC0'}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={true}></TextInput>
              </View>

              <View style={styles.fRow}>
              </View>
            </View>
            <View style={styles.errorContainer}>
              <TextInput style={styles.errorText} value={currentPasswordError}
                onChangeText={setCurrentPasswordError} editable={false} pointerEvents="none" />
            </View>

            <View style={styles.fRow}>
              <View style={styles.fPro}>
                <Text style={styles.txtPro}>New password</Text>
              </View>

              <View style={styles.fTxtInput}>
                <TextInput
                  style={styles.txtInput}
                  placeholder="Enter New password"
                  placeholderTextColor={'#086DC0'}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={true}></TextInput>
              </View>

              <View style={styles.fRow}>
              </View>
            </View>
            <View style={styles.errorContainer}>
              <TextInput style={styles.errorText} value={newPasswordError}
                onChangeText={setNewPasswordError} editable={false} pointerEvents="none" />
            </View>

            <View style={styles.fRow}>
              <View style={styles.fPro}>
                <Text style={styles.txtPro}>Confirm password</Text>
              </View>

              <View style={styles.fTxtInput}>
                <TextInput
                  style={styles.txtInput}
                  placeholder="Enter Confirm password"
                  placeholderTextColor={'#086DC0'}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={true}></TextInput>
              </View>

              <View style={styles.fRow}>
              </View>
            </View>
            <View style={styles.errorContainer}>
              <TextInput style={styles.errorText} value={confirmPasswordError}
                onChangeText={setConfirmPasswordError} editable={false} pointerEvents="none" />
            </View>

            <View style={styles.header}>
              <TouchableOpacity style={styles.btnCapNhat} onPress={handleUpdatePassword}>
                <Text style={styles.txtUpdate}>Cập nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

<TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
  <Image
    source={require('../icons/logout.png')}
    style={styles.iconLogout}
  />
  <Text style={styles.txtInput}>Sign out</Text>
</TouchableOpacity>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    alignItems:'center'
  },
  fTop: {
    width: '90%',
    height: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop:30,

  },
  btnBack: {
    width: 25,
    height: 18,
  },
  fEdit: {
    width: 70,
    height: '100%',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#086DC0',
    marginLeft:40
  },
  iconEdit: {
    width: 15,
    height: 15,
    tintColor:'white'
  },
  txtEdit: {
    fontSize: 15,
    color: '#086DC0',
  },
  btnEdit: {
 alignItems: 'center',width:30, height:30, backgroundColor:'#086DC0', borderRadius:15, justifyContent:'center', alignSelf:'flex-end'
  },
  fProfile: {
    width: '95%',
    height: 145,
    marginTop: 20,
    borderRadius:20,
    flexDirection: 'row',
    alignSelf:'center'
  },
  imgProfile: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius:10
  },
  detailProfile: {
    position: 'absolute',
    width: 290,
    height: 80,
    bottom: -20,
    left: 10,

    
  },
  favatar: {
    width: 65,
    height: 65,
    borderRadius: '50%',
  },
  imgAvatar: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: '#ccc', // có thể thêm để dễ debug
  }
  ,
  fName: {
    height: 50,

  },
  txtName: {
    fontSize: 18,
    color: '#086DC0',
    fontWeight: 'bold',
    marginTop:15,
  },
  qR: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignSelf: 'flex-end',
    right: 10,
    bottom: 10,
  },
  fFunction: {
    width: '90%',
    height: 30,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnInfor: {
    width: 106,
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#086DC0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  txtFunction: {
    color: 'white',
    fontWeight: 600,
  },
  btnInforS: {
    width: 106,
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  txtFunctionS: {
    color: '#086DC0',
    fontWeight: 600,
  },
  fDetailInfor: {
    width: '95%',
    height: 350,
    marginTop: 60,
    
    alignContent:'center',
  },
  fRow: {
    width: '100%',
    height: 55,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fHalfRow: {
    width: '49%',
    height: '100%',
  },
  fTxtInput: {
    display: 'flex',
    width: '100%',
    height: 35,
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    marginTop: 5,
  },
  txtPro: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  fPro: {
    width: '100%',
    height: 15,
    flexDirection: 'row',
    marginLeft: 10,
    marginTop: 5,
  },
  txtInput: {
    marginLeft: 10,
    color: '#086DC0',
  },
  iconLogout: {
    width: 30,
    height: 30,
  },
  btnLogout: {
    position: 'absolute',
    bottom: 20,
    width: 110,
    alignItems: 'center',
    flexDirection: 'row',
    left: '38%',
    marginBottom:20.
  },
  fInfor: {
    width: '82%',
    height: '100%',
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 13,
    fontWeight: '400',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 100,
  },
  fMessage: {
    width: '100%',
    height: 65,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomColor: 'white',
    borderBottomWidth: 1,
  },

  btnDetail: {
    width: 13,
    height: 13,
    position: 'absolute',
    right: 10,
    top: 0,
  },
  fbtn: {
    position: 'absolute',
    width: 13,
    height: 30,
    justifyContent: 'center',
    right: 0,
    top: 5,
  },
  header: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLock: {
    width: 24,
    height: 24,
  },
  txtChangePass: {
    fontSize: 24,
    color: '#086DC0',
    fontWeight: 600,
  },
  btnCapNhat: {
    width: 92,
    height: 29,
    borderRadius: 30,
    backgroundColor: '#086DC0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txtUpdate: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 500,
  },
  redAsterisk: {
    color: 'red',
    fontSize: 18,
    marginLeft: 5,
  },
  errorContainer: {
    paddingHorizontal: 10,
    marginTop: 5,

    marginBottom: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
  btnTab: {
    width: 106,
    height: '100%',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  btnActive: {
    backgroundColor: '#086DC0',
  },

  btnInactive: {
    backgroundColor: '#F5F5F5',
  },

  txtTab: {
    fontWeight: '600',
  },

  txtActive: {
    color: 'white',
  },

  txtInactive: {
    color: '#086DC0',
  },
fHobbies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingLeft: 28,
  },
  fHobbie: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 17,
    backgroundColor: '#D3EBFF',
    marginRight: 8,
    marginBottom: 8,
  },
  txtHobbies: { fontSize: 14, color: '#086DC0' },
});
