  import React, { useState, useEffect, useCallback,useMemo } from 'react';
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

  // Classification options
  const CLASSIFICATION_OPTIONS = [
    { key: 'customer', label: 'Customer', color: '#E54E4E' },
    { key: 'family', label: 'Family', color: '#F24573' },
    { key: 'work', label: 'Work', color: '#F38B21' },
    { key: 'friends', label: 'Friends', color: '#F7CC39' },
    { key: 'reply_later', label: 'Reply Later', color: '#25B03C' },
    { key: 'study', label: 'Study', color: '#3785F5' },
  ];

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
    const [manageModalVisible, setManageModalVisible] = useState(false);

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

  const [selectedFilters, setSelectedFilters] = useState([]);


  const toggleFilter = useCallback(id => {
    setSelectedFilters(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  }, []);

  const filteredConversations = useMemo(() => {
    // start from all conversations
    let convs = conversations;
  
    // apply your existing “tag” filters
    if (selectedFilters.length > 0) {
      const allIds = selectedFilters.flatMap(tagId => {
        const tag = classifies.find(c => c._id === tagId);
        return tag?.conversationIds || [];
      });
      const uniq = [...new Set(allIds)];
      convs = convs.filter(c => uniq.includes(c._id));
    }
  
    // *** NEW: only keep those with type === true ***
    return convs.filter(c => c.type === true);
  }, [conversations, classifies, selectedFilters]);
  
    

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
    console.log('🗑️ Deleted classify:', id);
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


    console.log('✅ Added new classify:', data);

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
      const { data } = await axios.get('/api/conversations');
      setAllConversations(data);
      setConvPickerVisible(true);
    } catch (err) {
      console.error('❌ Failed to load conversations', err);
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

    const applyClassification = (optionKey) => {
      console.log(`Classifying ${targetConversationId} as ${optionKey}`);
      // TODO: call API to save classification
      setClassifyOptionsVisible(false);
      setTargetConversationId(null);
    };

    const openClassifyModal = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) throw new Error("No auth token found");
    
        console.log("📡 Fetching classifies with token:", token);
    
        const res = await axios.get('/api/classifies', {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
    
        console.log("✅ Received classifies:", res.data);
    
        setClassifies(res.data);
        setClassifyModalVisible(true);
      } catch (err) {
        console.error('❌ Failed to load classifies', err);
        Alert.alert('Error', 'Could not load your classifications.');
      }
    };
    

    const fetchAllConversations = useCallback(async () => {
      console.log('🔄 fetchAllConversations() start');
      try {
        const { data } = await axios.get('/api/conversations');
        console.log('✅ fetchAllConversations() got:', data.map(c => c._id));
        setConversations(data);
      } catch (err) {
        console.error('❌ fetchAllConversations() error:', err);
      }
    }, []);
    
    useEffect(() => {
      fetchAllConversations();
    }, [fetchAllConversations]);
    

    useEffect(() => {
      (async () => {
        const id = await AsyncStorage.getItem('userId');
        console.log('ℹ️ Loaded userId:', id);
        setUserId(id);
      })();
    }, []);
    // 3️⃣ on mount: fetch & wire up socket
    // Run once on mount
    useEffect(() => {
      console.log('🌐 Setting up socket listeners…');
      socket.emit(SOCKET_EVENTS.JOIN_CONVERSATIONS);

      const onNew        = () => { console.log('📥 SOCKET NEW_GROUP_CONVERSATION'); fetchAllConversations(); };
      const onDisband    = () => { console.log('📥 SOCKET DISBANDED_CONVERSATION');   fetchAllConversations(); };
      const onLeave      = () => { console.log('📥 SOCKET LEAVE_CONVERSATION');       fetchAllConversations(); };

      socket.on(SOCKET_EVENTS.NEW_GROUP_CONVERSATION, onNew);
      socket.on(SOCKET_EVENTS.DISBANDED_CONVERSATION, onDisband);
      socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, onLeave);

      return () => {
        socket.off(SOCKET_EVENTS.NEW_GROUP_CONVERSATION, onNew);
        socket.off(SOCKET_EVENTS.DISBANDED_CONVERSATION, onDisband);
        socket.off(SOCKET_EVENTS.LEAVE_CONVERSATION, onLeave);
      };
    }, [fetchAllConversations]);
    
    
    
    useEffect(() => {
      // 1️⃣ Debug: log connection state
      console.log("🧪 socket.connected:", socket.connected);
      socket.on("connect", () => console.log("✅ socket connected"));
      socket.on("disconnect", () => console.log("❌ socket disconnected"));
    
      // 2️⃣ Debug: catch every event
      socket.onAny((event, payload) => {
        console.log("📡 socket.onAny:", event, payload);
      });
    
      // 3️⃣ Handle disbanded-conversation
      const handleDisband = ({ conversationId }) => {
        console.log("📥 Received disbanded-conversation:", conversationId);
        setConversations(prev => {
          const updated = prev.filter(c => c._id !== conversationId);
          console.log("🧹 After filter:", updated.map(c => c._id));
          console.log(updated);
          return updated;
        });
      };
      console.log("🔌 Subscribing to DISBANDED_CONVERSATION");
      socket.on(SOCKET_EVENTS.DISBANDED_CONVERSATION, handleDisband);
    
      // 4️⃣ Join the global feed
      socket.emit(SOCKET_EVENTS.JOIN_CONVERSATIONS);
    
      return () => {
        console.log("🛑 Unsubscribing from DISBANDED_CONVERSATION");
        socket.off(SOCKET_EVENTS.DISBANDED_CONVERSATION, handleDisband);
        socket.offAny();
      };
    }, []);

    useFocusEffect(
      useCallback(() => {
        console.log('⚡️ Screen focused – re-fetching conversations');
        fetchAllConversations();
      }, [fetchAllConversations])
    );

    
    
    

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
        });
    
        const newConv = {
          _id: res.data._id,
          name: res.data.name || trimmedName,
          members: res.data.members || selectedFriendIds,
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
              navigation.navigate('ChatGroupScreen', { conversationId: group._id })
            }
            onLongPress={() => {
              setTargetConversationId(group._id);
              setClassifyMenuVisible(true);
            }}
          >
            <View style={styles.fMessage}>
              {/* AVATAR GROUP */}
              <View style={styles.favatarGroup}>
                {members.length > 0 ? (
                  <>
                    <View style={styles.fRowOne}>
                    {members.slice(0, 2).map((memberId, idx) => {
    if (!memberId) return null;
    const member = friendsById[memberId];
    return (
      <View
        style={styles.favatarG}
        key={`${group._id}-avatar-${memberId}-${idx}`}
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
          <TouchableOpacity style={styles.btnTags}>
            <Image source={require('../icons/mess.png')} style={styles.iconfooter} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnTags}>
            <Image source={require('../icons/searchicon.png')} style={styles.iconfooter} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnTags}>
            <Image source={require('../icons/Home.png')} style={styles.iconfooter} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnTag}>
            <Image source={require('../icons/calen.png')} style={styles.iconfooter} />
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
                  keyExtractor={(item, idx) =>normalizeId(item._id) || idx.toString()}
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
      (creatingGroup || !groupName.trim()) && { backgroundColor: '#ccc' }
    ]}
    onPress={createGroup}
    disabled={creatingGroup || !groupName.trim()}
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
          <View style={styles.modalContainer}>
            <View style={styles.optionsModalContent}>
              {CLASSIFICATION_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={styles.optionRow}
                  onPress={() => applyClassification(opt.key)}
                >
                  <View style={[styles.dot, { backgroundColor: opt.color }]} />
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setClassifyOptionsVisible(false)} style={[styles.menuItem, { marginTop: 10 }]}
              >
                <Text style={styles.menuText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
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
      <View style={[styles.colorDot, { backgroundColor:item.color?.code ?? '#ccc' }]} />
      <Text style={styles.classifyLabel}>{item.name}</Text>
      <View style={styles.manageActions}>
        <TouchableOpacity onPress={() => openEditTagModal(item)}>
          <Image source={require('../icons/edit.png')} style={styles.actionIcon}/>
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
          <Image source={require('../icons/Trash.png')} style={styles.actionIcon}/>
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

        <Text style={styles.label}>Tên thẻ phân loại *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập tên thẻ"
          value={newTagName}
          onChangeText={setNewTagName}
        />

        <Text style={styles.label}>Chọn màu *</Text>
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
        <Text style={styles.manageTitle}>Chọn hội thoại</Text>
        <FlatList
  data={allConversations}
  keyExtractor={c => c._id}
  renderItem={({ item }) => {
    const isSelected = selectedList.includes(item._id);
    return (
      <TouchableOpacity
        style={styles.classifyRow}
        onPress={() => toggleAssignConversation(item._id)}
      >
        <Text style={{ flex: 1 }}>{item.name}</Text>
        {isSelected && <Text>✓</Text>}
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
      
      
      
      
    });
    