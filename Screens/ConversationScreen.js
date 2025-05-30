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
import { socket } from "../utils/socketClient";
import { SOCKET_EVENTS } from "../utils/constant";

const userIcon   = require('../Images/avt.png');
const messIcon   = require('../icons/mess.png');
const memberIcon = require('../icons/member.png');
const homeIcon   = require('../icons/QR.png');
const friendIcon = require('../icons/friend.png');

export default function ConversationScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState(null);
const messIcon   = require('../icons/mess.png');
  const [currentUser, setCurrentUser] = useState(null);

      const [manageModalVisible, setManageModalVisible] = useState(false);

    const [addTagModalVisible, setAddTagModalVisible] = useState(false);
    const [colors, setColors] = useState([]);
    const [newTagName, setNewTagName] = useState('');
    const [selectedColorId, setSelectedColorId] = useState(null);
    const [assignedConversations, setAssignedConversations] = useState([]);
   const [selectedFilters, setSelectedFilters] = useState([]);
   const [editTagModalVisible, setEditTagModalVisible] = useState(false);
   const [editingId, setEditingId] = useState(null);
   const [editingName, setEditingName] = useState('');
   const [editingColorId, setEditingColorId] = useState(null);
   const [editingConversations, setEditingConversations] = useState([]);

     const [convPickerVisible, setConvPickerVisible] = useState(false);
     const [allConversations, setAllConversations] = useState([]);
   

  
  
      const [classifyModalVisible, setClassifyModalVisible] = useState(false);
      const [classifies, setClassifies] = useState([]);
  
  
      const [classifyMenuVisible, setClassifyMenuVisible] = useState(false);
      const [classifyOptionsVisible, setClassifyOptionsVisible] = useState(false);
      const [targetConversationId, setTargetConversationId] = useState(null);
      const [friends, setFriends] = useState([]);




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
  const fetchUserInfo = async () => {
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

  };

  fetchUserInfo();
}, []);

      

      useEffect(() => {
        const handleNameUpdate = (memberUpdate) => {
          const { conversationId, userId, name } = memberUpdate;
       
      
          // Update the name in the conversation list
          setConversations(prevConvs =>
            prevConvs.map(conv => {
              if (conv._id !== conversationId) return conv;
              const updatedMembers = conv.members.map(m =>
                m.userId === userId ? { ...m, name } : m
              );
              return { ...conv, members: updatedMembers };
            })
          );
        };
      
        socket.on(SOCKET_EVENTS.UPDATE_MEMBER_NAME, handleNameUpdate);
       
      
        return () => {
          socket.off(SOCKET_EVENTS.UPDATE_MEMBER_NAME, handleNameUpdate);
         
        };
      }, []);
      

      useEffect(() => {
        (async () => {
          const token = await AsyncStorage.getItem('userToken');
        
        })();
      }, []);
      
      const friendsById = useMemo(() => {
        const map = {};
        friends.forEach(f => {
          const key = f.userId ? f.userId : f._id;
          map[key] = f;
        });
        return map;
      }, [friends]);
    
        // load conversations and userId on mount
  useEffect(() => {
    (async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId);
        const res = await axios.get('/api/conversations', { params: { userId: storedUserId } });
const onlyFalse = Array.isArray(res.data)
  ? res.data.filter(c => c.type === false)
  : []


        setConversations(onlyFalse);
        setFiltered(onlyFalse);
      } catch (e) {
        Alert.alert('Error', 'Could not load conversations.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);
      
        const toggleFilter = useCallback(id => {
          setSelectedFilters(prev =>
            prev.includes(id)
              ? prev.filter(x => x !== id)
              : [...prev, id]
          );
        }, []);
const filteredConversations = useMemo(() => {
  const base = Array.isArray(conversations) ? conversations : [];
  // apply tag filters (if any)
  let convs = selectedFilters.length > 0
    ? base.filter(c =>
        c && selectedFilters.some(tagId =>
          (classifies.find(t => t._id === tagId)?.conversationIds || []).includes(c._id)
        )
      )
    : base;
  // only keep those with type === false
  return convs.filter(c => c?.type === false);
}, [conversations, classifies, selectedFilters]);


        
          
      
        const selectedList = editTagModalVisible
        ? editingConversations
        : assignedConversations;
      
      
        const loadColors = async () => {
          try {
            const { data } = await axios.get('/api/colors');
            setColors(data);
          } catch (err) {
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
          const normalized = latest.map(c => ({
  ...c,
  _id: typeof c._id === 'object' && c._id.$oid ? c._id.$oid : String(c._id),
  conversationIds: (c.conversationIds || []).map(idObj =>
    typeof idObj === 'object' && idObj.$oid
      ? idObj.$oid
      : String(idObj)
  ),
}));
          setClassifies(normalized);
      
          setEditTagModalVisible(false);
        } catch (err) {

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
          Alert.alert('Error', 'Cannot load conversations.');
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
              const { data } = await axios.get('/api/colors');
              setColors(data);
              setAddTagModalVisible(true);
          };
          
      
          const openClassifyOptions = () => {
            setClassifyMenuVisible(false);
            setClassifyOptionsVisible(true);
          };
      
          const applyClassification = (optionKey) => {
           
            // TODO: call API to save classification
            setClassifyOptionsVisible(false);
            setTargetConversationId(null);
          };
      
          const openClassifyModal = async () => {

            try {
              const token = await AsyncStorage.getItem('userToken');


if (!token) {
  Alert.alert("Missing token", "Cannot open classify modal because userToken is missing.");
  return;
}

              if (!token) throw new Error("No auth token found");
          

          
              const res = await axios.get('/api/classifies', {
                headers: {
                  Authorization: `Bearer ${token}`,
                }
              });
          
   const data = res.data.map(c => ({
      ...c,
      _id:
        typeof c._id === 'object' && c._id.$oid
          ? c._id.$oid
          : String(c._id),
      conversationIds: (c.conversationIds || []).map(idObj =>
        typeof idObj === 'object' && idObj.$oid
          ? idObj.$oid
          : String(idObj)
      ),
    }));
          
              setClassifies(res.data);
              setClassifyModalVisible(true);
            } catch (err) {
              Alert.alert('Error', 'Could not load your classifications.');
            }
          };

  useEffect(() => {
    (async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId);
        const res = await axios.get('/api/conversations', {
          params: { userId: storedUserId },
        });
        const onlyFalse = Array.isArray(res.data)
          ? res.data.filter(c => c.type === false)
          : [];
        setConversations(onlyFalse);
        setFiltered(onlyFalse);
      } catch (e) {
        Alert.alert('Error', 'Could not load conversations.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // simple client‐side search filter
useEffect(() => {
  if (!query.trim()) {
    setFiltered(conversations);
  } else {
    const q = query.toLowerCase();
    setFiltered(
      conversations.filter(c =>
        c.members.some(m =>
          ((m.name || '').toLowerCase().includes(q)) ||
          ((m.username || '').toLowerCase().includes(q))
        )
      )
    );
  }
}, [query, conversations]);


    const renderItem = useCallback(
    ({ item: conv }) => {
      // find the “other” participant
      const other = conv.members.find(m => m.userId !== userId) || {};

      return (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ChatScreen', {
              conversation: conv,
              userId,
            })
          }
          onLongPress={() => {
            setTargetConversationId(conv._id);
            setClassifyMenuVisible(true);
          }}
        >
          <View style={styles.fMessage}>
            {/* AVATAR */}
            <View style={styles.favatarGroup}>
              <Image
                source={
                  other.avatar
                    ? { uri: other.avatar }
                    : require('../Images/avt.png')
                }
                style={styles.imgAG}
              />
            </View>

            {/* NAME & LAST MESSAGE */}
            <View style={styles.fInfor}>
              <Text style={styles.name}>
                {other.name || 'Unnamed'}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {conv.lastMessageId?.content || 'No messages yet.'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, userId]
  );
  return (
    <View style={styles.container}>
      {/* full-screen background */}
      <Image
        source={require('../Images/bground.png')}
        style={styles.bg}
      />

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

          <TouchableOpacity style={styles.btnFillter} onPress={openClassifyModal}>
    <Text style={styles.txtFillter}>Classify</Text>
   </TouchableOpacity>

        </View>
      {/* optionally, filter tabs could go here */}
      {/* <View style={styles.filterRow}>…</View> */}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#086DC0"
          style={{ marginTop: 150 }}
        />
      ) : filtered.length === 0 ? (
        <Text style={styles.placeholderText}>
          No conversations found.
        </Text>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filteredConversations.filter(c => c && c._id)}
          keyExtractor={item => item._id.toString()}
          renderItem={renderItem}
        />
      )}

        {/* FOOTER */}
<View style={styles.fFooter}>
        <TouchableOpacity style={styles.btnTags} onPress={()=>navigation.navigate('ConversationScreen')}>
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
          style={[
            styles.classifyRow,
            isChecked && { backgroundColor: '#F1F6FF' }
          ]}
          onPress={() => {
          if (isChecked) {
            setSelectedFilters([]);
          } else {
            setSelectedFilters([item._id]);
          }
          }}
        >
          <View
            style={[
              styles.checkbox,
              isChecked && styles.checkboxChecked
            ]}
          />
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
      
              <Text style={styles.label}>Tên thẻ phân loại <Text style={{color:'red'}}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên thẻ"
                value={newTagName}
                onChangeText={setNewTagName}
              />
      
              <Text style={styles.label}>Chọn màu <Text style={{color:'red'}}>*</Text></Text>
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
  keyExtractor={c => c._id}
  renderItem={({ item }) => {
    const isSelected = assignedConversations.includes(item._id);
    let displayName;
    let avatarUri = null;
    if (item.type) {
      displayName = item.name; // group
      avatarUri = item.avatar || null;
    } else {
      // single chat
      const other = Array.isArray(item.members) ? item.members.find(m => m.userId !== userId) : {};
      displayName = friendsById[other.userId]?.name || other.name || 'Unknown';
      avatarUri = other.avatar || null;
    }
    return (
      <TouchableOpacity
        style={styles.classifyRow}
        onPress={() => toggleAssignConversation(item._id)}
      >
        <Image
          source={avatarUri ? { uri: avatarUri } : require('../Images/avt.png')}
          style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D8EDFF',
  },
  bg: { position: 'absolute', width: '100%', height: '100%' },
  header: {
    marginTop:15,
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
    paddingTop: 130,      // make room for header
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
    right:10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop:15,
    zIndex:3
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
    alignSelf:'center',
    marginBottom:20
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
        alignItems:'center',
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
      
      email:{
        maxWidth:'80%'
      },
      radioCircle: {
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#086DC0',
  marginLeft: 8,
  alignItems: 'center',
  justifyContent: 'center',
},
radioDot: {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: '#086DC0',
},
radioCircleSelected: {
  borderColor: '#086DC0',
  borderWidth: 2,
},
closeButton: {
  position: 'absolute',
  right: 10,
  top: 10,
  zIndex: 10,
  padding: 8,
},
closeButtonText: {
  fontSize: 22,
  color: 'red',
  fontWeight: 'bold',
},

});
