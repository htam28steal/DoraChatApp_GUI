import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ImageBackground
} from 'react-native';
import axios from '../api/apiConfig';
import dayjs from 'dayjs';
import FriendService from '../api/friendService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socket } from '../utils/socketClient';
import { SOCKET_EVENTS } from '../utils/constant';


export default function Screen_05({ navigation, route }) {
  // grab userId from route params
  const { userId } = route.params;
const [currentUserId, setCurrentUserId] = useState(null); // new


  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
    const [isFriend, setIsFriend]             = useState(false);
  const [sentInvites, setSentInvites]       = useState(null);

      useEffect(() => {
  const loadCurrentUser = async () => {
    const id = await AsyncStorage.getItem('userId');
    setCurrentUserId(id);
  };
  loadCurrentUser();
}, []);


useEffect(() => {
  if (!userId || !currentUserId) return;

  const loadProfile = async () => {
    try {
      const { data } = await axios.get(`/api/users/check/${userId}`);
      setProfile(data);

      const friendStatus = await FriendService.isFriend(currentUserId, data._id);
      setIsFriend(!!friendStatus);

      const invites = await FriendService.getListFriendInviteMe();
      const pending = invites.some(inv => inv._id === data._id);
      setSentInvites(pending ? 'pending' : null);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load profile or friend status.');
    } finally {
      setLoading(false);
    }
  };

  loadProfile();
}, [userId, currentUserId]);

useEffect(() => {
  if (!currentUserId || !profile?._id) return;

  socket.emit(SOCKET_EVENTS.JOIN_USER, currentUserId); // join room

  const handleFriendAccepted = (data) => {
    if (data?._id === profile._id) {
      setIsFriend(true);
      setSentInvites(null);
    }
  };

  const handleInviteDeleted = (userIdDeclined) => {
    if (userIdDeclined === profile._id) {
      setSentInvites(null);
    }
  };

  const handleFriendRemoved = (data) => {
    if (data?._id === profile._id) {
      setIsFriend(false);
    }
  };

  socket.on(SOCKET_EVENTS.ACCEPT_FRIEND, handleFriendAccepted);
  socket.on(SOCKET_EVENTS.DELETED_FRIEND_INVITE, handleInviteDeleted);
  socket.on(SOCKET_EVENTS.DELETED_FRIEND, handleFriendRemoved);

  return () => {
    socket.off(SOCKET_EVENTS.ACCEPT_FRIEND, handleFriendAccepted);
    socket.off(SOCKET_EVENTS.DELETED_FRIEND_INVITE, handleInviteDeleted);
    socket.off(SOCKET_EVENTS.DELETED_FRIEND, handleFriendRemoved);
  };
}, [currentUserId, profile]);


    const handleAddFriend = async () => {
    try {
      const resp = await FriendService.sendFriendInvite(profile._id);
      if (resp.status === 201) {
        setSentInvites('pending');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // cancel pending invite
  const handleCancelInvite = async () => {
    try {
      await FriendService.deleteInviteWasSend(profile._id);
      setSentInvites(null);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Cannot cancel invite');
    }
  };

  // unfriend
  const handleUnfriend = async () => {
    try {
      await FriendService.deleteFriend(profile._id);
      setIsFriend(false);
      Alert.alert('Removed', 'Friend removed');
    } catch {
      Alert.alert('Error', 'Failed to remove friend');
    }
  };
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#086DC0" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loader}>
        <Text>Profile not available.</Text>
      </View>
    );
  }

  const {
    _id,
    name,
    avatar,
    dateOfBirth,
    gender,
    hobbies = [],
    phoneNumber,
    email,
    createdAt,
    coverImage,
    username
  } = profile;

  return (
    <ImageBackground style={styles.container} source={require('../Images/bground.png')}>
      {/* Top bar */}
      <View style={styles.fTop}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../icons/back.png')} style={styles.btnBack} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.fEdit}>
        </View>
      </View>

      {/* Banner + Avatar */}
      <View style={styles.fProfile}>
        <Image  
           source={coverImage ? { uri: coverImage } : require('../Images/backgroundProfile.png')}
          style={styles.imgProfile}
        />
        <View style={styles.favatar}>
            <Image
              source={avatar ? { uri: avatar } : require('../Images/avt.png')}
              style={styles.imgAvatar}
            />
          </View>
      </View>
        <View style={styles.detailProfile}>

          <Text style={styles.txtName}>{name}</Text>
          <Text style={styles.txtDes}>{username || ''}</Text>
        </View>

      {/* Actions */}
      <View style={styles.fFunction}>
        { /* Friend/request button */ }
        {!isFriend && sentInvites !== 'pending' && (
          <TouchableOpacity style={styles.btnInfor} onPress={handleAddFriend}>
            <Text style={styles.txtFunction}>Add Friend</Text>
          </TouchableOpacity>
        )}
        {sentInvites === 'pending' && (
          <TouchableOpacity style={styles.btnInfor} onPress={handleCancelInvite}>
            <Text style={styles.txtFunction}>Request Sent</Text>
          </TouchableOpacity>
        )}
        {isFriend && (
          <TouchableOpacity style={styles.btnInfor} onPress={handleUnfriend}>
            <Text style={styles.txtFunction}>Unfriend</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.btnInfor} 
         onPress={async () => {
      try {
        const resp = await axios.post(`/api/conversations/individuals/${_id}`);
        const conversation = resp.data;
        
        if (typeof conversation.type === 'undefined') {
          conversation.type = false;
        }
        navigation.navigate('ChatScreen', {
          conversation,
          userId,
        });
      } catch (err) {
        console.error('Error opening chat:', err);
        Alert.alert('Không thể mở trò chuyện', err.message);
      }
    }}
        >
          <Image source={require('../icons/messsend.png')} style={styles.iconEdit} />
          <Text style={styles.txtFunction}> Send message</Text>
        </TouchableOpacity>
      </View>

      {/* Detail section */}
      <View style={styles.fDetail}>
        <View style={styles.fRow}>
          <View style={styles.circle} />
          <Text style={styles.txtMT}>Information</Text>
        </View>

        <View style={styles.fDetailInfor}>
          <View style={styles.f}>
            <View style={styles.fRowS}>
              <Image source={require('../icons/cake.png')} style={styles.iconDe} />
              <Text style ={styles.fText}>
                Date of birth:{' '}
                {dateOfBirth
                  ? dayjs(dateOfBirth).format('MMMM D, YYYY')
                  : '—'}
              </Text>
            </View>
            <View style={styles.fRowS}>
              <Image source={require('../icons/dog.png')} style={styles.iconDe} />
              <Text style ={styles.fText}>
                Joined:{' '}
                {createdAt
                  ? dayjs(createdAt).format('MMMM D, YYYY')
                  : '—'}
              </Text>
            </View>
            <View style={styles.fRowS}>
              <Image source={require('../icons/house.png')} style={styles.iconDe} />
              <Text style={styles.fText}>Gender: {gender ? 'Female' : 'Male'}</Text>
            </View>
            <View style={styles.fRowS}>
              <View style={styles.iconD}>
                  <Image source={require('../icons/phone.png')}  style={{width:20, height:20}} />
              </View>
              
              <Text style ={styles.fText}>Phone number: {phoneNumber}</Text>
            </View>
          </View>
        </View>

        <View style={styles.fRow}>
          <View style={styles.circle} />
          <Text style={styles.txtMT}>Hobbies</Text>
        </View>

        <View style={styles.fHobbies}>
          {hobbies.length > 0 ? (
            hobbies.map((hobby, i) => (
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: 'white' },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop:25,
  },
  btnBack: { width: 25, height: 18, marginLeft:10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#086DC0', marginLeft:-38 },
  btnEdit: { flexDirection: 'row', alignItems: 'center',width:30, height:30, marginRight:5, backgroundColor:'#086DC0', borderRadius:15, justifyContent:'center'},
  iconEdit: { width: 18, height: 18,tintColor:'white'},
  fProfile: {
    marginTop: 10,
    height: 170,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  imgProfile: { width: '100%', height: '100%', borderRadius: 10 },
  detailProfile: {
    alignItems: 'center',
    marginTop:23
  },
  favatar: {position:'absolute', width: 100, height: 100, borderRadius: 50, overflow: 'hidden',alignSelf:'center' , bottom:-30 },
  imgAvatar: { width: '100%', height: '100%', },
  txtName: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  txtDes: { color: '#086DC0', fontWeight:'500', fontSize:15 },
  fFunction: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnInfor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#086DC0',
    borderRadius: 30,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    height: 30,
    
  },
  txtFunction: { color: 'white', marginLeft: 4 },
  fDetail: { marginTop: 20, flex: 1 },
  fRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  circle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 5,
    borderColor: '#086DC0',
    backgroundColor: 'transparent',
    marginRight: 8,
    
  },
  txtMT: { fontSize: 17, fontWeight: '600' },
  fDetailInfor: { paddingLeft: 28, marginBottom: 20 },
  fRowS: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,

  },
  iconDe: { width: 30, height: 30, marginRight: 10,borderRadius:15,},
  iconD: { width: 30, height: 30, marginRight: 10,borderRadius:15, justifyContent:'center', alignItems:'center', backgroundColor:'#abd8ff', borderRadius:30},
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
  fText:{
    fontSize:16
  }
});
