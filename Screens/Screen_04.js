import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
export default function Screen_04({ navigation }) {
  const [screen, setScreen] = useState('home');

  return (
    <View style={styles.container}>
      <View style={styles.fTop}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../icons/back.png')}
            style={styles.btnBack}></Image>
        </TouchableOpacity>
        <Text style={styles.title}>My profile</Text>
        <View style={styles.fEdit}>
          <TouchableOpacity style={styles.btnEdit}>
            {' '}
            <Text style={styles.txtEdit}>Chỉnh sửa</Text>{' '}
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
            <Image
              source={require('../Images/nike.png')}
              style={styles.imgAvatar}></Image>
          </View>

          <View style={styles.fName}>
            <Text style={styles.txtName}>User Admin</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text>Have a nice day !</Text>
              <TouchableOpacity>
                <Image
                  source={require('../icons/edit.png')}
                  style={styles.iconEdit}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Image source={require('../icons/QR.png')} style={styles.qR}></Image>
      </View>

      <View style={styles.fFunction}>
        <TouchableOpacity
          style={styles.btnInfor}
          onPress={() => setScreen('home')}>
          <Image
            source={require('../icons/profile.png')}
            style={styles.iconEdit}
          />
          <Text style={styles.txtFunction}>Information</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnInforS}
          onPress={() => setScreen('friends')}>
          <Image
            source={require('../icons/friends.png')}
            style={styles.iconEdit}
          />
          <Text style={styles.txtFunctionS}>Friends (10)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnInforS}
          onPress={() => setScreen('account')}>
          <Image
            source={require('../icons/setting.png')}
            style={styles.iconEdit}
          />
          <Text style={styles.txtFunctionS}>Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fDetailInfor}>
        {screen === 'home' && (
          <Text>
            <View style={styles.fRow}>
              <View style={styles.fHalfRow}>
                <View style={styles.fPro}>
                  <Text style={styles.txtPro}>First Name</Text>
                </View>

                <View style={styles.fTxtInput}>
                  <Text style={styles.txtInput}>User</Text>
                </View>
              </View>

              <View style={styles.fHalfRow}>
                <View style={styles.fPro}>
                  <Text style={styles.txtPro}>Last Name</Text>
                </View>

                <View style={styles.fTxtInput}>
                  <Text style={styles.txtInput}>Admin</Text>
                </View>
              </View>
            </View>
            <View style={styles.fRow}>
              <View style={styles.fHalfRow}>
                <View style={styles.fPro}>
                  <Text style={styles.txtPro}>Date of birth</Text>
                </View>

                <View style={styles.fTxtInput}>
                  <Text style={styles.txtInput}>02/10/2003</Text>
                </View>
              </View>

              <View style={styles.fHalfRow}>
                <View style={styles.fPro}>
                  <Text style={styles.txtPro}>Gender</Text>
                </View>

                <View style={styles.fTxtInput}>
                  <Text style={styles.txtInput}>Male</Text>
                </View>
              </View>
            </View>

            <View style={styles.fRow}>
              <View style={styles.fPro}>
                <Text style={styles.txtPro}>Email</Text>
              </View>

              <View style={styles.fTxtInput}>
                <Text style={styles.txtInput}>userName@gmail.com</Text>
              </View>
            </View>
            <View style={styles.fRow}>
              <View style={styles.fPro}>
                <Text style={styles.txtPro}>Your hobbies</Text>
              </View>

              <View style={styles.fTxtInput}>
                <Text style={styles.txtInput}>Your hobbies</Text>
              </View>
            </View>
          </Text>
        )}

        {screen === 'friends' && (
          <Text>
            <TouchableOpacity style={styles.fMessage}>
              <View style={styles.fRow}>
                <Image
                  source={require('../Images/nike.png')}
                  style={styles.avatar}
                />
                <View style={styles.fInfor}>
                  <Text style={styles.name}>John Nguyen</Text>
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
          </Text>
        )}

        {screen === 'account' && (
          <Text>
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
                  placeholderTextColor={'#086DC0'}></TextInput>
              </View>
            </View>

            <View style={styles.fRow}>
              <View style={styles.fPro}>
                <Text style={styles.txtPro}>New password</Text>
              </View>

              <View style={styles.fTxtInput}>
                <TextInput
                  style={styles.txtInput}
                  placeholder="Enter New password"
                  placeholderTextColor={'#086DC0'}></TextInput>
              </View>
            </View>
            <View style={styles.fRow}>
              <View style={styles.fPro}>
                <Text style={styles.txtPro}>Confirm password</Text>
              </View>

              <View style={styles.fTxtInput}>
                <TextInput
                  style={styles.txtInput}
                  placeholder="Enter Confirm password"
                  placeholderTextColor={'#086DC0'}></TextInput>
              </View>
            </View>
            <View style={styles.header}>
              <TouchableOpacity style={styles.btnCapNhat}>
                <Text style={styles.txtUpdate}>Cập nhật</Text>
              </TouchableOpacity>
            </View>
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.btnLogout}>
        <Image
          source={require('../icons/logout.png')}
          style={styles.iconLogout}></Image>
        <Text style={styles.txtInput}>Đăng Xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    padding: 10,
  },
  fTop: {
    width: '100%',
    height: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  iconEdit: {
    width: 11,
    height: 11,
  },
  txtEdit: {
    fontSize: 11,
    color: '#086DC0',
  },
  btnEdit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fProfile: {
    width: '100%',
    height: 145,
    marginTop: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
  },
  imgProfile: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  detailProfile: {
    position: 'absolute',
    width: 290,
    height: 70,
    bottom: 10,
    left: 10,
    flexDirection: 'row',
  },
  favatar: {
    width: 65,
    height: 65,
    borderRadius: '50%',
  },
  imgAvatar: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 100,
  },
  fName: {
    width: '75%',
    height: 50,
    alignSelf: 'flex-end',
  },
  txtName: {
    fontSize: 18,
    color: '#086DC0',
    fontWeight: 'bold',
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
    width: '100%',
    height: 350,
    marginTop: 10,
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
    width: 100,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    left: '38%',
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
});
