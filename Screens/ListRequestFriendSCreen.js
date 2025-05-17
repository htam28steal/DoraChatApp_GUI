import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FriendService from '../api/friendService';
import searchIcon from '../icons/searchicon.png';
import axios from '../api/apiConfig';
import { socket } from "../utils/socketClient";
import { SOCKET_EVENTS } from "../utils/constant";


const bgImage    = require('../Images/bground.png');
const messIcon   = require('../icons/mess.png');
const memberIcon = require('../icons/member.png');
const homeIcon   = require('../icons/Home.png');
const friendIcon = require('../icons/friend.png');
const userIcon   = require('../Images/avt.png');
const checkIcon = require('../icons/check.png');
const rejectIcon = require('../icons/Reject.png');


export default function ListRequestFriendScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
   const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.warn('⚠️ No token found in storage');
        return;
      }

      const { data } = await axios.get('/api/me/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ Loaded current user:', data);
      setCurrentUser(data);
    } catch (err) {
      console.error('❌ Failed to fetch current user', err);
    }
  };

  fetchCurrentUser();
}, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        const tk = await AsyncStorage.getItem('userToken');
        setUserId(id);
        setToken(tk);
      } catch (err) {
        Alert.alert('Error', 'Failed to load user');
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (userId && token) {
      FriendService.getListRequestFriends(userId, token)
        .then(setFriends)
        .catch(err => console.log(err))
        .finally(() => setLoading(false));
    }
  }, [userId, token]);

  const handleAccept = async (friendId) => {
    try {
      await FriendService.acceptFriend(friendId);
          // Emit accept event to let the other user update their state
    socket.emit(SOCKET_EVENTS.ACCEPT_FRIEND, {
      senderId: friendId,
      receiverId: currentUser?._id,
    });
      setFriends(prev => prev.filter(f => f._id !== friendId));
    } catch {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  useEffect(() => {
  if (!currentUser?._id) return;

  console.log('[SOCKET] JOIN_USER →', currentUser._id);
  socket.emit(SOCKET_EVENTS.JOIN_USER, currentUser._id);

  const onInviteDeleted = (data) => {
    console.log('[SOCKET] DELETED_FRIEND_INVITE received:', data);
    const senderId = typeof data === 'string' ? data : data.senderId;
    setFriends(prev => prev.filter(f => f._id !== senderId));
  };

  const onFriendAccepted = (user) => {
    console.log('[SOCKET] ACCEPT_FRIEND received:', user);
    // someone accepted your request

    setFriends(prev => prev.filter(f => f._id !== user._id));
  };

const onNewInvite = (user) => {
  console.log('[SOCKET] SEND_FRIEND_INVITE received:', user);

  // Defensive: Ensure all fields are present
  const normalizedUser = {
    _id: user._id,
    name: user.name || 'Unnamed',
    username: user.username || 'unknown',
    avatar: user.avatar || null,
  };

  setFriends(prev => {
    const already = prev.find(f => f._id === normalizedUser._id);
    return already ? prev : [...prev, normalizedUser];
  });
};


  socket.on(SOCKET_EVENTS.DELETED_FRIEND_INVITE, onInviteDeleted);
  socket.on(SOCKET_EVENTS.ACCEPT_FRIEND, onFriendAccepted);
  socket.on(SOCKET_EVENTS.SEND_FRIEND_INVITE, onNewInvite);

  return () => {
    socket.off(SOCKET_EVENTS.DELETED_FRIEND_INVITE, onInviteDeleted);
    socket.off(SOCKET_EVENTS.ACCEPT_FRIEND, onFriendAccepted);
    socket.off(SOCKET_EVENTS.SEND_FRIEND_INVITE, onNewInvite);
  };
}, [currentUser]);


  const handleReject = async (friendId) => {
    try {
      await FriendService.deleteFriendInvite(friendId);
     socket.emit(SOCKET_EVENTS.DELETED_FRIEND_INVITE, {
      senderId: currentUser?._id,
      receiverId: friendId,
    });
      setFriends(prev => prev.filter(f => f._id !== friendId));
    } catch {
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  const filtered = useMemo(() => {
    if (!query) return friends;
    return friends.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, friends]);

const renderFriend = ({ item }) => (
  <View style={styles.fMessage}>
    <Image
      source={item.avatar ? { uri: item.avatar } : userIcon}
      style={styles.imgAG}
    />

<View style={styles.fInfor}>
  <Text style={styles.name}>{item.name}</Text>
  <Text style={styles.phoneNumber} numberOfLines={1}>
     Hello, I'm {item.name}
  </Text>
</View>


    <View style={styles.actionContainer}>
      <TouchableOpacity
        onPress={() => handleAccept(item._id)}
        style={[styles.requestSent, { backgroundColor: '#4CAF50' }]}
      >
        <Image source={checkIcon} style={styles.iconAction} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleReject(item._id)}
        style={[styles.requestSent, { backgroundColor: '#F44336', marginLeft:5}]}
      >
        <Image source={rejectIcon} style={styles.iconAction} />
      </TouchableOpacity>
    </View>
  </View>
);



  return (
    <View style={styles.container}>
      <Image source={bgImage} style={styles.bg} />

      <View style={styles.header}>
        <Image source={searchIcon} style={styles.icon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search requests"
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={setQuery}
        />
      </View>
             <View style={styles.fFillter}>
                    <TouchableOpacity style={styles.btnFillterChosen}> 
                      <Text style={styles.txtFillter}>Requests</Text>
                    </TouchableOpacity>
                      <TouchableOpacity style={styles.btnFillter} onPress={()=>navigation.navigate('ContactScreen')}> 
                      <Text style={styles.txtFillter}>Address Book</Text>
                    </TouchableOpacity>
                     <TouchableOpacity style={styles.btnFillter}  onPress={()=>navigation.navigate('FindUserScreen')}>
                      <Text style={styles.txtFillter}>Add Friend</Text>
                    </TouchableOpacity>
      
                  </View>

      {loading ? (
        <ActivityIndicator size="large" color="#086DC0" style={{ marginTop: 150 }} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderFriend}
        />
      )}


      <View style={styles.fFooter}>
              <TouchableOpacity style={styles.btnTags}>
                <Image source={messIcon} style={styles.iconfooter} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnTags}
                onPress={() => navigation.navigate('GroupsScreen')}
              >
                <Image source={memberIcon} style={styles.iconfooter} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnTags}>
                <Image source={homeIcon} style={styles.iconfooter} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnTags}
                onPress={() => navigation.navigate('FriendList_Screen')}
              >
                <Image source={friendIcon} style={styles.iconfooter} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnTags}>
               {currentUser?.avatar ? (
        <Image source={{ uri: currentUser.avatar }} style={styles.avatarFooter} />
      ) : (
        <Image source={userIcon} style={styles.avatarFooter} />
      )}
      
              </TouchableOpacity>
            </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D8EDFF' },
  bg: { position: 'absolute', width: '100%', height: '100%' },
  header: {
    marginTop: 15,
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    height: 45,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 2,
  },
  icon: { width: 18, height: 18, marginRight: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: 16 },
  list:             { paddingTop: 130, paddingHorizontal: 10, paddingBottom: 20 },
fMessage: {
  flexDirection: 'row',
  alignItems: 'center',
  height: 65,
  borderBottomWidth: 1,
  borderBottomColor: 'white',
  paddingHorizontal: 5,
  width: '100%',
},
  imgAG: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  fInfor: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#086DC0',
  },
  phoneNumber: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
  requestSent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  requestSentText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  fFooter: {
    position: 'absolute',
    bottom: 10,
    width: '90%',
    height: 54,
    backgroundColor: 'white',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    alignSelf: 'center',
  },
  btnTags:     { width: 66, height: 45, backgroundColor: 'white', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  btnTag:      { width: 66, height: 45, backgroundColor: '#086DC0', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  iconfooter:  { width: 25, height: 25 },
  avatarFooter:{ width: 40, height: 40, borderRadius: 100 },
   fFillter: {
    position: 'absolute',
    top: 70,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    zIndex: 3,
  },
  iconAction: {
  width: 20,
  height: 20,
  tintColor: 'white',
},
actionContainer: {
  justifyContent: 'space-between',
  alignItems: 'center',
  marginLeft: 10,
  flexDirection:'row',
},
fFillter: {
    position: 'absolute',
    top: 70,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    zIndex: 3,
  },
  btnFillter: {
    width: 115,
    height: 30,
    borderRadius: 30,
    backgroundColor: '#FFEED4',
    justifyContent: 'center',
    alignItems: 'center',
  },
    btnFillterChosen: {
    width: 85,
    height: 30,
    borderRadius: 30,
    backgroundColor: '#AFDDFF',
    justifyContent: 'center',
    alignItems: 'center',
    },
  txtFillter: { fontSize: 16, fontWeight: '600', color: '#F49300' },
txtFillterChosen: { fontSize: 16, fontWeight: '600', color: '#F49300' },


});
