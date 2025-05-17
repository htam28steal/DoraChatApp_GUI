import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import axios from '../api/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socket } from '../utils/socketClient';
import { SOCKET_EVENTS } from '../utils/constant';
import * as Contacts from 'expo-contacts';
import FriendService from '../api/friendService'; // adjust path if needed

const addFrIcon = require('../icons/addFriend.png');

export default function ContactScreen({ navigation }) {
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);

  const [friends, setFriends] = useState([]);
  const [showContacts, setShowContacts] = useState(false);

  const [phoneBookUsers, setPhoneBookUsers] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    if (!currentUser?._id) return;

    console.log('[SOCKET] JOIN_USER →', currentUser._id);
    socket.emit(SOCKET_EVENTS.JOIN_USER, currentUser._id);

    const onFriendAccepted = (data) => {
      console.log('[SOCKET] ACCEPT_FRIEND received:', data);

      // The server sends the user object that was accepted (i.e. receiver/sender)
      const acceptedUserId = data?._id;
      if (!acceptedUserId) return;

      console.log(
        '[SOCKET] CurrentUser:',
        currentUser._id,
        'AcceptedUserId:',
        acceptedUserId
      );

      // Remove from sentRequests if we had sent to this person
      setSentRequests((prev) => {
        const next = prev.filter((id) => id !== acceptedUserId);
        console.log('[SOCKET] Updated sentRequests:', next);
        return next;
      });

      // Refresh friend list to reflect the new friend
      FriendService.getListFriends().then((friendsList) => {
        console.log('[SOCKET] New friends list:', friendsList);
        setFriends(friendsList);
      });
    };
    const onFriendDeleted = (data) => {
      console.log('[SOCKET] DELETED_FRIEND received:', data);

      const deletedUserId = data?._id;
      if (!deletedUserId) return;

      // Remove from friends
      setFriends((prev) => {
        const next = prev.filter(
          (f) => f._id !== deletedUserId && f.userId !== deletedUserId
        );
        console.log('[SOCKET] Updated friends list after deletion:', next);
        return next;
      });
    };

    const onFriendInviteDeleted = (data) => {
      console.log('[SOCKET] DELETED_FRIEND_INVITE received:', data);
      const declinerId = typeof data === 'string' ? data : data.receiverId;
      if (!declinerId) return;

      setSentRequests((prev) => prev.filter((id) => id !== declinerId));
    };

    socket.on(SOCKET_EVENTS.ACCEPT_FRIEND, onFriendAccepted);
    socket.on(SOCKET_EVENTS.DELETED_FRIEND_INVITE, onFriendInviteDeleted);
    socket.on(SOCKET_EVENTS.DELETED_FRIEND, onFriendDeleted);
    return () => {
      socket.off(SOCKET_EVENTS.ACCEPT_FRIEND, onFriendAccepted);
      socket.off(SOCKET_EVENTS.DELETED_FRIEND_INVITE, onFriendInviteDeleted);
      socket.off(SOCKET_EVENTS.DELETED_FRIEND, onFriendDeleted);
    };
  }, [currentUser]);

  useEffect(() => {
    const fetchSentInvites = async () => {
      try {
        // this hits your router.get('/invites/me', ...) handler
        const { data } = await axios.get('/api/friends/invites/me');
        // data is already an array of user objects you’ve invited
        setSentRequests(data.map((u) => u._id));
      } catch (error) {
        console.error('❌ Failed to fetch sent invites:', error);
      }
    };

    fetchSentInvites();
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendList = await FriendService.getListFriends();
        setFriends(friendList); // You already have this state
      } catch (error) {
        console.error('Error loading friends:', error);
      }
    };

    fetchFriends();
  }, []);

  const isAlreadyFriend = useCallback(
    (userId) => friends.some((f) => f._id === userId || f.userId === userId),
    [friends]
  );

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          Alert.alert(
            'Missing token',
            'Cannot fetch profile without authentication.'
          );
          return;
        }

        const { data } = await axios.get('/api/me/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCurrentUser(data);
      } catch (err) {
        console.error('❌ Failed to load current user info', err);
      }
    };

    fetchUserInfo();
  }, []);
  // when query or phoneBookUsers changes, re‐filter contacts
  useEffect(() => {
    if (!showContacts) return; // only run when in contacts mode
    if (!query) {
      setFilteredContacts(phoneBookUsers);
    } else {
      const q = query.toLowerCase();
      setFilteredContacts(
        phoneBookUsers.filter((u) => u.name.toLowerCase().includes(q))
      );
    }
  }, [query, phoneBookUsers, showContacts]);

  // you can keep your existing convos‐filter hook, but use filteredConvs there

  useEffect(() => {
    (async () => {
      // 1) ask permission
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission denied',
          'Cannot load contacts without permission.'
        );
        setLookupLoading(false);
        return;
      }

      // 2) fetch contacts with phone numbers
      const { data: rawContacts } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });
      if (!rawContacts.length) {
        setLookupLoading(false);
        return;
      }

      // 3) flatten all phone numbers, normalize them
      const numbers = rawContacts
        .flatMap((c) => (c.phoneNumbers || []).map((p) => p.number))
        .map((num) => num.replace(/\D/g, '')) // strip non-digits
        .filter((num, i, arr) => num && arr.indexOf(num) === i); // unique, non-empty

      // 4) lookup each number on your API
      const lookups = numbers.map((number) =>
        axios
          .get(`/api/users/search/phone-number/${number}`)
          .then((res) => res.data)
          .catch(() => null)
      );

      const results = await Promise.all(lookups);

      // 5) keep only those that exist
      const foundUsers = results.filter((u) => u && u._id);
      setPhoneBookUsers(foundUsers);
      setLookupLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('userToken');
      console.log('🔍 Retrieved token in ConversationScreen:', token);
    })();
  }, []);

  const friendsById = useMemo(() => {
    const map = {};
    friends.forEach((f) => {
      const key = f.userId ? f.userId : f._id;
      map[key] = f;
    });
    return map;
  }, [friends]);

  const renderContactItem = ({ item: user }) => {
    const alreadyFriend = isAlreadyFriend(user._id);
    const isRequestSent = sentRequests.includes(user._id);

    const handleAddFriend = async () => {
      try {
        await FriendService.sendFriendInvite(user._id);
        setSentRequests((prev) => [...prev, user._id]);

        socket.emit(SOCKET_EVENTS.SEND_FRIEND_INVITE, {
          senderId: currentUser._id,
          receiverId: user._id,
        });

        Alert.alert('Success', `Friend request sent to ${user.name}`);
      } catch (error) {
        Alert.alert('Error', 'Could not send friend request.');
        console.error(error);
      }
    };

    return (
      <View style={styles.fMessage}>
        <Image
          source={
            user.avatar ? { uri: user.avatar } : require('../Images/avt.png')
          }
          style={styles.imgAG}
        />
        <View style={styles.fInfor}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.phoneNumber} numberOfLines={1}>
            {user.username || 'No phone'}
          </Text>
        </View>

        {!alreadyFriend &&
          (isRequestSent ? (
            <TouchableOpacity
              onPress={async () => {
                try {
                  await FriendService.deleteInviteWasSend(user._id);
                  setSentRequests((prev) =>
                    prev.filter((id) => id !== user._id)
                  );

                  socket.emit(SOCKET_EVENTS.DELETED_FRIEND_INVITE, {
                    senderId: currentUser._id,
                    receiverId: user._id,
                  });

                  Alert.alert(
                    'Cancelled',
                    `Friend request to ${user.name} has been cancelled.`
                  );
                } catch (err) {
                  console.error('❌ Error cancelling friend request:', err);
                  Alert.alert('Error', 'Failed to cancel the friend request.');
                }
              }}
              style={styles.requestSent}>
              <Text style={styles.requestSentText}>Request Sent</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleAddFriend}
              style={styles.addFriendBtn}>
              <Image source={addFrIcon} style={styles.addFrIcon} />
            </TouchableOpacity>
          ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* full-screen background */}
      <Image source={require('../Images/bground.png')} style={styles.bg} />

      {/* header with search + add */}
      <View style={styles.header}>
        <Image
          source={require('../icons/searchicon.png')}
          style={styles.icon}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor="#aaa"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.fFillter}>
        <TouchableOpacity style={styles.btnFillter} onPress={()=>navigation.navigate('ListRequestFriendScreen')}>
          <Text style={styles.txtFillter}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnFillterChosen}>
          <Text style={styles.txtFillterChosen}>Address Book</Text>
        </TouchableOpacity>


      </View>
      {/* optionally, filter tabs could go here */}
      {/* <View style={styles.filterRow}>…</View> */}

      {lookupLoading ? (
        <ActivityIndicator
          size="large"
          color="#086DC0"
          style={{ marginTop: 150 }}
        />
      ) : phoneBookUsers.length === 0 ? (
        <Text style={styles.placeholderText}>
          No contacts found on the app.
        </Text>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={phoneBookUsers}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderContactItem}
        />
      )}

      {/* FOOTER */}
      <View style={styles.fFooter}>
        <TouchableOpacity style={styles.btnTags}>
          <Image
            source={require('../icons/mess.png')}
            style={styles.iconfooter}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnTags}
          onPress={() => navigation.navigate('GroupsScreen')}>
          <Image
            source={require('../icons/member.png')}
            style={styles.iconfooter}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTags}>
          <Image
            source={require('../icons/Home.png')}
            style={styles.iconfooter}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnTags}
          onPress={() => navigation.navigate('FriendList_Screen')}>
          <Image
            source={require('../icons/friend.png')}
            style={styles.iconfooter}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTags}>
          {currentUser?.avatar ? (
            <Image
              source={{ uri: currentUser.avatar }}
              style={styles.avatarFooter}
            />
          ) : (
            <Image
              source={require('../Images/avt.png')}
              style={styles.avatarFooter}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D8EDFF',
  },
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
  icon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  addBtn: {
    marginLeft: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F9DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    width: 16,
    height: 16,
  },
  list: {
    paddingTop: 130, // make room for header
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    // subtle shadow
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#086DC0',
    marginLeft: 5,
  },
  snippet: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: 150,
    fontSize: 16,
    color: '#555',
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
    width: 115,
    height: 30,
    borderRadius: 30,
    backgroundColor: '#AFDDFF',
    justifyContent: 'center',
    alignItems: 'center',
    },
  txtFillter: { fontSize: 16, fontWeight: '600', color: '#F49300' },
txtFillterChosen: { fontSize: 16, fontWeight: '600', color: '#F49300' },

  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#086DC0',
    marginLeft: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#086DC0',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalCloseButton: {
    flex: 1,
    marginRight: 5,
    padding: 10,
    backgroundColor: '#aaa',
    borderRadius: 5,
    alignItems: 'center',
  },
  modalCreateButton: {
    flex: 1,
    marginLeft: 5,
    padding: 10,
    backgroundColor: '#086DC0',
    borderRadius: 5,
    alignItems: 'center',
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 16,
    color: '#000',
  },

  modalCloseText: { color: 'white', fontWeight: 'bold' },
  modalCreateText: { color: 'white', fontWeight: 'bold' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 10,
    width: '80%',
  },
  optionsModalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  classifyModal: {
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 8,
    paddingVertical: 12,
    // push it toward the top (optional):
    paddingHorizontal: 16,
    maxHeight: '60%',
    alignSelf: 'center',
    marginTop: 80,
  },
  classifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  classifyLabel: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 6,
  },
  manageButton: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageText: {
    fontSize: 16,
    color: '#086DC0',
    fontWeight: '600',
  },
  manageModal: {
    backgroundColor: 'white',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 8,
    padding: 16,
  },
  manageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manageTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  manageActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  actionIcon: {
    width: 20,
    height: 20,
    marginLeft: 16,
  },
  addTagButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  addTagText: {
    color: '#086DC0',
    fontWeight: '600',
  },
  addTagModal: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 8,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  colorOption: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  colorOptionSelected: {
    borderColor: '#333',
    borderWidth: 2,
  },
  assignSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  confirmButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#086DC0',
    borderRadius: 4,
  },
  pickerModal: {
    backgroundColor: 'white',
    width: '90%',
    maxHeight: '70%',
    borderRadius: 8,
    padding: 16,
  },
  confirmButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#086DC0',
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 3,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    height: '60%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  friendAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  friendName: { fontSize: 16 },

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
  btnTags: {
    width: 66,
    height: 45,
    backgroundColor: 'white',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTag: {
    width: 66,
    height: 45,
    backgroundColor: '#086DC0',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconfooter: { width: 25, height: 25 },
  avatarFooter: { width: 40, height: 40, borderRadius: 100 },
  imgAG: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  fMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 65,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingHorizontal: 5,
    width: '100%',
  },
  favatarGroup: { width: 65, justifyContent: 'center' },
  fRowOne: {
    flexDirection: 'row',
    height: 25,
    justifyContent: 'space-around',
  },
  fRowTwo: {
    flexDirection: 'row',
    height: 25,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  favatarG: { width: 25, height: 25, borderRadius: 12.5 },
  phoneNumber: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
    marginLeft: 5,
  },
  fInfor: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10,
  },
  addFriendBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addFrIcon: {
    width: 18,
    height: 18,
  },
  requestSent: {
    paddingHorizontal: 10,
    paddingVertical: 5,

    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestSentText: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
  },
});
