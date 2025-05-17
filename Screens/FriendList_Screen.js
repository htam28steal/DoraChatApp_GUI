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
import axios from '../api/apiConfig';
import { socket } from '../utils/socketClient';
import { SOCKET_EVENTS } from '../utils/constant';


const searchIcon = require('../icons/searchicon.png');
const bgImage    = require('../Images/bground.png');
const messIcon   = require('../icons/mess.png');
const memberIcon = require('../icons/member.png');
const homeIcon   = require('../icons/Home.png');
const friendIcon = require('../icons/friend.png');
const userIcon   = require('../Images/avt.png');

export default function ListFriendScreen({ navigation }) {
  const [friends, setFriends]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState('');
 const [currentUser, setCurrentUser] = useState(null);
 const [showModal, setShowModal] = useState(false);
 const [selectedFriend, setSelectedFriend] = useState(null);

useEffect(() => {
  if (!currentUser?._id) return;

  console.log('[SOCKET] JOIN_USER →', currentUser._id);
  socket.emit(SOCKET_EVENTS.JOIN_USER, currentUser._id);

const onFriendAccepted = async () => {
  try {
    const updatedFriends = await FriendService.getListFriends();
    console.log('[SOCKET] New friends list:', updatedFriends);
    setFriends(updatedFriends);
  } catch (err) {
    console.error('❌ Failed to refresh friends list after accept:', err);
  }
};


  const onFriendDeleted = (data) => {
    console.log('[SOCKET] DELETED_FRIEND received:', data);
    if (!data || !data._id) return;

    setFriends(prev => prev.filter(f => f._id !== data._id && f.userId !== data._id));
  };

  socket.on(SOCKET_EVENTS.ACCEPT_FRIEND, onFriendAccepted);
  socket.on(SOCKET_EVENTS.DELETED_FRIEND, onFriendDeleted);

  return () => {
    socket.off(SOCKET_EVENTS.ACCEPT_FRIEND, onFriendAccepted);
    socket.off(SOCKET_EVENTS.DELETED_FRIEND, onFriendDeleted);
  };
}, [currentUser]);

 
     const handleDeleteFriend = async (friendId) => {
        try {
            await FriendService.deleteFriend(friendId);
            Alert.alert("Success", "Friend deleted!");
            const updatedList = friends.filter(friend => friend._id !== friendId);
            setFriends(updatedList);
        } catch (error) {
            Alert.alert("Error", "Failed to delete friend");
        }
    };

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
    (async () => {
      try {
        const storedId = await AsyncStorage.getItem('userId');
        if (!storedId) throw new Error('User ID not found');
        const list = await FriendService.getListFriends();
        setFriends(list);
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!query) return friends;
    const lc = query.toLowerCase();
    return friends.filter(f => f.name.toLowerCase().includes(lc));
  }, [friends, query]);

  const renderFriend = ({ item: user }) => (
  <TouchableOpacity style={styles.fMessage}
                        onLongPress={() => {
      setSelectedFriend(user);
      setShowModal(true);
    }}
    >
    <Image
      source={ user.avatar
        ? { uri: user.avatar }
        : require('../Images/avt.png')
      }
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

      <View style={styles.header}>
        <Image source={searchIcon} style={styles.icon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends"
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={setQuery}
        />
      </View>
       <View style={styles.fFillter}>
              <TouchableOpacity style={styles.btnFillter} onPress={()=>navigation.navigate('ListRequestFriendScreen')}> 
                <Text style={styles.txtFillter}>Requests</Text>
              </TouchableOpacity>
                <TouchableOpacity style={styles.btnFillter} onPress={()=>navigation.navigate('ContactScreen')}> 
                <Text style={styles.txtFillter}>Address Book</Text>
              </TouchableOpacity>
               <TouchableOpacity style={styles.btnFillter} onPress={()=>navigation.navigate('FindUserScreen')}>
                <Text style={styles.txtFillter}>Add Friend</Text>
              </TouchableOpacity>

            </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#086DC0"
          style={{ marginTop: 150 }}
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
      <TouchableOpacity
        style={styles.modalButton}
        onPress={() => setShowModal(false)}
      >
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
  bg:        { position: 'absolute', width: '100%', height: '100%' },

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
  icon:        { width: 18, height: 18, marginRight: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: 16 },

  list:             { paddingTop: 130, paddingHorizontal: 10, paddingBottom: 20 },
  placeholderText:  { textAlign: 'center', marginTop: 150, fontSize: 16, color: '#555' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: { width: 55, height: 55, borderRadius: 27.5, marginRight: 12 },
  info:   { flex: 1, justifyContent: 'center' },
  name:   { fontSize: 17, fontWeight: '600', color: '#086DC0', marginLeft: 5 },
  snippet:{ fontSize: 14, color: '#666', marginTop: 4 },

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
// in StyleSheet.create({ … })
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
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 5,
  justifyContent: 'center',
  alignItems: 'center',
},
requestSentText: {
  width:40,
  height:40,
  color: '#888',
  fontStyle: 'italic',
},
modalOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
},
modalBox: {
  width: 250,
  padding: 20,
  backgroundColor: 'white',
  borderRadius: 8,
  alignItems: 'center',
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 15,
},
modalButton: {
  paddingVertical: 10,
  paddingHorizontal: 20,
  backgroundColor: '#eee',
  borderRadius: 6,
  width: '100%',
  alignItems: 'center',
  marginTop: 10,
},
modalButtonText: {
  fontSize: 16,
  color: '#333',
},

});
