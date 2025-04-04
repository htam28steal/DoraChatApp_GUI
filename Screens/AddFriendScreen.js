import React from 'react';
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

export default function Screen_05({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.fTop}>
        <TouchableOpacity>
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
          <Text style={styles.txtName}>Patricia Capo</Text>
          <Text style={styles.txtDes}>🏖️ King of the Coastline 🏖️</Text>
        </View>
      </View>

      <View style={styles.fFunction}>
        <TouchableOpacity style={styles.btnInfor}>
          <Image
            source={require('../icons/addf.png')}
            style={styles.iconEdit}
          />
          <Text style={styles.txtFunction}>Add friend</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnInfor}>
          <Image
            source={require('../icons/messsend.png')}
            style={styles.iconEdit}
          />
          <Text style={styles.txtFunction}>Send message</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fBgCat}>
        <Image
          source={require('../Images/gCat.png')}
          style={styles.bgCat}></Image>
      </View>
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
  },
  imgProfile: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  detailProfile: {
    position: 'absolute',
    width: '95%',
    height: '98%',
    top: 5,
    bottom: 10,
    left: 10,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favatar: {
    width: 100,
    height: 100,
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

  fFunction: {
    width: '90%',
    height: 30,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btnInfor: {
    width: 120,
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#086DC0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginLeft: 10,
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
    height: 230,
    marginTop: 10,
  },
  txtName: {
    fontSize: 18,
    color: '#000',
    fontWeight: 700,
  },
  txtDes: {
    color: '#086DC0',
  },
  bgCat: {
    width: 343,
    height: 313,
  },
  fBgCat: {
    width: '100%',
    height: '80%',
    marginTop: 20,
    alignItems: 'center',
  },
});
