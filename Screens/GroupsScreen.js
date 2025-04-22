import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import axios from '../api/apiConfig';
import { socket } from "../utils/socketClient";
import { SOCKET_EVENTS } from "../utils/constant";
import AsyncStorage from '@react-native-async-storage/async-storage';

const Add = require('../icons/plus.png');

export default function GroupsScreen({ navigation }) {
  const [text, setText] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [userId, setUserId] = useState(null);

  const receiveConversation = useCallback((payload) => {
    const newConv = payload.conversation || payload;

    console.log("📥 Processed NEW_GROUP_CONVERSATION:", newConv);

    if (!newConv._id) return;

    setConversations(prev => {
      const exists = prev.find(c => c._id === newConv._id);
      if (exists) {
        return prev.map(c => c._id === newConv._id ? newConv : c);
      }
      return [newConv, ...prev];
    });
  }, []);


  // 2) Load userId once on mount
  useEffect(() => {
    (async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          console.log("✅ Loaded userId from AsyncStorage:", id);
          setUserId(id);
        } else {
          console.log("⚠️ No userId found in AsyncStorage");
        }
      } catch (e) {
        console.error('❌ Failed to load userId from storage', e);
      }
    })();
  }, []);


  useEffect(() => {
    if (!userId) return;

    console.log("✅ Emitting JOIN_USER and JOIN_CONVERSATIONS", userId);

    socket.emit(SOCKET_EVENTS.JOIN_USER, userId);
    socket.emit(SOCKET_EVENTS.JOIN_CONVERSATIONS);

    const onNewGroup = (newConv) => {
      console.log("📥 Received NEW_GROUP_CONVERSATION via socket:", newConv);
      receiveConversation(newConv);
    };

    socket.on(SOCKET_EVENTS.NEW_GROUP_CONVERSATION, onNewGroup);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_GROUP_CONVERSATION, onNewGroup);
    };
  }, [userId, receiveConversation]);

  // 4) initial fetch of existing conversations
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/conversations');
        setConversations(res.data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);


  function normalizeId(id) {
    if (typeof id === 'object' && id !== null && '$oid' in id) {
      return id.$oid;
    }
    return String(id);
  }



  const friendsById = useMemo(() => {
    const map = {};
    friends.forEach(user => (map[user._id] = user));
    return map;
  }, [friends]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await axios.get('/api/conversations');
        console.log(res.data);
        setConversations(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchConversations();

  }, []);

  useEffect(() => {
    if (modalVisible) fetchFriends();
  }, [modalVisible]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/friends');
      setFriends(res.data || []);
    } catch (err) {
      console.error('Failed to fetch friends', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const createGroup = async () => {
    if (!selectedFriendIds.length || !groupName) return;

    try {
      setCreatingGroup(true);

      // hit your API
      const res = await axios.post('/api/conversations/groups', {
        name: groupName,
        members: selectedFriendIds,
      });

      // build a new convo object that definitely has a name
      const newConv = {
        _id: res.data._id,
        name: res.data.name || groupName,
        members: res.data.members || selectedFriendIds,
        // …spread in any other fields your UI needs…
      };

      // prepend it
      setConversations(prev => [newConv, ...prev]);

      // notify everyone else (and yourself on other devices)
      socket.emit(SOCKET_EVENTS.NEW_GROUP_CONVERSATION, newConv);

      // reset
      setSelectedFriendIds([]);
      setGroupName('');
      setModalVisible(false);
    } catch (err) {
      console.error('Failed to create group:', err);
      Alert.alert('Error', 'Could not create group');
    } finally {
      setCreatingGroup(false);
    }
  };


  const renderConversation = useCallback(
    ({ item: group }) => {
      // Ensure members is always an array
      const members = Array.isArray(group.members) ? group.members : [];

      return (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ChatGroup', { conversationId: group._id })
          }
        >
          <View style={styles.fMessage}>
            {/* AVATAR GROUP */}
            <View style={styles.favatarGroup}>
              {members.length > 0 ? (
                <>
                  <View style={styles.fRowOne}>
                    {members.slice(0, 2).map((memberId, idx) => {
                      const member = friendsById[memberId];
                      return (
                        <View
                          style={styles.favatarG}
                          key={`${group._id}-avatar-${memberId || 'unknown'}-${idx}`}

                        >
                          {member?.avatar ? (
                            <Image source={{ uri: member.avatar }} style={styles.imgAG} />
                          ) : (
                            <View style={[styles.favatarG, { backgroundColor: '#ccc' }]} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.fRowTwo}>
                    {members[2] && (
                      <View
                        style={styles.favatarG}
                        key={`${group._id}-avatar-${members[2] || 'unknown'}`}

                      >
                        {friendsById[members[2]]?.avatar ? (
                          <Image
                            source={{ uri: friendsById[members[2]].avatar }}
                            style={styles.imgAG}
                          />
                        ) : (
                          <View style={[styles.favatarG, { backgroundColor: '#ccc' }]} />
                        )}
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <View style={styles.favatarG} />
              )}
            </View>

            {/* GROUP NAME & MEMBERS */}
            <View style={styles.fInfor}>
              <Text style={styles.name}>{group.name || 'New Group'}</Text>
              <Text style={styles.email}>
                {members.map(id => friendsById[id]?.name || 'Unknown').join(', ')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, friendsById]
  );


  const keyExtractor = useCallback((item, index) =>
    normalizeId(item._id) || index.toString()
    , []);

  return (
    <View style={styles.container}>
      <Image source={require('../Images/bground.png')} style={styles.bg} />

      <View style={styles.fcontent}>
        <View style={styles.fcontrol}>
          <Image
            source={require('../icons/searchicon.png')}
            style={styles.icons}
          />
          <View style={styles.fTxtSearch}>
            <TextInput
              style={styles.txtSearch}
              placeholder="Search"
              placeholderTextColor="#aaa"
              onChangeText={setText}
              value={text}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.btnAdd} onPress={() => setModalVisible(true)}>
          <Image source={Add} style={styles.iconAdd} />
        </TouchableOpacity>
      </View>

      <View style={styles.fFillter}>
        <TouchableOpacity style={styles.btnFillter}>
          <Text style={styles.txtFillter}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnFillter}>
          <Text style={styles.txtFillter}>Unread</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnFillter}>
          <Text style={styles.txtFillter}>Favourite</Text>
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 120, color: '#555' }}>
          No groups available.
        </Text>
      ) : (
        <FlatList
          style={styles.fListFriend}
          contentContainerStyle={{ paddingVertical: 5 }}
          data={conversations}
          keyExtractor={(item, index) =>
            normalizeId(item._id) || index.toString()
          }
          renderItem={renderConversation}
        />
      )}

      {/* FOOTER */}
      <View style={styles.fFooter}>
        <TouchableOpacity style={styles.btnTags}>
          <Image source={require('../icons/mess.png')} style={styles.iconfooter} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTags}>
          <Image source={require('../icons/searchicon.png')} style={styles.iconfooter} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTags}>
          <Image source={require('../icons/Home.png')} style={styles.iconfooter} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTag} onPress={() => { navigation.navigate("FriendList_Screen") }}>
          <Image source={require('../icons/calen.png')} style={styles.iconfooter} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.avatarFooter}>
          <Image source={require('../Images/nike.png')} style={styles.imgAva} />
        </TouchableOpacity>
      </View>

      {/* MODAL TẠO NHÓM */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.groupNameInput}
              placeholder="Group name"
              placeholderTextColor="#888"
              value={groupName}
              onChangeText={setGroupName}
            />
            <Text style={styles.modalTitle}>Friend List</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : friends.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#555' }}>You have no friends to create a group with.</Text>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(item, idx) => normalizeId(item._id) || idx.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.friendItem,
                      selectedFriendIds.includes(item._id) && { backgroundColor: '#E6F0FF' },
                    ]}
                    onPress={() => toggleFriendSelection(item._id)}
                  >
                    <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
                    <Text style={styles.friendName}>{item.name}</Text>
                    <View style={styles.radioCircle}>
                      {selectedFriendIds.includes(item._id) && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateButton, (!groupName || creatingGroup) && { backgroundColor: '#ccc' }]}
                onPress={createGroup}
                disabled={!groupName || creatingGroup}
              >
                {creatingGroup ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalCreateText}>Create Group</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// styles giữ nguyên như bạn cung cấp trước đó
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bg: { position: 'absolute', width: '100%', height: '100%' },

  fcontent: {
    position: 'absolute',
    top: 10,
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 5,
    justifyContent: 'space-between',
  },
  fcontrol: {
    flexDirection: 'row',
    width: 340,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 30,
    alignItems: 'center',
  },
  icons: { width: 18, height: 18, marginHorizontal: 10 },
  fTxtSearch: { flex: 1 },
  txtSearch: { height: 50 },
  btnAdd: {
    width: 40,
    height: 40,
    backgroundColor: '#4F9DDD',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconAdd: { width: 16, height: 16 },

  fFillter: {
    position: 'absolute',
    top: 70,
    left: 10,
    width: '70%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnFillter: {
    width: 85,
    height: 30,
    borderRadius: 30,
    backgroundColor: '#FFEED4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txtFillter: { fontSize: 16, fontWeight: '600', color: '#F49300' },

  fListFriend: {
    position: 'absolute',
    top: 110,
    width: '100%',
    height: '75%',
  },

  fMessage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 65,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingHorizontal: 5,
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
  imgAG: { width: '100%', height: '100%', borderRadius: 100 },

  fInfor: { flex: 1, justifyContent: 'center', paddingLeft: 10 },
  name: { fontSize: 16, fontWeight: 'bold' },
  email: { fontSize: 13, fontWeight: '400' },
  fbtn: { position: 'absolute', right: 0, top: 5, width: 13, height: 30 },
  btnDetail: { width: 13, height: '100%' },

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

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { width: '80%', height: '60%', backgroundColor: 'white', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  friendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  friendAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  friendName: { fontSize: 16 },
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
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#086DC0' },

  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
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
});
