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
import UserService from '../api/userService';


const bgImage    = require('../Images/bground.png');
const messIcon   = require('../icons/mess.png');
const memberIcon = require('../icons/member.png');
const homeIcon   = require('../icons/QR.png');
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
   const [txtSearch, setTxtSearch] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [stateFriend, setStateFriend] = useState(null);
const [sentInvites, setSentInvites] = useState(null);

const handleSearch = async (searchValue) => {
  setNotFound(false); // reset for each new search

  const phoneRegex = /^(0[0-9]{9})$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!searchValue) {
    Alert.alert('Vui lòng nhập số điện thoại hoặc email');
    return;
  }

  let user = null;
  try {
    if (phoneRegex.test(searchValue)) {
      const resp = await UserService.getUserByPhoneNumber(searchValue);
      user = resp.data ?? resp;
    } else if (emailRegex.test(searchValue)) {
      const resp = await UserService.getUserByEmail(searchValue);
      user = resp.data ?? resp;
    } else {
      Alert.alert('Định dạng không hợp lệ', 'Vui lòng nhập số điện thoại hoặc email hợp lệ.');
      setSearchResults([]);
      setNotFound(false);
      return;
    }

    if (!user || !user._id) {
      setSearchResults([]);
      setNotFound(true);
      return;
    }

    setSearchResults([user]);
    setNotFound(false);

    // ... (friend status logic) ...
  } catch (err) {
    setSearchResults([]);
    setNotFound(true);
  }
};


const handleAddFriend = async (friendId) => {
  try {
    const response = await FriendService.sendFriendInvite(friendId);
    if (response.status === 201) {
      setSentInvites('pending');
    }
  } catch (error) {
    console.error('Error sending friend request:', error);
    Alert.alert('Không thể gửi lời mời kết bạn');
  }
};

const handleThuHoi = async (friendId) => {
  try {
    await FriendService.deleteInviteWasSend(friendId);
    setSentInvites(null);
    setStateFriend(false);
  } catch (error) {
    console.error('Lỗi khi thu hồi lời mời:', error);
    Alert.alert('Lỗi', 'Không thể thu hồi lời mời. Vui lòng thử lại.');
  }
};
const renderSearchItem = ({ item }) => (
      <TouchableOpacity
    style={styles.fMessage}
    onPress={async () => {
      try {
        const resp = await axios.post(`/api/conversations/individuals/${item._id}`);
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
      {item.avatar ? <Image source={{uri:item.avatar}} style={styles.imgAG}/> : <View style={[styles.avatarCl,{backgroundColor:item.avatarColor||'#086DC0'}]}><Text style={styles.avatarText}>{item.name.charAt(0)}</Text></View>}
      <View style={styles.fInfoText}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.phoneNumber}  numberOfLines={1}>{item.username}</Text>
      </View>
      <View style={styles.fInfoAction}>
      {stateFriend === false && sentInvites !== 'pending' && (
        <TouchableOpacity
          style={styles.btnAccept}
          onPress={() => handleAddFriend(item._id)}
        >
          <Text style={styles.txtAccecpt}>Add Friend</Text>
        </TouchableOpacity>
      )}
        {stateFriend===true  && <View style={styles.btnDisabled}><Text style={styles.txtAccecpt}>Friend</Text></View>}
        {sentInvites==='pending' && <TouchableOpacity style={styles.btnPending} onPress={()=>handleThuHoi(item._id)}><Text style={styles.txtAccecpt}>Request Sent</Text></TouchableOpacity>}
      </View>
    </TouchableOpacity>
  );

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
  const handleFriendAccepted = async (data) => {
  if (!data?._id) return;

  try {
    const resp = await UserService.getUserById(data._id);
    const fullUser = resp.data ?? resp;
    setFriends((prev) => prev.filter(f => f._id !== fullUser._id));
  } catch (err) {
    console.warn('Could not fetch accepted user data:', err);
    setFriends((prev) => prev.filter(f => f._id !== data._id));
  }

  // Reset search status if matched
  if (searchResults.length > 0 && searchResults[0]._id === data._id) {
    setStateFriend(true);
    setSentInvites(null);
  }
};

const handleFriendInviteDeleted = (senderId) => {
  const id = typeof senderId === 'string' ? senderId : senderId?.senderId;
  if (!id) return;

  setFriends((prev) => prev.filter(f => f._id !== id));

  if (searchResults.length > 0 && searchResults[0]._id === id) {
    setStateFriend(false);
    setSentInvites(null);
  }
};


 useEffect(() => {
  if (!currentUser?._id) return;

  console.log('[SOCKET] JOIN_USER →', currentUser._id);
  socket.emit(SOCKET_EVENTS.JOIN_USER, currentUser._id);

  const onInviteDeleted = handleFriendInviteDeleted;
  const onFriendAccepted = handleFriendAccepted;

  const onNewInvite = (user) => {
    console.log('[SOCKET] SEND_FRIEND_INVITE received:', user);

    const normalizedUser = {
      _id: user._id,
      name: user.name || 'Unnamed',
      username: user.username || 'unknown',
      avatar: user.avatar || null,
    };

    setFriends((prev) => {
      const already = prev.find(f => f._id === normalizedUser._id);
      return already ? prev : [...prev, normalizedUser];
    });
  };
  const onFriendDeleted = (data) => {
    if (!data?._id) return;

    setFriends(prev => prev.filter(f => f._id !== data._id));

    if (searchResults.length > 0 && searchResults[0]._id === data._id) {
      setStateFriend(false);
    }
  };

  socket.on(SOCKET_EVENTS.DELETED_FRIEND_INVITE, onInviteDeleted);
  socket.on(SOCKET_EVENTS.ACCEPT_FRIEND, onFriendAccepted);
  socket.on(SOCKET_EVENTS.SEND_FRIEND_INVITE, onNewInvite);
  socket.on(SOCKET_EVENTS.DELETED_FRIEND, onFriendDeleted);
  return () => {
    socket.off(SOCKET_EVENTS.DELETED_FRIEND_INVITE, onInviteDeleted);
    socket.off(SOCKET_EVENTS.ACCEPT_FRIEND, onFriendAccepted);
    socket.off(SOCKET_EVENTS.SEND_FRIEND_INVITE, onNewInvite);
     socket.off(SOCKET_EVENTS.DELETED_FRIEND, onFriendDeleted);
  };
}, [currentUser, searchResults]);



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
  <TouchableOpacity onPress={() => handleSearch(txtSearch)}>
    <Image source={searchIcon} style={styles.icon} />
  </TouchableOpacity>
  <TextInput
    style={styles.searchInput}
    placeholder="Search phone number"
    placeholderTextColor="#aaa"
    value={txtSearch}
    onChangeText={(text) => { setTxtSearch(text); setQuery(''); }}
    onSubmitEditing={() => handleSearch(txtSearch)}
  />
</View>

             <View style={styles.fFillter}>
                    <TouchableOpacity style={styles.btnFillterChosen}> 
                      <Text style={styles.txtFillter}>Requests</Text>
                    </TouchableOpacity>
                      <TouchableOpacity style={styles.btnFillter} onPress={()=>navigation.navigate('ContactScreen')}> 
                      <Text style={styles.txtFillter}>Address Book</Text>
                    </TouchableOpacity>

      
                  </View>
{loading ? (
  <ActivityIndicator size="large" color="#086DC0" style={{ marginTop: 150 }} />
) : txtSearch ? (
  searchResults.length > 0 ? (
    <FlatList
      contentContainerStyle={styles.list}
      data={searchResults}
      keyExtractor={item => item._id}
      renderItem={renderSearchItem}
    />
  ) : notFound ? (
    <Text style={styles.placeholderText}>User not found.</Text>
  ) : null
) : (
  <FlatList
    contentContainerStyle={styles.list}
    data={filtered}
    keyExtractor={item => item._id}
    renderItem={renderFriend}
    ListEmptyComponent={<Text style={styles.placeholderText}>No friend requests.</Text>}
  />
)}




<View style={styles.fFooter}>
        <TouchableOpacity style={styles.btnTags}>
          <Image source={messIcon} style={styles.iconfooter} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTags} onPress={()=>navigation.navigate('GroupsScreen')}>
          <Image source={memberIcon} style={styles.iconfooter} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTags} onPress={() => navigation.navigate('QRScreen')}>
          <Image source={homeIcon} style={styles.iconfooter} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTags} onPress={()=>navigation.navigate('FriendList_Screen')}>
          <Image source={friendIcon} style={styles.iconfooter} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTags}  onPress={()=>navigation.navigate('ProfileScreen')} >
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
    marginRight:10
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
    marginBottom:20
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
  btnAccept: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CBB17', borderRadius: 30, paddingHorizontal: 10, paddingVertical: 5 },
  btnDisabled: { backgroundColor: '#999', borderRadius: 30, paddingHorizontal: 10, paddingVertical: 5 },
  btnPending: { backgroundColor: '#FFA500', borderRadius: 30, paddingHorizontal: 10, paddingVertical: 5 },
  iconaddF: { width: 15, height: 15, marginRight: 5 },
  txtAccecpt: { fontSize: 11, fontWeight: '500', color: 'white' },
  placeholderText:{
    alignSelf:'center',
    fontWeight:'bold',
    fontSize:16
  },
  fInfoText:{
    marginRight:25
  },

});
