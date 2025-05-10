import React, { useState, useEffect, useCallback,useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView,
  FlatList, Modal, ActivityIndicator, Alert,TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socket } from "../utils/socketClient";
import { SOCKET_EVENTS } from "../utils/constant";

import axios from '../api/apiConfig';
const AddMember = require('../icons/addFriend.png');
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Camera from 'expo-camera';




export default function GroupDetail({ route, navigation }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isJoinApproval, setIsJoinApproval] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');


  const { conversationId } = route.params;
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [groupAvatar, setGroupAvatar] = useState(null);


  const [modalVisible, setModalVisible] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [members, setMembers] = useState([]);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);

  const [authorityModalVisible, setAuthorityModalVisible] = useState(false);
  const [selectedDeputyId, setSelectedDeputyId] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showAdministrationOptions, setShowAdministrationOptions] = useState(false);

  const [currentUserRole, setCurrentUserRole] = useState(null);


  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const [showAuthorityChoice, setShowAuthorityChoice] = useState(false);
const [showTransferModal, setShowTransferModal] = useState(false);
const [selectedNewAdminId, setSelectedNewAdminId] = useState(null);

const [membersModalVisible, setMembersModalVisible] = useState(false);
const [memberSearchText, setMemberSearchText] = useState('');



const handleAvatarChange = async (conversationId, option = 'gallery') => {
  try {
    let result;

    if (option === 'gallery') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Media library permission is needed.');
        return;
      }

      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,  // ✅ needed to get base64 string
        allowsEditing: false,
        quality: 1,
      });
    } else {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is needed.');
        return;
      }

      result = await ImagePicker.launchCameraAsync({
        base64: true,  // ✅ for converting image to base64
        allowsEditing: false,
        quality: 1,
      });
    }

    if (result.canceled) return;

    const base64 = result.assets[0].base64;
    const imageUri = `data:image/jpeg;base64,${base64}`;

    await axios.patch(`/api/conversations/${conversationId}/avatar`, {
      avatar: imageUri
    });

    Alert.alert('Success', 'Group avatar updated!');
  } catch (err) {
    console.error('Error updating avatar:', err);
    Alert.alert('Error', 'Failed to update group avatar.');
  }
};

const filteredGroupMembers = useMemo(() => {
  const q = memberSearchText.toLowerCase();
  return groupMembers.filter(m =>
    m.name.toLowerCase().includes(q)
  );
}, [groupMembers, memberSearchText]);

useEffect(() => {
  // ask the server to put us in the right room
  socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId });
}, [conversationId]);

useEffect(() => {
  const onMemberRemoved = ({ conversationId: convId, userId: removedUserId }) => {
    if (convId !== conversationId) return;
    console.log("📥 Received LEAVE_CONVERSATION:", removedUserId);
    setGroupMembers(prev =>
      prev.filter(m => m.userId !== removedUserId)
    );
  };

  socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, onMemberRemoved);
  console.log("✅ Subscribed to LEAVE_CONVERSATION");

  return () => {
    socket.off(SOCKET_EVENTS.LEAVE_CONVERSATION, onMemberRemoved);
  };
}, [conversationId]);

useEffect(() => {
  const onNameUpdated = ({ conversationId: convId, newName, name }) => {
    if (convId !== conversationId) return;
    // newName if present, otherwise fallback to name
    setGroupName(newName ?? name);
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
}, [conversationId]);



useEffect(() => {
  ;(async () => {
    try {
      const res = await axios.get(`/api/conversations/${conversationId}`);
      const convo = res.data;
      setIsJoinApproval(!!convo.isJoinFromLink);
      setGroupName(convo.name || '');
      setGroupAvatar(convo.avatar || 'https://placehold.co/120x120?text=Group');
    } catch (err) {
      console.error("Couldn't load conversation details:", err);
    }
  })();
}, [conversationId]);


  // whenever `showJoinRequestsModal` flips to true, fetch
// 1) In your useEffect that loads the join‐requests:
useEffect(() => {
  if (!showJoinRequestsModal) return;
  (async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      console.log('🔹 Fetching join requests for user:', userId);
      const res = await axios.get(
        `/api/conversations/${conversationId}/groupRequest`,
        { params: { userId } }
      );
      console.log('🔹 Raw joinRequests payload:', JSON.stringify(res.data, null, 2));
      setJoinRequests(res.data || []);
    } catch (err) {
      console.error("❌ Failed loading join requests:", err);
      Alert.alert("Error", "Could not load join requests");
    }
  })();
}, [showJoinRequestsModal, conversationId]);



const handleAccept = async (requestingUserId) => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    console.log('🔹 handleAccept → requestingUserId:', requestingUserId);
    console.log('🔹 handleAccept → body userId:', userId);

    const url = `/api/conversations/${conversationId}/groupRequest/accept/${requestingUserId}`;
    console.log('🔹 handleAccept → POST to:', url);

    await axios.post(url, { userId });
    setJoinRequests(js => js.filter(r => (r.userId ?? r._id) !== requestingUserId));
    console.log('✅ Accepted request for', requestingUserId);
  } catch (err) {
    console.error('❌ Accept failed:', err.response?.data || err.message);
    Alert.alert('Error', err.response?.data?.message || 'Could not accept request.');
  }
};

  
  
const handleReject = async (requestId) => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    console.log('🔹 handleReject → requestId:', requestId);
    console.log('🔹 handleReject → body userId:', userId);

    const url = `/api/conversations/${conversationId}/groupRequest/reject/${requestId}`;
    console.log('🔹 handleReject → DElETE to:', url);

    await axios.delete(url, { userId });
    // remove from local list by _id, not userId
    setJoinRequests(js => js.filter(r => r._id !== requestId));
    console.log('✅ Rejected request', requestId);
  } catch (err) {
    console.error('❌ Reject failed:', err.response?.data || err.message);
    Alert.alert('Error', err.response?.data?.message || 'Could not reject request.');
  }
};

  

const toggleJoinApproval = async () => {
  const newValue = !isJoinApproval;
  try {
    await axios.patch(
      `/api/conversations/${conversationId}/acceptGroupRequest/${newValue}`
    );
    setIsJoinApproval(newValue);
  } catch (err) {
    console.error('❌ Error toggling joinApproval:', err);
    Alert.alert('Error', 'Could not update join approval setting.');
  }
};

const handleSaveName = async () => {
  const trimmed = tempName.trim();
  if (!trimmed) {
    Alert.alert('Error', 'Name cannot be blank.');
    return;
  }
  await axios.patch(
    `/api/conversations/${conversationId}/name`,
    { name: trimmed }
  );
  setGroupName(trimmed);
  socket.emit(
    SOCKET_EVENTS.UPDATE_NAME_CONVERSATION,
    { conversationId, newName: trimmed }
  );
  setIsEditingName(false);
};
const fetchGroupCurrentMembers = async () => {
  try {
    const res = await axios.get(`/api/conversations/${conversationId}/members`);
    // assume res.data is an array of { _id, userId, name, avatar, … }
    setGroupMembers(res.data || []);
  } catch (err) {
    console.error('Failed to fetch members', err);
  }
};



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
  useEffect(() => {
    const loadMyRole = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;
  
        // 1) Fetch both the conversation *and* its members
        const [convRes, memRes] = await Promise.all([
          axios.get(`/api/conversations/${conversationId}`),
          axios.get(`/api/conversations/${conversationId}/members`)
        ]);
  
        // support either res.data.conversation or just res.data
        const convo = convRes.data.conversation || convRes.data;
        setGroupName(convo.name);

        const members = memRes.data || [];
  
        // 2) Unwrap Mongo’s {$oid: "..."} if present
        let leaderId = convo.leaderId;
        if (leaderId && typeof leaderId === 'object' && leaderId.$oid) {
          leaderId = leaderId.$oid;
        }
  
        const managerIds = Array.isArray(convo.managerIds)
          ? convo.managerIds.map(m => (m && m.$oid) ? m.$oid : m)
          : [];
  
        // 3) Find *your* membership record and grab its memberId
        const myRecord = members.find(m => m.userId === userId);
        const myMemberId = myRecord
          ? (myRecord.memberId || myRecord._id || myRecord.id)
          : null;
  
        console.log('→ meMemberId:', myMemberId,
                    ' leaderId:', leaderId,
                    ' managers:', managerIds);
  
        // 4) Compare *membership* IDs
        if (myMemberId && myMemberId === leaderId) {
          setCurrentUserRole('leader');
        }
        else if (myMemberId && managerIds.includes(myMemberId)) {
          setCurrentUserRole('manager');
        }
        else {
          setCurrentUserRole('member');
        }
      } catch (err) {
        console.error('Could not load conversation or role', err);
      }
    };
  
    loadMyRole();
  }, [conversationId]);
  
  
  
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
      <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <TouchableOpacity
  onPress={() => {
    Alert.alert('Change Avatar', 'Choose option', [
      { text: 'Gallery', onPress: () => handleAvatarChange(conversationId, 'gallery') },
      { text: 'Camera', onPress: () => handleAvatarChange(conversationId, 'camera') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  }}
>
  <Image source={{ uri: groupAvatar }} style={{ width: 100, height: 100, borderRadius: 50 }} />
</TouchableOpacity>


  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    {isEditingName
      ? (
        <TextInput
          value={tempName}
          onChangeText={setTempName}
          style={{
            borderBottomWidth: 1,
            borderColor: '#086DC0',
            fontSize: 18,
            fontWeight: 'bold',
            color: '#086DC0',
            marginRight: 8,
            minWidth: 120,
          }}
          autoFocus
        />
      )
      : (
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#086DC0',
            marginRight: 8,
          }}
        >
          {groupName}
        </Text>
      )
    }

    {/* only leaders & managers get the button */}
    {(currentUserRole === 'leader' || currentUserRole === 'manager') && (
      <TouchableOpacity
        onPress={() => {
          if (isEditingName) {
            handleSaveName();
          } else {
            setTempName(groupName);
            setIsEditingName(true);
          }
        }}
      >
        <Image
          source={
            isEditingName
              ? require('../icons/check.png')
              : require('../assets/Edit.png')
          }
          style={{ width: 20, height: 20 }}
        />
      </TouchableOpacity>
    )}
  </View>
</View>



       <View style={{marginTop:30}}>
        
       <TouchableOpacity
  style={styles.options}
  onPress={async () => {
    // 1) load the latest members
    await fetchGroupCurrentMembers();
    // 2) clear any previous search
    setMemberSearchText('');
    // 3) show the modal
    setMembersModalVisible(true);
  }}
>
  <View style={styles.optionsLeft}>
    <View style={styles.iconCircle}>
      <Image source={require('../icons/member.png')} style={{ height: 18, width: 18 }} />
    </View>
    <Text style={styles.optionsText}>Members</Text>
  </View>
  <View         
  style={{
    width: 30,
    height: 30,
    backgroundColor: '#D8EDFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }}>
  <Image source={require('../icons/arrow.png')} style={{ width: 12, height: 12 }} />
  </View>
</TouchableOpacity>
    
       <View style={styles.options}>
        <View style={styles.optionsLeft}>
          <View style={styles.iconCircle}>
            <Image
              source={require('../icons/Notification.png')}
              style={styles.icon}
            />
          </View>
          <Text style={styles.optionsText}>Mute messages</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.toggleTrack,
            isMuted && styles.toggleTrackActive
          ]}
          onPress={() => setIsMuted(m => !m)}
        >
          <View
            style={[
              styles.toggleThumb,
              isMuted ? styles.thumbRight : styles.thumbLeft
            ]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.options}>
        <View style={styles.optionsLeft}>
          <View style={styles.iconCircle}>
            <Image
              source={require('../icons/Notification.png')}
              style={styles.icon}
            />
          </View>
          <Text style={styles.optionsText}>Join approval</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.toggleTrack,
            isJoinApproval && styles.toggleTrackActive
          ]}
          onPress={toggleJoinApproval}
        >
          <View
            style={[
              styles.toggleThumb,
              isJoinApproval ? styles.thumbRight : styles.thumbLeft
            ]}
          />
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
  style={{
    width: 30,
    height: 30,
    backgroundColor: '#D8EDFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }}
  onPress={() => navigation.navigate('MediaScreen', { conversationId })}
>
  <Image
    source={require('../icons/arrow.png')}
    style={{ width: 12, height: 12 }}
  />
</TouchableOpacity>

        </View>

    </View>
    {(currentUserRole === 'leader' || currentUserRole === 'manager') && (
  <TouchableOpacity
    style={styles.options}
    onPress={() => setShowAdministrationOptions(v => !v)}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{
        width: 30, height: 30, backgroundColor: '#D8EDFF',
        borderRadius: 15, justifyContent: 'center', marginRight: 10
      }}>
        <Image source={require('../icons/Photos.png')} style={{ alignSelf: 'center' }} />
      </View>
      <Text style={{ color: '#086DC0', fontSize: 15 }}>Administration</Text>
    </View>
    <View         
  style={{
    width: 30,
    height: 30,
    backgroundColor: '#D8EDFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }}>


    <Image
      source={
        showAdministrationOptions
          ? require('../icons/down-arrow.png')
          : require('../icons/arrow.png')
      }
      style={{ width: 12, height: 12, resizeMode: 'contain' }}
    />
        </View>
  </TouchableOpacity>
)}

{ (currentUserRole === 'leader' || currentUserRole === 'manager') && showAdministrationOptions && (
  <>
        <View style={styles.authority}>
        <TouchableOpacity
  style={styles.authorityOptions}
  onPress={() => setShowJoinRequestsModal(true)}
>
  <View style={styles.authorityIcon}>
    <View style={styles.authorityBorderIcon}>
      <Image source={require('../icons/Verify.png')} />
    </View>
  </View>
  <Text style={styles.authorityText}>Join requests</Text>
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
  <Text style={styles.authorityText}>Authority</Text>
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
    const userId = await AsyncStorage.getItem('userId');
    // Show confirmation dialog
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn giải tán nhóm này?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Giải tán',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log("🚨 Attempting to disband group:", conversationId, "by user:", userId);
      
              const response = await axios.delete(
                `/api/conversations/disband/${conversationId}`,
                { data: { userId } }
              );
      
              console.log("✅ Group disbanded on server:", response.data);
      
              // Emit socket event
              socket.emit(SOCKET_EVENTS.DISBANDED_CONVERSATION, { conversationId });
              console.log("📤 Emitted socket event: disbanded-conversation", { conversationId });
      
              Alert.alert('Thành công', 'Nhóm đã được giải tán.');
              navigation.navigate('GroupsScreen');
            } catch (err) {
              console.error('❌ Error disbanding group:', err);
              Alert.alert(
                'Lỗi',
                err.response?.data?.message || 'Không thể giải tán nhóm.'
              );
            }
          }
        }
      ],
      { cancelable: true }
    );
  }}
>
  <View style={styles.authorityIcon}>
    <View style={styles.authorityBorderIcon}>
      <Image source={require('../icons/Disband.png')} />
    </View>
  </View>
  <Text style={styles.authorityText}>Disband group</Text>
</TouchableOpacity>

</View>
</>
)}




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
                `/api/conversations/${conversationId}/members/${selectedMemberId}`,
                { data: { userId } }
              );
              // 1) Locally refresh
              await fetchGroupMembers();
              fetchModalData();
              setSelectedMemberId(null);
              setRemoveModalVisible(false);
          
              // 2) Emit socket
              console.log("📤 Emitting LEAVE_CONVERSATION for removed member:", selectedMemberId);
              socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, {
                conversationId,
                userId: selectedMemberId
              });
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
{/* Join Requests Modal */}
<Modal
  visible={showJoinRequestsModal}
  transparent
  animationType="slide"
  onRequestClose={() => setShowJoinRequestsModal(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Pending Join Requests</Text>
      {joinRequests.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No requests.</Text>
      ) : (
        <FlatList
          data={joinRequests}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View style={[styles.friendItem, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
                <Text style={[styles.friendName, { marginLeft: 10 }]}>{item.name}</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  onPress={() => handleAccept(item._id)}
                  style={{ marginHorizontal: 5 }}
                >
                  <Image
                    source={require('../icons/check.png')}
                    style={{ width: 24, height: 24 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleReject(item._id)}
                  style={{ marginHorizontal: 5 }}
                >
                  <Image
                    source={require('../icons/Reject.png')}
                    style={{ width: 24, height: 24 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      <TouchableOpacity
        style={[styles.modalCloseButton, { marginTop: 20 }]}
        onPress={() => setShowJoinRequestsModal(false)}
      >
        <Text style={styles.modalCloseText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
<Modal
  visible={membersModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setMembersModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={[styles.modalContent, { maxHeight: '70%' }]}>
      <Text style={styles.modalTitle}>Group Members</Text>
      <TextInput
        value={memberSearchText}
        onChangeText={setMemberSearchText}
        placeholder="Search members…"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 6,
          padding: 8,
          marginBottom: 12,
        }}
      />
      {filteredGroupMembers.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#555' }}>No members found.</Text>
      ) : (
        <FlatList
          data={filteredGroupMembers}
          keyExtractor={item => item.userId}
          extraData={groupMembers}   
          renderItem={({ item }) => (
            <View style={styles.friendItem}>
              <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
              <Text style={styles.friendName}>{item.name}</Text>
            </View>
          )}
        />
      )}
      <TouchableOpacity
        style={[styles.modalCloseButton, { marginTop: 16, alignSelf: 'center' }]}
        onPress={() => setMembersModalVisible(false)}
      >
        <Text style={styles.modalCloseText}>Close</Text>
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',           // increased width
    maxHeight: '80%',       // more space for content
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 25,            // more padding
  },
  modalTitle: {
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalCloseButton: {
    marginRight: 5,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#aaa',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCreateButton: {
    marginLeft: 5,
    paddingVertical: 16,    // taller buttons
    paddingHorizontal: 20,
    backgroundColor: '#086DC0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: { color: 'white', fontSize:12, fontWeight:'bold' },
  modalCreateText: { color: 'white', fontSize:12, fontWeight:'bold'},
  options: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    marginBottom: 15
  },
  optionsLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 30,
    height: 30,
    backgroundColor: '#D8EDFF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  icon: { width: 16, height: 16 },
  optionsText: { color: '#086DC0', fontSize: 15 },

  // Toggle “track”
  toggleTrack: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D8EDFF',
    justifyContent: 'center',
    position: 'relative'
  },
  toggleTrackActive: {
    backgroundColor: '#086DC0'
  },

  // The little “thumb”
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 2
  },
  thumbLeft: { left: 2 },
  thumbRight: { right: 2 },
});
