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
import UserService from '../api/userService';
import axios from '../api/apiConfig';
import { socket } from '../utils/socketClient';
import { SOCKET_EVENTS } from '../utils/constant';


const searchIcon = require('../icons/searchicon.png');
const bgImage    = require('../Images/bground.png');
const messIcon   = require('../icons/mess.png');
const memberIcon = require('../icons/member.png');
const homeIcon   = require('../icons/QR.png');
const friendIcon = require('../icons/friend.png');
const userIcon   = require('../Images/avt.png');
const addFriendIcon = require('../icons/addf.png');

export default function ListFriendScreen({ navigation }) {
  const [friends, setFriends]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [query, setQuery]                 = useState('');
  const [currentUser, setCurrentUser]     = useState(null);
  const [showModal, setShowModal]         = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);

  // Search & Friend-request state
  const [userId, setUserId]       = useState(null);
  const [txtSearch, setTxtSearch] = useState('');
  const [listSearch, setListSearch] = useState([]);
  const [stateFriend, setStateFriend] = useState(null);
  const [sentInvites, setSentInvites] = useState(null);

  // Load stored userId for requests
  useEffect(() => {
    const loadUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };
    loadUserId();
  }, []);

 

  // Handle phone-number search
  const handleSearch = async (phoneNumber) => {
  if (!phoneNumber) {
    Alert.alert('Vui lòng nhập số điện thoại');
    return;
  }

  let user;
  try {
    // 1) Pull the actual user object out of whatever the service returns
    const resp = await UserService.getUserByPhoneNumber(phoneNumber);
    // if your service is axios-style you might need:
    //    user = resp.data;
    // or resp.data.user;
    user = resp.data ?? resp;                  
    if (!user._id) throw new Error('Không nhận được dữ liệu người dùng');
    setListSearch([user]);
  } catch (err) {
    console.error('Error fetching user by phone:', err);
    Alert.alert('Không tìm thấy người dùng');
    setListSearch([]);
    return;
  }

  // 2) These secondary calls can now fail harmlessly
  try {
    const isF = await FriendService.isFriend(userId, user._id);
    setStateFriend(isF);
  } catch (err) {
    console.warn('Could not check friendship status:', err);
  }

  try {
    const invites = await FriendService.getListFriendInviteMe();
    const pending = invites.some(inv => inv._id === user._id);
    setSentInvites(pending ? 'pending' : null);
  } catch (err) {
    console.warn('Could not load pending invites:', err);
  }
};


  // Send friend invite
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

  // Revoke sent invite
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

useEffect(() => {
  if (!currentUser?._id || !userId) return;

  socket.emit(SOCKET_EVENTS.JOIN_USER, currentUser._id);

const handleFriendAccepted = async (data) => {
  if (!data?._id) return;

  try {
    // Fetch full user data (assumes this endpoint exists)
    const resp = await UserService.getUserById(data._id);
    const fullUser = resp.data ?? resp;

    setFriends((prev) => [...prev, fullUser]);

    if (listSearch.length > 0 && listSearch[0]._id === fullUser._id) {
      setStateFriend(true);
      setSentInvites(null);
    }
  } catch (err) {
    console.warn('Could not fetch full user after accept:', err);
    // Fallback to use partial data if needed
    setFriends((prev) => [...prev, data]);
  }
};


const handleFriendInviteDeleted = (userIdDeclined) => {
  if (!userIdDeclined) return;
  if (listSearch.length > 0 && listSearch[0]._id === userIdDeclined) {
    setStateFriend(false);
    setSentInvites(null);
  }
};


  const handleFriendInviteDeclined = (data) => {
    if (!data?._id) return;
    if (listSearch.length > 0 && listSearch[0]._id === data._id) {
      setStateFriend(false);
      setSentInvites(null);
    }
  };

  const handleFriendDeleted = (data) => {
    if (!data?._id) return;
    setFriends((prev) => prev.filter(f => f._id !== data._id && f.userId !== data._id));
    if (listSearch.length > 0 && listSearch[0]._id === data._id) {
      setStateFriend(false);
    }
  };

  socket.on(SOCKET_EVENTS.ACCEPT_FRIEND, handleFriendAccepted);
  socket.on(SOCKET_EVENTS.DELETED_FRIEND_INVITE, handleFriendInviteDeleted);
  socket.on(SOCKET_EVENTS.DELETED_FRIEND, handleFriendDeleted);

  return () => {
    socket.off(SOCKET_EVENTS.ACCEPT_FRIEND, handleFriendAccepted);
    socket.off(SOCKET_EVENTS.DELETED_FRIEND_INVITE, handleFriendInviteDeleted);
    socket.off(SOCKET_EVENTS.DELETED_FRIEND, handleFriendDeleted);
  };
}, [currentUser, userId, listSearch]);



  // Delete existing friend
  const handleDeleteFriend = async (friendId) => {
    try {
      await FriendService.deleteFriend(friendId);
      Alert.alert('Success', 'Friend deleted!');
      setFriends(prev => prev.filter(f => f._id !== friendId));
    } catch {
      Alert.alert('Error', 'Failed to delete friend');
    }
  };

  // Fetch current user profile
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;
        const { data } = await axios.get('/api/me/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMe();
  }, []);
socket.onAny((event, data) => {
  console.log('Socket Event:', event, data);
});

  // Initial load of friends
  useEffect(() => {
    (async () => {
      try {
        const storedId = await AsyncStorage.getItem('userId');
        if (!storedId) throw new Error('User ID not found');
        const list = await FriendService.getListFriends();
        setFriends(list);
      } catch (e) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Local filter for friend list
  const filtered = useMemo(() => {
    if (!query) return friends;
    const lc = query.toLowerCase();
    return friends.filter(f => f.name.toLowerCase().includes(lc));
  }, [friends, query]);

  // Render for search result items
  const renderSearchItem = ({ item }) => (
  <TouchableOpacity
    style={styles.fMessage}
    onPress={async () => {
      try {
        const resp = await axios.post(`/api/conversations/individuals/${item._id}`);
        const conversation = resp.data;

        // 🛠️ Patch missing type if undefined
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
          <Text style={styles.txtAccecpt}>Kết bạn</Text>
        </TouchableOpacity>
      )}
        {stateFriend===true  && <View style={styles.btnDisabled}><Text style={styles.txtAccecpt}>Đã kết bạn</Text></View>}
        {sentInvites==='pending' && <TouchableOpacity style={styles.btnPending} onPress={()=>handleThuHoi(item._id)}><Text style={styles.txtAccecpt}>Đã gửi lời mời</Text></TouchableOpacity>}
      </View>
    </TouchableOpacity>
  );

  // Render for existing friend list
const renderFriend = ({ item: user }) => (
  <TouchableOpacity
    style={styles.fMessage}
    onLongPress={() => {
      setSelectedFriend(user);
      setShowModal(true);
    }}
    onPress={() => {
      navigation.navigate('YourFriendScreen', {          
        userId: user._id, // friend's user ID
      });
    }}
  >
    <Image
      source={user.avatar ? { uri: user.avatar } : require('../Images/avt.png')}
      style={styles.imgAG}
    />
    <View style={styles.fInfor}>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.phoneNumber} numberOfLines={1}>
        {user.username}
      </Text>
    </View>
  </TouchableOpacity>
);


  return (
    <View style={styles.container}>
      <Image source={bgImage} style={styles.bg} />

      {/* Search bar: toggles between phone-search and name-filter */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => handleSearch(txtSearch)}>
          <Image source={searchIcon} style={styles.icon} />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends"
          placeholderTextColor="#aaa"
          value={txtSearch}
          onChangeText={text => { setTxtSearch(text); setQuery(''); }}
          onSubmitEditing={() => handleSearch(txtSearch)}
        />
      </View>

      {/* Filters/Navigation */}
      <View style={styles.fFillter}>
        <TouchableOpacity style={styles.btnFillter} onPress={() => navigation.navigate('ListRequestFriendScreen')}>
          <Text style={styles.txtFillter}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnFillter} onPress={() => navigation.navigate('ContactScreen')}>
          <Text style={styles.txtFillter}>Address Book</Text>
        </TouchableOpacity>
      </View>

      {/* Main content: search results or friends list */}
      {loading ? (
        <ActivityIndicator size="large" color="#086DC0" style={{ marginTop: 150 }} />
      ) : txtSearch ? (
        <FlatList
          contentContainerStyle={styles.list}
          data={listSearch}
          keyExtractor={item => item._id}
          renderItem={renderSearchItem}
          ListEmptyComponent={<Text style={styles.emptyListText}>Không tìm thấy người dùng.</Text>}
        />
      ) : filtered.length === 0 ? (
        <Text style={styles.placeholderText}>No friends found.</Text>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderFriend}
        />
      )}

      {/* Footer navigation */}
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
        <TouchableOpacity style={styles.btnTags}>
         {currentUser?.avatar ? (
           <Image source={{ uri: currentUser.avatar }} style={styles.avatarFooter} />
         ) : (
           <Image source={userIcon} style={styles.avatarFooter} />
         )}
        </TouchableOpacity>
      </View>

      {/* Modal for friend actions */}
      {showModal && selectedFriend && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Actions</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#ff4d4d' }]}
              onPress={() => handleDeleteFriend(selectedFriend._id)}
            >
              <Text style={[styles.modalButtonText, { color: 'white' }]}>Delete Friend</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowModal(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D8EDFF' },
  bg: { position: 'absolute', width: '100%', height: '100%' },
  header: {
    marginTop: 15,
    position: 'absolute',
    top: 10, left: 10, right: 10,
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
  list: { paddingTop: 130, paddingHorizontal: 10, paddingBottom: 20 },
  placeholderText: { textAlign: 'center', marginTop: 150, fontSize: 16, color: '#555' },
  fFillter: {
    position: 'absolute',
    top: 70, left: 10, right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    zIndex: 3,
  },
  btnFillter: { width: 115, height: 30, borderRadius: 30, backgroundColor: '#FFEED4', justifyContent: 'center', alignItems: 'center' },
  txtFillter: { fontSize: 16, fontWeight: '600', color: '#F49300' },
  fMessage: { flexDirection: 'row', alignItems: 'center', height: 65, borderBottomWidth: 1, borderBottomColor: 'white', paddingHorizontal: 10, width: '100%' },
  imgAG: { width: 55, height: 55, borderRadius: 27.5 },
  avatarCl: { width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 25, fontWeight: 'bold', color: 'white' },
  fInfor: { flex: 1, justifyContent: 'center', marginLeft: 10 },
  fInfoText: { flex: 1, justifyContent: 'center', marginLeft: 10 },
  fInfoAction: { justifyContent: 'center', alignItems: 'flex-end', marginLeft: 10 },
  name: { fontSize: 17, fontWeight: '600', color: '#086DC0' },
  phoneNumber: { fontSize: 14, color: '#444', marginTop: 4 },
  btnAccept: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CBB17', borderRadius: 30, paddingHorizontal: 10, paddingVertical: 5 },
  btnDisabled: { backgroundColor: '#999', borderRadius: 30, paddingHorizontal: 10, paddingVertical: 5 },
  btnPending: { backgroundColor: '#FFA500', borderRadius: 30, paddingHorizontal: 10, paddingVertical: 5 },
  iconaddF: { width: 15, height: 15, marginRight: 5 },
  txtAccecpt: { fontSize: 11, fontWeight: '500', color: 'white' },
  emptyListText: { textAlign: 'center', marginTop: 20, color: '#666' },
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
  btnTags: { width: 66, height: 45, backgroundColor: 'white', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  iconfooter: { width: 25, height: 25 },
  avatarFooter: { width: 40, height: 40, borderRadius: 100 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  modalBox: { width: 250, padding: 20, backgroundColor: 'white', borderRadius: 8, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#eee', borderRadius: 6, width: '100%', alignItems: 'center', marginTop: 10 },
  modalButtonText: { fontSize: 16, color: '#333' },
});
