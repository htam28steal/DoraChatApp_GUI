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
  Alert
} from 'react-native';
import axios from '../api/apiConfig';
import { socket } from "../utils/socketClient";
import { SOCKET_EVENTS } from "../utils/constant";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const Add = require('../icons/plus.png');
const userIcon = require('../Images/avt.png');

const messIcon = require('../icons/mess.png');
const memberIcon = require('../icons/member.png');
const homeIcon = require('../icons/QR.png');
const friendIcon = require('../icons/friend.png');

export default function GroupsScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [text, setText] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [userId, setUserId] = useState(null);
  const [manageModalVisible, setManageModalVisible] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);


  const [addTagModalVisible, setAddTagModalVisible] = useState(false);
  const [colors, setColors] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [assignedConversations, setAssignedConversations] = useState([]);
  // at the top of your component, alongside your other useState calls:
  const [editTagModalVisible, setEditTagModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingColorId, setEditingColorId] = useState(null);
  const [editingConversations, setEditingConversations] = useState([]);



  const [classifyModalVisible, setClassifyModalVisible] = useState(false);
  const [classifies, setClassifies] = useState([]);


  const [classifyMenuVisible, setClassifyMenuVisible] = useState(false);
  const [classifyOptionsVisible, setClassifyOptionsVisible] = useState(false);
  const [targetConversationId, setTargetConversationId] = useState(null);

  // in your component’s top-level useState calls:
  const [convPickerVisible, setConvPickerVisible] = useState(false);
  const [allConversations, setAllConversations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);

  const canCreateGroup = groupName.trim() && selectedFriendIds.length >= 2 && !creatingGroup;


  useEffect(() => {
    const handleNewMessage = (message) => {
      if (!message || !message.conversationId) return;

      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv._id === message.conversationId) {
            return {
              ...conv,
              lastMessageId: message, // Replace with the latest message
            };
          }
          return conv;
        });

        // Optional: Move the updated conversation to the top
        const updatedConv = updated.find(c => c._id === message.conversationId);
        const others = updated.filter(c => c._id !== message.conversationId);
        return [updatedConv, ...others];
      });
    };

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, handleNewMessage);

    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, handleNewMessage);

    };
  }, []);


  useEffect(() => {
    if (!query) {
      setFiltered(conversations);
    } else {
      const q = query.toLowerCase();
      setFiltered(conversations.filter(c =>
        c.members.some(m =>
          (m.name || '').toLowerCase().includes(q)
        )
      ));
    }
  }, [query, conversations]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          Alert.alert('Missing token', 'Cannot fetch profile without authentication.');
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




  const toggleFilter = useCallback(id => {
    setSelectedFilters(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  }, []);

  const filteredConversations = useMemo(() => {
    let convs = conversations;

    // Only filter by conversation name:
    if (query.trim()) {
      const q = query.toLowerCase();
      convs = convs.filter(conv => (conv.name || '').toLowerCase().includes(q));
    }

    // Only show groups (type === true)
    convs = convs.filter(c => c.type === true);

    // Tag filter (optional, if you want to keep it)
    if (selectedFilters.length > 0) {
      const allIds = selectedFilters.flatMap(tagId => {
        const tag = classifies.find(c => c._id === tagId);
        return tag?.conversationIds || [];
      });
      const uniq = [...new Set(allIds)];
      convs = convs.filter(c => uniq.includes(c._id));
    }
    return convs;
  }, [conversations, query, selectedFilters, classifies]);




  const selectedList = editTagModalVisible
    ? editingConversations
    : assignedConversations;


  const loadColors = async () => {
    try {
      const { data } = await axios.get('/api/colors');
      setColors(data);
    } catch (err) {
      console.error('❌ Failed to load colors', err);
      Alert.alert('Lỗi', 'Không thể tải danh sách màu.');
    }
  };
  // call this when the ✎ button is pressed
  const openEditTagModal = async (item) => {
    await loadColors();
    setEditingId(item._id);
    setEditingName(item.name);
    // if your classify objects actually come back with `color._id`:
    setEditingColorId(item.color?._id || item.colorId);
    setEditingConversations(item.conversationIds || []);
    setEditTagModalVisible(true);
  };

  // call this when “Cập nhật” is pressed
  const updateTag = async () => {
    if (!editingName.trim()) {
      return Alert.alert('Lỗi', 'Tên không được để trống.');
    }
    if (!editingColorId) {
      return Alert.alert('Lỗi', 'Vui lòng chọn màu.');
    }
    if (editingConversations.length === 0) {
      return Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 hội thoại.');
    }
    try {
      const body = {
        name: editingName.trim(),
        colorId: editingColorId,
        conversationIds: editingConversations,
      };
      const { data } = await axios.put(`/api/classifies/${editingId}`, body);
      const { data: latest } = await axios.get('/api/classifies');
      setClassifies(latest);

      setEditTagModalVisible(false);
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Cập nhật thất bại.');
    }
  };


  // ✂️ somewhere near createTag…
  const deleteClassify = async (id) => {
    try {
      await axios.delete(`/api/classifies/${id}`);

      // remove it from local state so UI updates immediately
      setClassifies(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      console.error('❌ Failed to delete classify:', err);
      Alert.alert('Lỗi', 'Không thể xóa thẻ phân loại.');
    }
  };


  // ✏️ createTag: validate + POST
  const createTag = async () => {
    const name = newTagName.trim();
    if (!name) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên thẻ phân loại.');
      return;
    }
    if (!selectedColorId) {
      Alert.alert('Lỗi', 'Vui lòng chọn màu cho thẻ.');
      return;
    }
    if (assignedConversations.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng gán ít nhất 1 hội thoại.');
      return;
    }
    try {
      const body = {
        name,
        colorId: selectedColorId,
        conversationIds: assignedConversations,
      };
      const { data } = await axios.post('/api/classifies', body);




      const { data: latest } = await axios.get('/api/classifies');
      setClassifies(latest);

      // Reset form state
      setNewTagName('');
      setSelectedColorId(null);
      setAssignedConversations([]);
      setAddTagModalVisible(false);

      // Optional: refresh classification list or append
      // setClassifies(prev => [...prev, data]);

    } catch (err) {
      console.error('❌ Failed to add classify', err);
      Alert.alert('Lỗi', 'Không thể thêm thẻ phân loại.');
    }
  };

  const openConvPicker = async () => {
    try {
      const [convRes, friendRes] = await Promise.all([
        axios.get('/api/conversations'),
        axios.get('/api/friends')

      ]);

      setAllConversations(convRes.data);
      setFriends(friendRes.data);
      setConvPickerVisible(true);
    } catch (err) {
      console.error('❌ Failed to load conversations or friends', err);
      Alert.alert('Lỗi', 'Không thể tải danh sách hội thoại.');
    }
  };
  const toggleAssignConversation = (convId) => {
    if (editTagModalVisible) {
      setEditingConversations(prev =>
        prev.includes(convId)
          ? prev.filter(id => id !== convId)
          : [...prev, convId]
      );
    } else {
      setAssignedConversations(prev =>
        prev.includes(convId)
          ? prev.filter(id => id !== convId)
          : [...prev, convId]
      );
    }
  };


  const openAddTagModal = async () => {
    try {
      const { data } = await axios.get('/api/colors');
      setColors(data);
      setAddTagModalVisible(true);
    } catch (err) {
      console.error('❌ Failed to load colors', err);
    }
  };


  const openClassifyOptions = () => {
    setClassifyMenuVisible(false);
    setClassifyOptionsVisible(true);
  };


  const openClassifyModal = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error("No auth token found");



      const res = await axios.get('/api/classifies', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });


      setClassifies(res.data);
      setClassifyModalVisible(true);
    } catch (err) {
      console.error('❌ Failed to load classifies', err);
      Alert.alert('Error', 'Could not load your classifications.');
    }
  };


  const fetchAllConversations = useCallback(async () => {

    try {
      const { data } = await axios.get('/api/conversations');

      setConversations(data);
    } catch (err) {

    }
  }, []);

  useEffect(() => {
    fetchAllConversations();
  }, [fetchAllConversations]);


  useEffect(() => {
    // 🔧 Debug: am I connected?
socket.on('connect', () => console.log('✅ socket connected'));
socket.on('disconnect', () => console.log('❌ socket disconnected'));

    // 🔧 Debug: log every incoming event
    socket.onAny((event, payload) => {
    });

    // 🔌 Subscribe to global list updates
    socket.emit(SOCKET_EVENTS.JOIN_CONVERSATIONS);


    // 🔔 NEW GROUP → prepend it
    const onNew = payload => {

      fetchAllConversations();
    };
    socket.on(SOCKET_EVENTS.NEW_GROUP_CONVERSATION, onNew);

    // 🔔 LEAVE → refetch
    const onLeave = payload => {

      fetchAllConversations();
    };
    socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, onLeave);

    // 🔔 DISBAND → remove locally
    const onDisband = ({ conversationId }) => {

      setConversations(prev =>
        prev.filter(c => normalizeId(c._id) !== normalizeId(conversationId))
      );
    };
    socket.on(SOCKET_EVENTS.CONVERSATION_DISBANDED, onDisband);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.offAny();
      socket.off(SOCKET_EVENTS.NEW_GROUP_CONVERSATION, onNew);
      socket.off(SOCKET_EVENTS.LEAVE_CONVERSATION, onLeave);
      socket.off(SOCKET_EVENTS.CONVERSATION_DISBANDED, onDisband);
    };
  }, [fetchAllConversations]);
  useEffect(() => {
    const onAvatarUpdated = ({ conversationId, avatar }) => {
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversationId
            ? { ...conv, avatar }
            : conv
        )
      );
    };

    socket.on(SOCKET_EVENTS.UPDATE_AVATAR_GROUP_CONVERSATION, onAvatarUpdated);


    return () => {
      socket.off(SOCKET_EVENTS.UPDATE_AVATAR_GROUP_CONVERSATION, onAvatarUpdated);
    };
  }, []);





  useEffect(() => {
    if (conversations.length === 0) return;

    conversations.forEach(conv => {
      socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, conv._id);

    });
  }, [conversations]);

  // after you’ve joined each room…
  useEffect(() => {
    const onNameUpdated = ({ conversationId: convId, newName, name }) => {
      // payload might come in as `name` or `newName`
      const updatedName = newName ?? name;
      setConversations(prev =>
        prev.map(c =>
          c._id === convId
            ? { ...c, name: updatedName }
            : c
        )
      );
    };

    socket.on(
      SOCKET_EVENTS.UPDATE_NAME_CONVERSATION,
      onNameUpdated
    );


    return () => {
      socket.off(
        SOCKET_EVENTS.UPDATE_NAME_CONVERSATION,
        onNameUpdated
      );
    };
  }, [socket, setConversations]);



  useEffect(() => {


    // Join conversations room (broadcast updates to the user)
    socket.emit(SOCKET_EVENTS.JOIN_CONVERSATIONS);


    const handleDisband = ({ conversationId }) => {


      if (!conversationId) {
        console.warn("⚠️ Missing conversationId in CONVERSATION_DISBANDED payload");
        return;
      }

      setConversations(prev => {
        const updated = prev.filter(c => normalizeId(c._id) !== normalizeId(conversationId));

        return updated;
      });
    };

    socket.on(SOCKET_EVENTS.CONVERSATION_DISBANDED, handleDisband);


    return () => {
      socket.off(SOCKET_EVENTS.CONVERSATION_DISBANDED, handleDisband);

    };
  }, []);



  useFocusEffect(
    useCallback(() => {

      fetchAllConversations();
    }, [fetchAllConversations])
  );





  const receiveConversation = useCallback((payload) => {
    const newConv = payload.conversation || payload;



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


    socket.emit(SOCKET_EVENTS.JOIN_USER, userId);
    socket.emit(SOCKET_EVENTS.JOIN_CONVERSATIONS);

    const onNewGroup = (newConv) => {
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
    friends.forEach(f => {
      map[normalizeId(f._id)] = f;
    });
    return map;
  }, [friends]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await axios.get('/api/conversations');
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
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Group name cannot be blank.');
      return;
    }
    if (!groupName) return;

    try {
      setCreatingGroup(true);

      const res = await axios.post('/api/conversations/groups', {
        name: trimmedName,
        members: selectedFriendIds,
        avatar: 'https://placehold.co/200x200?text=A',
      });

      const newConv = {
        _id: res.data._id,
        name: res.data.name || trimmedName,
        members: res.data.members || selectedFriendIds,
        avatar: 'https://placehold.co/200x200?text=A', // patch it here manually
      };


      // ✅ Just emit to others (and yourself)
      socket.emit(SOCKET_EVENTS.NEW_GROUP_CONVERSATION, newConv);

      // ✅ Reset modal state
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
            navigation.navigate('ChatGroupScreen', { conversationId: group._id, avatarG: group.avatar, nameG: group.name })
          }
        >
          <View style={styles.fMessage}>
            {/* AVATAR GROUP */}
            <View style={styles.favatarGroup}>
              <Image
                source={{
                  uri: group.avatar || 'https://placehold.co/200x200?text=A',
                }}
                style={styles.imgAG}
              />

            </View>

            {/* GROUP NAME & MEMBERS */}
            <View style={styles.fInfor}>
              <Text style={styles.name}>{group.name || 'New Group'}</Text>
              <Text style={styles.email} numberOfLines={1}>
                {group.lastMessageId?.content || 'No messages yet.'}
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
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Image
            source={require('../icons/plus.png')}
            style={styles.addIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.fFillter}>


        <TouchableOpacity style={styles.btnFillter} onPress={openClassifyModal}>
          <Text style={styles.txtFillter}>Classify</Text>
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
          data={filteredConversations}
          keyExtractor={(item, index) =>
            normalizeId(item._id) || index.toString()
          }
          renderItem={renderConversation}
        />
      )}

      {/* FOOTER */}
      <View style={styles.fFooter}>
        <TouchableOpacity style={styles.btnTags} onPress={() => navigation.navigate('ConversationScreen')}>
          <Image source={messIcon} style={styles.iconfooter} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTags} onPress={() => navigation.navigate('GroupsScreen')}>
          <Image source={memberIcon} style={styles.iconfooter} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTags} onPress={() => navigation.navigate('QRScreen')}>
          <Image source={homeIcon} style={styles.iconfooter} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTags} onPress={() => navigation.navigate('FriendList_Screen')}>
          <Image source={friendIcon} style={styles.iconfooter} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTags} onPress={() => navigation.navigate('ProfileScreen')} >
          {currentUser?.avatar ? (
            <Image source={{ uri: currentUser.avatar }} style={styles.avatarFooter} />
          ) : (
            <Image source={userIcon} style={styles.avatarFooter} />
          )}
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
                style={[
                  styles.modalCreateButton,
                  !canCreateGroup && { backgroundColor: '#ccc' }
                ]}
                onPress={createGroup}
                disabled={!canCreateGroup}
              >
                {creatingGroup
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text style={styles.modalCreateText}>Create Group</Text>
                }
              </TouchableOpacity>




            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={classifyMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setClassifyMenuVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.menuModalContent}>
            <TouchableOpacity onPress={openClassifyOptions} style={styles.menuItem}>
              <Text style={styles.menuText}>Classify as</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setClassifyMenuVisible(false)} style={styles.menuItem}>
              <Text style={styles.menuText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={classifyOptionsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setClassifyOptionsVisible(false)}
      >
      </Modal>
      <Modal
        visible={classifyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setClassifyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.classifyModal}>
            <Text style={styles.modalTitle}>Theo thẻ phân loại</Text>
            <FlatList
              data={classifies}
              keyExtractor={c => c._id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const isChecked = selectedFilters.includes(item._id);
                return (
                  <TouchableOpacity
                    style={styles.classifyRow}
                    onPress={() => toggleFilter(item._id)}
                  >
                    {/* simple square checkbox */}
                    <View
                      style={[
                        styles.checkbox,
                        isChecked && styles.checkboxChecked
                      ]}
                    />
                    {/* your colored dot */}
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: item.color?.code || '#ccc' }
                      ]}
                    />
                    <Text style={styles.classifyLabel}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
            />


            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => {
                setClassifyModalVisible(false);
                setManageModalVisible(true);


              }}
            >
              <Text style={styles.manageText}>Quản lý thẻ phân loại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => {
                setClassifyModalVisible(false);
              }}
            >
              <Text style={styles.manageText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={manageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setManageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.manageModal}>
            <View style={styles.manageHeader}>
              <Text style={styles.manageTitle}>Quản lý thẻ phân loại</Text>
              <TouchableOpacity onPress={() => setManageModalVisible(false)}>
                <Image source={require('../icons/Reject.png')} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={classifies}
              keyExtractor={c => c._id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <View style={styles.manageRow}>
                  <View style={[styles.colorDot, { backgroundColor: item.color?.code ?? '#ccc' }]} />
                  <Text style={styles.classifyLabel}>{item.name}</Text>
                  <View style={styles.manageActions}>
                    <TouchableOpacity onPress={() => openEditTagModal(item)}>
                      <Image source={require('../icons/edit.png')} style={styles.actionIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          'Xác nhận xóa',
                          `Bạn có chắc muốn xóa thẻ "${item.name}"?`,
                          [
                            { text: 'Hủy', style: 'cancel' },
                            { text: 'Xóa', style: 'destructive', onPress: () => deleteClassify(item._id) }
                          ]
                        )
                      }
                    >
                      <Image source={require('../icons/Trash.png')} style={styles.actionIcon} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            />
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={openAddTagModal}
            >
              <Text style={styles.addTagText}>+ Thêm thẻ phân loại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addTagModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddTagModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.addTagModal}>
            <View style={styles.manageHeader}>
              <Text style={styles.manageTitle}>Thêm thẻ phân loại</Text>
              <TouchableOpacity onPress={() => setAddTagModalVisible(false)}>
                <Image source={require('../icons/Reject.png')} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Tên thẻ phân loại <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên thẻ"
              value={newTagName}
              onChangeText={setNewTagName}
            />

            <Text style={styles.label}>Chọn màu <Text style={{ color: 'red' }}>*</Text></Text>
            <View style={{ flexDirection: 'row', marginVertical: 8 }}>
              {colors.map(c => (
                <TouchableOpacity
                  key={c._id}
                  onPress={() => setSelectedColorId(c._id)}
                  style={[
                    styles.colorOption,
                    selectedColorId === c._id && styles.colorOptionSelected,
                    { backgroundColor: c.code }
                  ]}
                />
              ))}
            </View>

            <Text style={styles.label}>Gán hội thoại</Text>
            <View style={styles.assignSection}>
              <Text style={{ color: '#999' }}>
                {assignedConversations.length === 0
                  ? 'Chưa chọn hội thoại nào'
                  : `${assignedConversations.length} hội thoại đã chọn`}
              </Text>
              <TouchableOpacity onPress={openConvPicker}>
                <Text style={styles.addTagText}>+ Thêm hội thoại</Text>
              </TouchableOpacity>

            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddTagModalVisible(false)}
              >
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={createTag}

              >
                <Text style={{ color: 'white' }}>Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={convPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConvPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerModal}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setConvPickerVisible(false)}
      >
        <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
            <Text style={styles.manageTitle}>Chọn hội thoại</Text>
            <FlatList
              data={allConversations}
              keyExtractor={c => normalizeId(c._id)}
             renderItem={({ item }) => {
  const isSelected = selectedList.includes(item._id);

  // Determine displayName and avatarUrl
  let displayName = '';
  let avatarUrl = '';
  if (item.type) {
    // group chat
    displayName = item.name;
    avatarUrl = item.avatar;
  } else {
    // 1-1 chat: find other member
    const otherMember = item.members.find(m => m.userId !== userId);
    displayName = otherMember?.name || 'Unknown';
    avatarUrl = otherMember?.avatar;
  }
  return (
    <TouchableOpacity
      style={[styles.classifyRow, { alignItems: 'center' }]}
      onPress={() => toggleAssignConversation(item._id)}
    >
      <Image
        source={avatarUrl ? { uri: avatarUrl } : userIcon}
        style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#eee' }}
      />
      <Text style={{ flex: 1 }}>{displayName}</Text>
      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
      {isSelected ? <View style={styles.radioDot} /> : null}
    </View>

    </TouchableOpacity>
  );
}}

            />

            <TouchableOpacity
              style={[styles.confirmButton, { marginTop: 12 }]}
              onPress={() => setConvPickerVisible(false)}
            >
              <Text style={{ color: 'white' }}>Xong</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={editTagModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditTagModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.addTagModal}>
            <View style={styles.manageHeader}>
              <Text style={styles.manageTitle}>Cập nhật thẻ phân loại</Text>
              <TouchableOpacity onPress={() => setEditTagModalVisible(false)}>
                <Image source={require('../icons/Reject.png')} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Tên thẻ *</Text>
            <TextInput
              style={styles.input}
              value={editingName}
              onChangeText={setEditingName}
            />

            <Text style={styles.label}>Chọn màu *</Text>
            <View style={{ flexDirection: 'row', marginVertical: 8 }}>
              {colors.map(c => (
                <TouchableOpacity
                  key={c._id}
                  onPress={() => setEditingColorId(c._id)}
                  style={[
                    styles.colorOption,
                    editingColorId === c._id && styles.colorOptionSelected,
                    { backgroundColor: c.code }
                  ]}
                />
              ))}
            </View>

            <Text style={styles.label}>Gán hội thoại</Text>
            <View style={styles.assignSection}>
              <Text style={{ color: '#999' }}>
                {editingConversations.length === 0
                  ? 'Chưa chọn hội thoại nào'
                  : `${editingConversations.length} hội thoại đã chọn`}
              </Text>
              <TouchableOpacity onPress={openConvPicker}>
                <Text style={styles.addTagText}>Thêm hội thoại</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditTagModalVisible(false)}
              >
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={updateTag}
              >
                <Text style={{ color: 'white' }}>Cập nhật</Text>
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
    marginTop: 15
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
    paddingTop: 15
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
    width: '95%',
    height: '75%',
    paddingTop: 15
  },

  fMessage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 65,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingHorizontal: 5,
  },
  favatarGroup: { width: 55, justifyContent: 'center' },
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
  imgAG: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },


  fInfor: { flex: 1, justifyContent: 'center', paddingLeft: 10 },
  name: { fontSize: 17, fontWeight: 'bold', color: '#086dc0' },
  email: { fontSize: 14, fontWeight: '400', maxWidth: '80%' },
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
    marginBottom: 20
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
  radioCircle: {
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#086DC0',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 12,
},
radioCircleSelected: {
  borderColor: '#086DC0',
},
radioDot: {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: '#086DC0',
},
closeButton: {
  position: 'absolute',
  top: 10,
  right: 10,
  zIndex: 10,
  padding: 8,
},
closeButtonText: {
  fontSize: 22,
  color: 'red',
  fontWeight: 'bold',
},



});
