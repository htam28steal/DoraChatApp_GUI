import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView,
  FlatList, Modal, ActivityIndicator, Alert,Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socket } from "../utils/socketClient";
import { SOCKET_EVENTS } from "../utils/constant";

import axios from '../api/apiConfig';
const AddMember = require('../icons/addFriend.png');

const dataGroupProfile = [
  {
    id: '1',
    avatar: require('../Images/GroupAvt.png'),
    name: 'John Nguyen',
  },
];
const dataPic = [
  { id: '1', url: require('../Images/pic1.png') },
  { id: '2', url: require('../Images/pic1.png') },
  { id: '3', url: require('../Images/pic1.png') },
  { id: '4', url: require('../Images/pic1.png') },
  { id: '5', url: require('../Images/pic1.png') },
];

export default function GroupDetail({ route, navigation }) {
  const { conversationId } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [members, setMembers] = useState([]);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);

  const [authorityModalVisible, setAuthorityModalVisible] = useState(false);
  const [selectedDeputyId, setSelectedDeputyId] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);

  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const [showAuthorityChoice, setShowAuthorityChoice] = useState(false);
const [showTransferModal, setShowTransferModal] = useState(false);
const [selectedNewAdminId, setSelectedNewAdminId] = useState(null);




  const fetchGroupMembers = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const res = await axios.get(`/api/conversations/${conversationId}/members`);
      const allMembers = res.data || [];
  
      // 🔍 Filter out the current user
      const otherMembers = allMembers.filter(member => member.userId !== userId);
  
      setGroupMembers(otherMembers);
    } catch (err) {
      console.error('Failed to fetch members', err);
    }
  };
  
  const fetchModalData = async () => {
    try {
      setLoadingFriends(true);
  
      const [membersRes, friendsRes] = await Promise.all([
        axios.get(`/api/conversations/${conversationId}/members`),
        axios.get('/api/friends'),
      ]);
  
      const fetchedMembers = membersRes.data || [];
      const allFriends = friendsRes.data || [];
  
      // ✅ Extract userId from members
      const memberUserIds = fetchedMembers.map(member => member.userId);
  
      // ✅ Only keep friends who are NOT already in the group
      const nonMembers = allFriends.filter(friend => !memberUserIds.includes(friend._id));


  
      setMembers(fetchedMembers);
      setFriends(nonMembers);
    } catch (err) {
      console.error('Error fetching modal data', err);
    } finally {
      setLoadingFriends(false);
    }
  };
  
  
  

  useEffect(() => {
    if (modalVisible) {
      fetchModalData();
    }
  }, [modalVisible]);
  
  


  const toggleFriendSelection = useCallback((friendId) => {
    setSelectedFriendIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  }, []);

  const addMembers = async () => {
    if (!selectedFriendIds.length) return;
  
    try {
      setLoadingFriends(true);
  
      // 1) Retrieve the userId string you previously set
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'Không tìm thấy userId trong bộ nhớ.');
        return;
      }
  
      // 2) For each friend, call your invite endpoint
      await Promise.all(
        selectedFriendIds.map(inviteeId =>
          axios.post(
            `/api/conversations/${conversationId}/invite`,
            { userId, inviteeId }
          )
        )
      );
  
      // 3) Close modal & reset state
      setModalVisible(false);
      setSelectedFriendIds([]);
      // TODO: refetch members if you want to update the UI
  
    } catch (err) {
      console.error('Invite error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Không thể thêm thành viên.');
    } finally {
      setLoadingFriends(false);
    }
  };
  
  const renderGroupProfile = ({ item }) => (
    <View style={{ width: '100%' }}>
      <View style={{ justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Image source={item.avatar} style={styles.avatar} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ marginRight: 5, fontWeight: 'bold', fontSize: 15 }}>{item.name}</Text>
          <TouchableOpacity>
            <Image source={require('../icons/edit.png')} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPicture = ({ item }) => (
    <Image source={item.url} style={{ marginRight: 10, marginBottom: 10 }} />
  );

  const renderFriendItem = ({ item }) => (
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
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={{ position: 'absolute', left: 10 }}
          onPress={() => navigation.goBack()}
        >
          <Image source={require('../icons/back.png')} style={{ width: 25, height: 20 }} />
        </TouchableOpacity>
        <Text style={{ color: '#086DC0', fontWeight: 'bold', fontSize: 15 }}>Details</Text>
        <View style={{ flexDirection: 'row', position: 'absolute', right: 10 }}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Image source={AddMember} style={{ width: 14, height: 14 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.pinButton}>
            <Image source={require('../icons/Pin.png')} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Existing group profile and pictures... */}
      <FlatList
        data={dataGroupProfile}
        horizontal={false}
        numColumns={2}
        renderItem={renderGroupProfile}
        keyExtractor={(item) => item.id}
      />
       <View style={{marginTop:30}}>
        <View style={styles.options}>
        <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}} >
          <View style={{width:30, height:30, alignItems:'center', backgroundColor:'#D8EDFF',
          borderRadius:15, justifyContent:'center', marginRight:10
          }}><Image source={require('../icons/Notification.png')} style={{alignSelf:'center'}} /></View>
          <Text style={{color:'#086DC0', fontSize:15}}>Mute messages</Text>
        </View>
        <TouchableOpacity 
          style={{width:40, backgroundColor:'#D8EDFF', height:20, borderRadius:10, position:'relative'}}>
          <View 
            style={{
              width: 16,
              height: 16,
              backgroundColor: '#086DC0',
              borderRadius: 10,
              position: 'absolute',
              right: 1,
              top: '50%',
              transform: [{ translateY: -8 }]  // Dịch lên trên 8 đơn vị để căn giữa
            }
          }>
          </View>
        </TouchableOpacity>
        </View>

        <View style={styles.options}>
        <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}} >
          <View style={{width:30, height:30, alignItems:'center', backgroundColor:'#D8EDFF',
          borderRadius:15, justifyContent:'center', marginRight:10
          }}><Image source={require('../icons/Photos.png')} style={{alignSelf:'center'}} /></View>
          <Text style={{color:'#086DC0', fontSize:15}}>Photos/Videos, Files, Links</Text>
        </View>
        <TouchableOpacity 
          style={{width:30, backgroundColor:'#D8EDFF', height:30, borderRadius:10, justifyContent:'center',alignItems:'center'}}>
          <Image source={require('../icons/arrow.png')} />
        </TouchableOpacity>
        </View>

    </View>
    <View style={styles.options}>
        <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}} >
          <View style={{width:30, height:30, alignItems:'center', backgroundColor:'#D8EDFF',
          borderRadius:15, justifyContent:'center', marginRight:10
          }}><Image source={require('../icons/Photos.png')} style={{alignSelf:'center'}} /></View>
          <Text style={{color:'#086DC0', fontSize:15}}>Quyền quản trị</Text>
        </View>
        <TouchableOpacity 
          style={{width:30, backgroundColor:'#D8EDFF', height:30, borderRadius:10, justifyContent:'center',alignItems:'center'}}>
          <Image source={require('../icons/arrow.png')} />
        </TouchableOpacity>
        </View>
        <View style={styles.authority}>
            <TouchableOpacity style={styles.authorityOptions}>
              <View style={styles.authorityIcon}>
                <View style={styles.authorityBorderIcon}>
                  <Image source={require('../icons/Verify.png')} />
                </View>
              </View>
              <Text style={styles.authorityText}>Phê duyệt thành viên </Text>
            </TouchableOpacity>
        </View>
                <View style={styles.authority}>
                <TouchableOpacity
  style={styles.authorityOptions}
  onPress={async () => {
    await fetchGroupMembers();       // load groupMembers
    setShowAuthorityChoice(true);
  }}
>
  <View style={styles.authorityIcon}>
    <Image source={require('../icons/Branches.png')} />
  </View>
  <Text style={styles.authorityText}>Uỷ quyền</Text>
</TouchableOpacity>

        </View>
        <View style={styles.authority}>
            <TouchableOpacity style={styles.authorityOptions}
              onPress={async () => {
                setRemoveModalVisible(true);
                await fetchGroupMembers();
              }}
            >
              <View style={styles.authorityIcon}>
                  <Image source={require('../icons/remove-user.png')} style={{width:12, height:12}} />
                </View>
              <Text style={styles.authorityText}>Mời khỏi nhóm</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.authority}>
  <TouchableOpacity
    style={styles.authorityOptions}
    onPress={async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        console.log("🚨 Attempting to disband group:", conversationId, "by user:", userId);
    
        const response = await axios.delete(
          `/api/conversations/disband/${conversationId}`,
          { data: { userId } }
        );
    
        console.log("✅ Group disbanded on server:", response.data);
    
        // Emit socket event
        socket.emit("disbanded-conversation", { conversationId });
        console.log("📤 Emitted socket event: disbanded-conversation", { conversationId });
    
        Alert.alert('Thành công', 'Nhóm đã được giải tán.');
        navigation.navigate('GroupsScreen')
      } catch (err) {
        console.error('❌ Error disbanding group:', err);
        Alert.alert(
          'Lỗi',
          err.response?.data?.message || 'Không thể giải tán nhóm.'
        );
      }
    }}
  >
    <View style={styles.authorityIcon}>
      <View style={styles.authorityBorderIcon}>
        <Image source={require('../icons/Disband.png')} />
      </View>
    </View>
    <Text style={styles.authorityText}>Giải tán nhóm</Text>
  </TouchableOpacity>
</View>


      <FlatList
        data={dataPic}
        horizontal={false}
        numColumns={3}
        renderItem={renderPicture}
        keyExtractor={(item) => item.id}
      />

      <View style={{flexDirection:'row',bottom:20, position:'absolute', alignItems:'center', width:'100%', justifyContent:'center' }}>
      <TouchableOpacity>
        <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}} >
          <View style={{width:30, height:30, alignItems:'center', backgroundColor:'#D8EDFF',
          borderRadius:15, justifyContent:'center', marginRight:10
          }}>
            <Image source={require('../icons/Trash.png')} style={{alignSelf:'center'}} />
          </View>
          <Text style={{color:'#086DC0', fontSize:15}}>Delete chat history</Text>
        </View>
      </TouchableOpacity>

      <Text style={{marginLeft:10, fontSize:15, color:'#BDE1FE',marginRight:10}}>|</Text>
      
<TouchableOpacity
  onPress={async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      await axios.delete(
        `/api/conversations/members/leave/${conversationId}`,
        { data: { userId } }
      );
      socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, {
        conversationId,
        userId
      });
      console.log("📤 Emitted leave‑conversation:", { conversationId, userId });

      Alert.alert('Thành công', 'Bạn đã rời nhóm.');
      navigation.navigate('GroupsScreen')
    } catch (err) {
      console.error('Error leaving group:', err);
      Alert.alert(
        'Lỗi',
        err.response?.data?.message || 'Không thể rời nhóm.'
      );
    }
  }}
>
  <View style={{ flexDirection:'row', justifyContent:'center', alignItems:'center' }}>
    <View style={{width:30, height:30, alignItems:'center', backgroundColor:'#D8EDFF',
          borderRadius:15, justifyContent:'center', marginRight:10
          }}>
    <Image source={require('../icons/Leave.png')} style={{alignSelf:'center'}} />
    </View>

    <Text style={{ color:'#086DC0', fontSize:15}}>Leave group</Text>
  </View>

</TouchableOpacity>


    </View>

      {/* Add Member Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Friends</Text>
            {loadingFriends ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : friends.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#555' }}>
                You have no friends to add.
              </Text>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(item) => item._id}
                renderItem={renderFriendItem}
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalCreateButton,
                  !selectedFriendIds.length && { backgroundColor: '#ccc' },
                ]}
                onPress={addMembers}
                disabled={!selectedFriendIds.length || loadingFriends}
              >
                <Text style={styles.modalCreateText}>Add Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
  visible={removeModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setRemoveModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Remove Member</Text>
      {groupMembers.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#555' }}>
          No members in this group.
        </Text>
      ) : (
        <FlatList
          data={groupMembers}
          keyExtractor={item => item.memberId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.friendItem,
                selectedMemberId === item.memberId && { backgroundColor: '#E6F0FF' },
              ]}
              onPress={() => setSelectedMemberId(item.memberId)}
            >
              <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
              <Text style={styles.friendName}>{item.name}</Text>
              <View style={styles.radioCircle}>
                {selectedMemberId === item.memberId && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      <View style={styles.modalActions}>
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={() => {
            setSelectedMemberId(null);
            setRemoveModalVisible(false);
          }}
        >
          <Text style={styles.modalCloseText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modalCreateButton,
            !selectedMemberId && { backgroundColor: '#ccc' },
          ]}
          disabled={!selectedMemberId}
          onPress={async () => {
            try {
              const userId = await AsyncStorage.getItem('userId');
              await axios.delete(
                `/api/conversations/${conversationId}/members/${selectedMemberId}`,{ data: { userId } });
              await fetchGroupMembers();
              fetchModalData();
              setSelectedMemberId(null);
              setRemoveModalVisible(false);
            } catch (err) {
              console.error('Error removing member:', err);
              Alert.alert('Error', 'Could not remove member.');
            }
          }}
        >
          <Text style={styles.modalCreateText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>  
<Modal
  visible={showAuthorityChoice}
  transparent
  animationType="slide"
  onRequestClose={() => setShowAuthorityChoice(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Uỷ quyền</Text>

      {/* Phó nhóm */}
      <TouchableOpacity
        style={styles.modalCreateButton}
        onPress={() => {
          setShowAuthorityChoice(false);
          setSelectedDeputyId(null);
          setAuthorityModalVisible(true);
        }}
      >
        <Text style={styles.modalCreateText}>Phó nhóm</Text>
      </TouchableOpacity>

      {/* Trưởng nhóm */}
      <TouchableOpacity
        style={[styles.modalCreateButton, { marginTop: 10 }]}
        onPress={() => {
          setShowAuthorityChoice(false);
          setSelectedNewAdminId(null);
          setShowTransferModal(true);
        }}
>
  <Text style={styles.modalCreateText}>Trưởng nhóm</Text>
</TouchableOpacity>


      {/* Cancel */}
      <TouchableOpacity
        style={[styles.modalCloseButton, { marginTop: 20 }]}
        onPress={() => setShowAuthorityChoice(false)}
      >
        <Text style={styles.modalCloseText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

<Modal
  visible={authorityModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setAuthorityModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Uỷ quyền</Text>

      {/* List current members to select one */}
      <FlatList
        data={groupMembers}
        keyExtractor={item => item.memberId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.friendItem,
              selectedDeputyId === item.memberId && { backgroundColor: '#E6F0FF' }
            ]}
            onPress={() => setSelectedDeputyId(item.memberId)}
          >
            <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
            <Text style={styles.friendName}>{item.name}</Text>
            <View style={styles.radioCircle}>
              {selectedDeputyId === item.memberId && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* “Thêm phó nhóm” */}
      <TouchableOpacity
        style={[styles.modalCreateButton, !selectedDeputyId && { backgroundColor: '#ccc' }]}
        disabled={!selectedDeputyId}
        onPress={async () => {
          try {
            const userId = await AsyncStorage.getItem('userId');
            await axios.post(
              `/api/conversations/${conversationId}/managers`,
              {
                userid: userId,
                memberIds: [selectedDeputyId]
              }
            );
            Alert.alert('Thành công', 'Đã thêm phó nhóm.');
            setAuthorityModalVisible(false);
          } catch (err) {
            console.error('Add deputy error:', err);
            Alert.alert('Lỗi', err.response?.data?.message || 'Không thể thêm phó nhóm.');
          }
        }}
      >
        <Text style={styles.modalCreateText}>Thêm phó nhóm</Text>
      </TouchableOpacity>

      {/* “Xoá phó nhóm” (hook up your delete endpoint here) */}
      <TouchableOpacity
  style={[styles.modalCreateButton, { marginTop: 10 }, !selectedDeputyId && { backgroundColor: '#ccc' }]}
  disabled={!selectedDeputyId}
  onPress={async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      await axios.delete(
        `/api/conversations/${conversationId}/managers`,
        {
          data: {
            userId: userId,
            managerId: selectedDeputyId
          }
        }
      );
      Alert.alert('Thành công', 'Đã xóa phó nhóm.');
      setAuthorityModalVisible(false);
      // nếu cần: làm mới danh sách groupMembers / managers ở đây
      await fetchGroupMembers();
    } catch (err) {
      console.error('Remove deputy error:', err);
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể xóa phó nhóm.');
    }
  }}
>
  <Text style={styles.modalCreateText}>Xoá phó nhóm</Text>
</TouchableOpacity>

      {/* Cancel */}
      <TouchableOpacity
        style={[styles.modalCloseButton, { marginTop: 20 }]}
        onPress={() => setAuthorityModalVisible(false)}
      >
        <Text style={styles.modalCloseText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
<Modal
  visible={showTransferModal}
  transparent
  animationType="slide"
  onRequestClose={() => setShowTransferModal(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Chuyển quyền quản trị</Text>

      <FlatList
        data={groupMembers}
        keyExtractor={item => item.memberId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.friendItem,
              selectedNewAdminId === item.memberId && { backgroundColor: '#E6F0FF' }
            ]}
            onPress={() => setSelectedNewAdminId(item.memberId)}
          >
            <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
            <Text style={styles.friendName}>{item.name}</Text>
            <View style={styles.radioCircle}>
              {selectedNewAdminId === item.memberId && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.modalCreateButton, !selectedNewAdminId && { backgroundColor: '#ccc' }]}
        disabled={!selectedNewAdminId}
        onPress={async () => {
          try {
            await axios.patch(
              `/api/conversations/transfer-admin/${conversationId}`,
              { newAdminId: selectedNewAdminId }
            );
            Alert.alert('Thành công', 'Đã chuyển quyền quản trị.');
            setShowTransferModal(false);
          } catch (err) {
            console.error('Transfer admin error:', err);
            Alert.alert('Lỗi', err.response?.data?.message || 'Không thể chuyển quyền.');
          }
        }}
      >
        <Text style={styles.modalCreateText}>Chuyển quyền</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modalCloseButton, { marginTop: 20 }]}
        onPress={() => setShowTransferModal(false)}
      >
        <Text style={styles.modalCloseText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    justifyContent: 'center',
    flexDirection: 'row',
    paddingBottom: 10,
    backgroundColor: '#fff',
    marginTop:35
  },
  avatar: { height: 120, width: 120, marginTop: 20, marginBottom: 10 },
  addButton: {
    backgroundColor: '#D8EDFF',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    marginRight: 5,
  },
  options:{
    width:'90%',
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    paddingLeft:20,
    marginBottom:15
  },
  authority:{
    marginLeft:50,
    marginBottom:5
  },
  authorityOptions:{
    flexDirection:'row'
  },
  authorityIcon:{
   backgroundColor:'#FFF6E9',
   width:20,
   height:20,
   justifyContent:'center',
   borderRadius:10,
   marginRight:5,
   alignItems:'center'
  },
  authorityBorderIcon:{
    width:12,
    height:12,
    justifyContent:'center',
    alignItems:'center',
    alignSelf:'center',
    borderWidth:1,
    borderRadius:6,
    borderColor:'#F49300'
  },
  authorityText:{
    color:'#F49300'
  },
  pinButton: {
    backgroundColor: '#086DC0',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
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
  modalCloseText: { color: 'white', fontWeight: 'bold' },
  modalCreateText: { color: 'white', fontWeight: 'bold' },
});
