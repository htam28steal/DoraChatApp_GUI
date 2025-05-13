import React, { useState, useEffect, useCallback,useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView,
  FlatList, Modal, ActivityIndicator, Alert,TextInput, Dimensions,ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socket } from "../utils/socketClient";
import { SOCKET_EVENTS } from "../utils/constant";
import bg from '../Images/bground.png';


import axios from '../api/apiConfig'; 
const AddMember = require('../icons/addFriend.png');
const numColumns = 3;
const size = Dimensions.get('window').width / numColumns - 20;



export default function SingleChatDetail({ route, navigation }) {
  const { conversationId } = route.params;


  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [otherMember, setOtherMember] = useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [recentImages, setRecentImages] = useState([]);
  
  


  
  useEffect(() => {
    (async () => {
      try {
        // 1. load current user
        const uid = await AsyncStorage.getItem('userId');
        setCurrentUserId(uid);

        // 2. fetch conversation by ID
        //    If you really need the "individuals" POST, replace this with your existing axios.post(...)
        const { data: conv } = await axios.get(
          `/api/conversations/${conversationId}`
        );
        setConversation(conv);
        console.log('Fetched conversation:', conv); 
        setIsMuted(!!conv.isMuted);

        // 3. find the “other” member in a 1-on-1 chat
        const other = conv.members.find(
          m => String(m.userId) !== String(uid)
        );
        if (other) {
          setOtherMember(other);            // ← store the other user
          setTempName(other.name);     
          console.log('Identified otherMember:', other);     // ← initialize edit buffer
        }
      } catch (err) {
        console.error('❌ load single-chat detail failed', err);
        Alert.alert('Error', 'Không thể tải chi tiết trò chuyện.');
      }
    })();
  }, [conversationId]);
   useEffect(() => {
    const fetchRecentImages = async () => {
      try {
        const { data: msgs } = await axios.get(`/api/messages/${conversationId}`);
        const imgs = msgs
          .filter(m => m.type === 'IMAGE')
          .sort((a,b) => new Date(b.createdAt?.$date||b.createdAt) - new Date(a.createdAt?.$date||a.createdAt))
          .slice(0,6);
        setRecentImages(imgs);
      } catch(err) {
        console.error('Failed to load recent images', err);
      }
    };
    fetchRecentImages();
  }, [conversationId]);

useEffect(() => {
  const handleNameUpdate = ({ conversationId: convId, userId, name }) => {
    console.log("📥 Received update-member-name socket event:");
    console.log("   conversationId:", convId);
    console.log("   userId:", userId);
    console.log("   newName:", name);
    console.log("   local conversationId:", conversationId);
    console.log("   local otherMember?.userId:", otherMember?.userId);

    if (convId !== conversationId) {
      console.log("❌ Ignored: conversationId mismatch");
      return;
    }

    if (userId !== otherMember?.userId) {
      console.log("❌ Ignored: userId mismatch");
      return;
    }

    console.log("✅ Matched! Updating name in local state.");
    setOtherMember(prev => ({ ...prev, name: name }));
  };

  socket.on(SOCKET_EVENTS.UPDATE_MEMBER_NAME, handleNameUpdate);
  console.log("🔗 Subscribed to UPDATE_MEMBER_NAME socket event");

  return () => {
    socket.off(SOCKET_EVENTS.UPDATE_MEMBER_NAME, handleNameUpdate);
    console.log("❌ Unsubscribed from UPDATE_MEMBER_NAME socket event");
  };
}, [conversationId, otherMember?.userId]);



  const handleSaveName = async () => {
    console.log('handleSaveName called with tempName:', tempName, 'for user:', otherMember?.userId);
    if (!otherMember) return;
    setIsSaving(true);
    try {
      await axios.patch(
        `/api/members/${conversationId}/${otherMember._id}`,
        { name: tempName }
      );
      socket.emit(SOCKET_EVENTS.UPDATE_MEMBER_NAME, {
        conversationId,
        userId: otherMember.userId,
        newName: tempName
      });
      // Update local state
      setOtherMember(prev => ({ ...prev, name: tempName }));
      console.log('PATCH success—name updated on server');     
      setIsEditingName(false);
    } catch (err) {
      console.log('PATCH error:', err);  
      Alert.alert('Error', 'Không thể cập nhật tên thành viên.');
    } finally {
      setIsSaving(false);
    }
  };



 


 

  return (
        <ImageBackground source={bg} style={styles.gradient} resizeMode="cover">
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

      <View style={styles.profileHeader}>
  {otherMember?.avatar && (
    <Image
      source={{ uri: otherMember.avatar }}
      style={styles.profileAvatar}
    />
  )}
  <View style={styles.nameRow}>
    {isEditingName ? (
      <TextInput
        value={tempName}
        onChangeText={setTempName}
        style={styles.editableName}
        autoFocus
      />
    ) : (
      <Text style={styles.nameText}>
        {otherMember?.name}
      </Text>
    )}
    <TouchableOpacity
      onPress={() => {
        if (isEditingName) handleSaveName();
        else {
          setTempName(otherMember?.name );
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
        style={styles.editIcon}
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
    {recentImages.length > 0 && (
  <FlatList
    data={recentImages}
    keyExtractor={i => i._id}
    renderItem={({item}) => (
      <TouchableOpacity
        onPress={() => navigation.navigate('FullScreenImage',{ uri: item.content })}
      >
        <Image source={{uri: item.content}}
               style={styles.recentImage}/>
      </TouchableOpacity>
    )}
    numColumns={numColumns}
    scrollEnabled={false}
   contentContainerStyle={styles.recentList}
  />
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
    

    </View>

    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1},
  header: {
    justifyContent: 'center',
    flexDirection: 'row',
    paddingBottom: 10,
    
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
    marginBottom:5
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
  
  profileHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#086DC0',
  },
  editableName: {
    borderBottomWidth: 1,
    borderColor: '#086DC0',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#086DC0',
  },
  editIcon: {
    width: 20,
    height: 20,
    marginLeft: 8,
  },
    gradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    
  },
recentList: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  paddingHorizontal: 20, // ✅ add this line
},

  recentImage: {
    width: 95,
    height: 60,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor:'#fff'
  },
});
