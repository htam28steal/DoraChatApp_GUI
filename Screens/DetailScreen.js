import React, { useState, useEffect, useCallback,useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView,
  FlatList, Modal, ActivityIndicator, Alert,TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socket } from "../utils/socketClient";
import { SOCKET_EVENTS } from "../utils/constant";

import axios from '../api/apiConfig';
const AddMember = require('../icons/addFriend.png');



export default function GroupDetail({ route, navigation }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isJoinApproval, setIsJoinApproval] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');


  const { conversationId } = route.params;
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);

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
          <TouchableOpacity style={styles.pinButton}>
            <Image source={require('../icons/Pin.png')} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Existing group profile and pictures... */}
      <View style={{ alignItems: 'center', marginVertical: 20 }}>
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
  </View>
</View>



       <View style={{marginTop:30}}>
        

    
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
    

    </View>

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
