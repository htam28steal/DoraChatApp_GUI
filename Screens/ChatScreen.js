import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
  Modal,
  Linking,
  FlatList
} from "react-native";
import axios from "../api/apiConfig";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import EmojiPicker from "rn-emoji-keyboard";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { socket } from "../utils/socketClient";
import { SOCKET_EVENTS } from "../utils/constant";
import * as Sharing from "expo-sharing";
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
dayjs.extend(relativeTime);
import { Video } from "expo-av";
import UserService from "../api/userService";  

// ASSETS
const AvatarImage = require("../Images/avt.png");
const CallIcon = require("../icons/call.png");
const VideoCallIcon = require("../icons/video_call.png");
const DetailChatIcon = require("../icons/detail_chat.png");
const FileIcon = require("../icons/paperclip.png");
const PictureIcon = require("../icons/picture.png");
const EmojiIcon = require("../icons/emoji.png");
const SendIcon = require("../icons/send_icon.png");
const FileSent = require("../icons/filesent.png");
const Return = require("../icons/back.png");

const screenWidth = Dimensions.get("window").width;

/**
 * Message Bubble Component with support for onLongPress to show message options.
 */
function MessageItem({
  msg,
  showAvatar,
  showTime,
  currentUserId,
  onLongPress,
  currentUserAvatar,
  otherUserAvatar, // ✅ ADD THIS
}) {


  const isMe = msg.memberId?.userId === currentUserId;
  const content = msg.content || "";
  const MAX_TEXT_LENGTH = 350;
  const Container = onLongPress ? TouchableOpacity : View;

  const getFileExtension = (url) => {
    if (!url) return '';

    const fileName = url.includes('/')
      ? url.substring(url.lastIndexOf('/') + 1)
      : url;

    const lastDotIndex = fileName.lastIndexOf('.');

    if (lastDotIndex !== -1) {
      return fileName.substring(lastDotIndex + 1).toLowerCase();
    }

    return '';
  };

  const getFileIcon = (fileNameOrUrl = "") => {
    const extension = getFileExtension(fileNameOrUrl);

    switch (extension) {
      case "pdf":
        return require("../icons/pdf.png");
      case "xls":
      case "xlsx":
        return require("../icons/xls.png");
      case "doc":
      case "docx":
        return require("../icons/doc.png");
      case "ppt":
      case "pptx":
        return require("../icons/ppt.png");
      case "txt":
        return require("../icons/txt.png");
      default:
        return require("../icons/fileDefault.png");
    }
  };

  const openVideo = async (uri) => {
    try {
      const supported = await Linking.canOpenURL(uri);
      if (supported) {
        await Linking.openURL(uri);
      } else {
        Alert.alert("Error", "Cannot open this video.");
      }
    } catch (error) {
      console.error("Error opening video:", error);
      Alert.alert("Error", "Failed to open video.");
    }
  };

  return (
    <Container
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[
        messageItemStyles.container,
        isMe ? messageItemStyles.rightAlign : messageItemStyles.leftAlign,
      ]}
    >
{showAvatar ? (
  <Image
    source={
      isMe
        ? currentUserAvatar
          ? { uri: currentUserAvatar }
          : AvatarImage
        : otherUserAvatar
          ? { uri: otherUserAvatar }
          : AvatarImage
    }
    style={messageItemStyles.avatar}
  />
) : (
  <View style={messageItemStyles.avatarPlaceholder} />
)}

      <View style={messageItemStyles.contentContainer}>
        {msg.type === "IMAGE" ? (
          <Image source={{ uri: content }} style={messageItemStyles.imageContent} />
        ) : msg.type === "VIDEO" ? (
          <Video
            source={{ uri: content }}
            style={messageItemStyles.videoContent}
            useNativeControls
            resizeMode="cover"
            isLooping={false}
          />
        ) : msg.type === "FILE" ? (
          <TouchableOpacity
            style={messageItemStyles.fileContainer}
            onLongPress={onLongPress}
            activeOpacity={0.7}
          >
            <Image source={getFileIcon(msg.content)} style={messageItemStyles.fileIcon} />
            <Text style={messageItemStyles.fileText}>
              {msg.fileName || "Open File"}
            </Text>
          </TouchableOpacity>
        ) : (
         <Text
  style={[
    messageItemStyles.textContent,
    isMe ? messageItemStyles.myMessage : messageItemStyles.theirMessage,
    (msg.isDeleted || msg.type === "RECALL") && {
      fontStyle: "italic",
      color: "#999",
   
    },
  ]}
>
  {msg.isDeleted || msg.type === "RECALL"
    ? "Message has been recalled"
    : content.length > MAX_TEXT_LENGTH
    ? content.slice(0, MAX_TEXT_LENGTH) + "..."
    : content}
</Text>
        )}
        {showTime && (
          <Text style={[messageItemStyles.timeText, isMe && { alignSelf: "flex-end" }]}>
            {dayjs(msg.createdAt).fromNow()}
          </Text>
        )}
      </View>
    </Container>
  );
}


const messageItemStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 4,
    alignItems: "flex-end",
  },
  leftAlign: { justifyContent: "flex-start" },
  rightAlign: { flexDirection: "row-reverse" },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40 },
  contentContainer: { maxWidth: 468, marginHorizontal: 8 },
  imageContent: {
    width: 250,
    height: 250,
    borderRadius: 8,
    resizeMode: "cover",
  },
  fileContainer: {
    padding: 12,
    backgroundColor: "#EFF8FF",
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "column",
    minWidth: 100,
    maxWidth: 200,
  },
  fileIcon: {
    width: 48,
    height: 48,
    marginBottom: 4,
  },
  videoContent: {
    width: 250,
    height: 250,
    borderRadius: 8,
  },
  fileText: {
    color: "#086DC0",
    fontSize: 14,
    textDecorationLine: "underline",
    textAlign: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },
  textContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 14,
    color: "#000",
  },
  videoContainer: {
    width: 250,
    height: 250,
    borderRadius: 8,
    backgroundColor: "#EFF8FF",
    justifyContent: "center",
    alignItems: "center",
  },
  videoIcon: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  myMessage: { backgroundColor: "#EFF8FF", alignSelf: "flex-end" },
  theirMessage: { backgroundColor: "#F5F5F5" },
  timeText: { fontSize: 10, color: "#959595", marginTop: 4 },
});

/**
 * ChatBox Component to render a scrollable list of messages.
 */
function ChatBox({ messages, currentUserId, currentUserAvatar, otherUserAvatar, onMessageLongPress }) {


  const scrollViewRef = useRef(null);
  

  useEffect(() => {
    if (scrollViewRef.current)
      scrollViewRef.current.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    
    <ScrollView
      ref={scrollViewRef}
      style={chatBoxStyles.container}
      contentContainerStyle={chatBoxStyles.contentContainer}
    >
      {messages.map((msg, index) => {
        const userId = msg.memberId?.userId || "";
        const prevId = messages[index - 1]?.memberId?.userId || "";
        const nextId = messages[index + 1]?.memberId?.userId || "";
        const isFirstInGroup = index === 0 || prevId !== userId;
        const isLastInGroup = index === messages.length - 1 || nextId !== userId;
        const key = `${msg._id}-${index}`;

        return (
        <MessageItem
          key={key}
          msg={msg}
          showAvatar={isFirstInGroup}
          showTime={isLastInGroup}
          currentUserId={currentUserId}
          currentUserAvatar={currentUserAvatar}
           otherUserAvatar={otherUserAvatar}
          onLongPress={
            msg.memberId?.userId === currentUserId
              ? () => onMessageLongPress(msg)
              : null
          }
        />

        );
      })}
    </ScrollView>
  );
}

const chatBoxStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { padding: 8, paddingBottom: 20 },
});

/**
 * MessageInput Component for composing messages.
 */
function MessageInput({ input, setInput, onSend, onPickMedia, onPickFile, onEmojiPress }) {
  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <View style={messageInputStyles.container}>
      <TouchableOpacity style={messageInputStyles.iconButton} onPress={onPickFile}>
        <Image source={FileIcon} style={messageInputStyles.icon} />
      </TouchableOpacity>
      <View style={messageInputStyles.inputContainer}>
        <TextInput
          style={messageInputStyles.textInput}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity style={messageInputStyles.iconButton} onPress={onPickMedia}>
          <Image source={PictureIcon} style={messageInputStyles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={messageInputStyles.iconButton} onPress={onEmojiPress}>
          <Image source={EmojiIcon} style={messageInputStyles.icon} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={messageInputStyles.sendButton} onPress={handleSend}>
        <Image source={SendIcon} style={messageInputStyles.sendIcon} />
      </TouchableOpacity>
    </View>
  );
}

const messageInputStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  iconButton: { padding: 8 },
  icon: { width: 24, height: 24, resizeMode: "contain" },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F6F6",
    borderRadius: 32,
    paddingHorizontal: 12,
    marginHorizontal: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    color: "#000",
  },
  sendButton: { padding: 8 },
  sendIcon: { width: 24, height: 24, resizeMode: "contain" },
});

/**
 * Header Component for the chat screen.
 */
function HeaderSingleChat({ conversationId, conversation,currentUserId,otherUser     }) {
  const navigation = useNavigation();
  const other = conversation.members.find(m => m.userId !== currentUserId);
  return (
    <View style={headerStyles.container}>
      <TouchableOpacity onPress={() => navigation.navigate("ConversationScreen")}>
        <Image source={Return} style={headerStyles.backBtn} />
      </TouchableOpacity>
           <Image
        source={otherUser?.avatar ? { uri: otherUser.avatar } : AvatarImage}
        style={headerStyles.avatar}
      />
      <View style={headerStyles.infoContainer}>
        <Text style={headerStyles.name} numberOfLines={1}>{otherUser?.name}</Text>
        <View style={headerStyles.statusContainer}>
          <View style={headerStyles.statusDot} />
          <Text style={headerStyles.statusText}>Active</Text>
        </View>
      </View>
      <View style={headerStyles.iconsContainer}>
        <TouchableOpacity style={headerStyles.iconButton}>
          <Image source={CallIcon} style={headerStyles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={headerStyles.iconButton}>
          <Image source={VideoCallIcon} style={headerStyles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={headerStyles.iconButton} onPress={() => navigation.navigate('DetailScreen', { conversationId, friendId: other.userId })}>
          <Image source={DetailChatIcon} style={headerStyles.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    marginTop: 10,
  },
  backBtn: { width: 25, height: 20, marginRight: 20 },
  avatar: { width: 50, height: 50, borderRadius: 35 },
  infoContainer: { marginLeft: 12, flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: "#086DC0" },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusDot: { width: 10, height: 10, backgroundColor: "#00F026", borderRadius: 5 },
  statusText: { fontSize: 14, marginLeft: 6, color: "#333" },
  iconsContainer: { flexDirection: "row" },
  iconButton: { padding: 8, marginLeft: 8 },
  icon: { width: 20, height: 20, resizeMode: "contain" },
});

/**
 * Main ChatScreen Component which now uses the conversation details passed in via route params.
 * Also integrates a modal for long-press message options: "Thu hồi", "Xoá" and "Chuyển tiếp".
 */
export default function ChatScreen({ route, navigation }) {
  // Extract the conversation object from route parameters.
const [userId, setUserId] = useState(null);
  const { conversation } = route.params;
  const conversationId = conversation._id;
const [conversationsList, setConversationsList] = useState([]);


  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

  // State for long press options modal.
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
const [selectedForwardId, setSelectedForwardId] = useState(null);
const [currentUser, setCurrentUser] = useState(null);
const [otherUser, setOtherUser] = useState(null);


const openForwardModal = async () => {
  try {
    const { data } = await axios.get("/api/conversations");
    console.log("🔍 all conversations:", data);
    setConversationsList(data);
    setModalVisible(false);
    setForwardModalVisible(true);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    Alert.alert("Lỗi lấy cuộc trò chuyện", err.message);
  }
};

useEffect(() => {
  const fetchOther = async () => {
    try {
      const otherId = conversation.members.find(m => m.userId !== userId)?.userId;
      if (!otherId) return;

      const data = await UserService.getUserById(otherId);
      setOtherUser(data);
    } catch (err) {
      console.error("Failed to fetch other user:", err);
    }
  };

  if (userId) fetchOther();
}, [userId, conversation]);


useEffect(() => {
  const fetchMe = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const { data } = await axios.get('/api/me/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(data);
    } catch (e) {
      console.error(e);
    }
  };
  fetchMe();
}, []);




const recallHandler = useCallback((data) => {
  const messageId = data.messageId ?? data._id;
  const newContent = data.content ?? "[Message recalled]";

  setMessages((prev) =>
    prev.map((m) =>
      m._id === messageId
        ? {
            ...m,
            content: newContent,
            type: "RECALL",
            isDeleted: true, // <== Make sure this is preserved in memory
          }
        : m
    )
  );
}, []);


useEffect(() => {
  if (!socket || !conversationId) return;

  const receiveHandler = (message) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m._id === message._id);
      if (exists) return prev;
      return [...prev, message];
    });
  };

  socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
  socket.off(SOCKET_EVENTS.MESSAGE_RECALLED, recallHandler);

  socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
  socket.on(SOCKET_EVENTS.MESSAGE_RECALLED, recallHandler);

  socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, conversationId);

  return () => {
    socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
    socket.off(SOCKET_EVENTS.MESSAGE_RECALLED, recallHandler);
    socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, conversationId);
  };
}, [socket, conversationId, recallHandler]);


  const handleSelectFriendToForward = async (friend) => {
  try {
    const convResponse = await axios.post(`/api/conversations/individuals/${friend._id}`);
    const newConv = convResponse.data;

    const messageToForward = {
      conversationId: newConv._id,
      content: selectedMessage.content,
      type: selectedMessage.type,
      fileName: selectedMessage.fileName,
    };

    await axios.post("/api/messages/text", messageToForward);

    Alert.alert("Chuyển tiếp thành công!");
    setForwardModalVisible(false);
  } catch (err) {
    Alert.alert("Lỗi chuyển tiếp", err.response?.data?.message || err.message);
  }
};


  const handleForwardAction = async () => {
    try {
      const response = await axios.get("/api/friends");
      const friends = response.data;
  
      if (!friends || friends.length === 0) {
        Alert.alert("Không có bạn bè nào để chuyển tiếp.");
        return;
      }
  
      // Hiện danh sách bạn bè bằng Alert để chọn
      Alert.alert(
        "Chọn người nhận",
        "Hãy chọn người để chuyển tiếp:",
        friends.map((friend) => ({
          text: friend.name || friend.username,
          onPress: async () => {
            try {
              // Gọi API tạo cuộc trò chuyện nếu chưa có
              const convResponse = await axios.post(
                `/api/conversations/individuals/${friend._id}`
              );
  
              const newConv = convResponse.data;
              const messageToForward = {
                conversationId: newConv._id,
                content: selectedMessage.content,
                type: selectedMessage.type,
                fileName: selectedMessage.fileName,
              };
  
              // Gửi message chuyển tiếp
              await axios.post("/api/messages/text", messageToForward);
              Alert.alert("Chuyển tiếp thành công!");
            } catch (err) {
              Alert.alert("Lỗi chuyển tiếp", err.response?.data?.message || err.message);
            }
          },
        }))
      );
    } catch (error) {
      Alert.alert("Lỗi lấy danh sách bạn bè", error.response?.data?.message || error.message);
    }
    setModalVisible(false);
  };
  // Retrieve userId from AsyncStorage.
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          Alert.alert("Error", "User id not found.");
        }
      } catch (error) {
        Alert.alert("Error fetching user id", error.message);
      }
    };
    fetchUserId();
  }, []);

  // Fetch all messages for the conversation using conversationId.
  useEffect(() => {
    if (!conversationId) return;
    const fetchAllMessages = async () => {
      try {
        const response = await axios.get("/api/messages/" + conversationId);
        // Assuming response.data is an array of messages.
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
        Alert.alert(
          "Error fetching messages",
          error.response?.data?.message || error.message
        );
      }
    };
    fetchAllMessages();
  }, [conversationId]);

  // Unified long press handler to show the custom modal with options.
  const handleMessageLongPress = (message) => {
    setSelectedMessage(message);
    setModalVisible(true);
  };

  // Recall action (already implemented in your code).
  const handleRecallAction = () => {
    if (!selectedMessage) return;
    Alert.alert("Thu hồi", "Bạn có muốn thu hồi tin nhắn này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            await axios.delete(
              `/api/messages/${selectedMessage._id}/conversation/${conversationId}`
            );
            // 1) update local UI
            setMessages(prev =>
              prev.map(m =>
                m._id === selectedMessage._id
                  ? { ...m, content: "[Message recalled]", type: "RECALL" }
                  : m
              )
            );

            socket.emit(SOCKET_EVENTS.MESSAGE_RECALLED, {
              conversationId,
              messageId: selectedMessage._id,
            });

          } catch (err) {
            Alert.alert("Error", err.response?.data?.message || err.message);
          }
        },
      },
    ]);
    setModalVisible(false);
  };

const handleSelectConversationToForward = async (convId) => {
  try {
    await axios.post("/api/messages/text", {
      conversationId: convId,
      content: selectedMessage.content,
      type: selectedMessage.type,
      fileName: selectedMessage.fileName,
    });
    Alert.alert("Chuyển tiếp thành công!");
  } catch (err) {
    Alert.alert("Lỗi chuyển tiếp", err.response?.data?.message || err.message);
  } finally {
    setForwardModalVisible(false);
  }
};


  // Delete action: Remove the message from local state.
  const handleDeleteAction = async () => {
    if (!selectedMessage) return;

    try {
      setMessages((prev) => prev.filter((m) => m._id !== selectedMessage._id));

      console.log(selectedMessage._id);
      await axios.delete(`/api/messages/${selectedMessage._id}/only`, {
        data: {
          conversationId: conversationId
        }
      });


      // Thông báo xóa thành công (tùy chọn)
      // Alert.alert("Thành công", "Tin nhắn đã được xóa");

    } catch (error) {
      console.error("Error deleting message:", error);

      Alert.alert("Lỗi", "Không thể xóa tin nhắn. Vui lòng thử lại sau.");
    } finally {
      setModalVisible(false);
    }
  };

  const pickImage = async () => {
    const formData = new FormData();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission denied", "Gallery access needed.");
      return;
    }

    // Mở thư viện hình ảnh
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Cho phép chọn cả Images và Videos
      quality: 1,
      allowsEditing: false, // Bạn có thể bật chế độ chỉnh sửa nếu cần
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      console.log(selectedImage); // Kiểm tra thông tin của hình ảnh được chọn

      // Lấy URI hình ảnh
      const imageUri = selectedImage.uri;
      const fileName = selectedImage.uri.split('/').pop(); // Lấy tên file từ URI
      const mimeType = selectedImage.mimeType;

      // Tạo một đối tượng `File` cho FormData
      const file = {
        uri: imageUri,
        name: fileName,
        type: mimeType,
      };

      formData.append('id', userId);
      formData.append('image', file);
      formData.append('conversationId', conversationId);

      try {
        // Gửi tệp lên server
        const response = await axios.post('/api/messages/images', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 20000,
        });

        // Nhận URL hình ảnh từ phản hồi và tạo thông điệp mới
        const imageUrl = response.data?.file?.url;
        const newMsg = {
          _id: String(Date.now()),
          memberId: { userId: userId || "" },
          type: "IMAGE",
          content: imageUrl,
          createdAt: new Date().toISOString(),
        };

        // Cập nhật danh sách tin nhắn với ảnh mới
        setMessages((prev) => [...prev, newMsg]);
        console.log('Image uploaded successfully:', imageUrl);

      } catch (err) {
        console.log('Error uploading image:', err);
        Alert.alert('Error', 'Failed to upload image');
      }
    }
  };

  // const pickVideo = async () => {
  //   const formData = new FormData();

  //   const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //   if (!permission.granted) {
  //     Alert.alert("Permission denied", "Gallery access needed.");
  //     return;
  //   }
  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Videos,
  //     quality: 1,
  //     allowsEditing: false,
  //   });
  //   if (!result.canceled && result.assets.length > 0) {
  //     const selectedVideo = result.assets[0];
  //     console.log(selectedVideo);
  //     const videoUri = selectedVideo.uri;
  //     const fileName = selectedVideo.uri.split('/').pop();
  //     const mimeType = selectedVideo.mimeType || 'video/mp4';

  //     const file = {
  //       uri: videoUri,
  //       name: fileName,
  //       type: mimeType,
  //     };

  //     formData.append('id', userId);
  //     formData.append('video', file);
  //     formData.append('conversationId', conversationId);

  //     try {
  //       // Gửi tệp lên server
  //       const response = await axios.post('/api/messages/videos', formData, {
  //         headers: {
  //           'Content-Type': 'multipart/form-data',
  //         },
  //         timeout: 30000,
  //       });

  //       const videoUrl = response.data?.file?.url;
  //       const newMsg = {
  //         _id: String(Date.now()),
  //         memberId: { userId: userId || "" },
  //         type: "VIDEO",
  //         content: videoUrl,
  //         createdAt: new Date().toISOString(),
  //       };

  //       setMessages((prev) => [...prev, newMsg]);
  //       console.log('Video uploaded successfully:', videoUrl);

  //     } catch (err) {
  //       console.log('Error uploading video:', err);
  //       Alert.alert('Error', 'Failed to upload video');
  //     }
  //   }
  // };

  const base64ToBlob = (base64Data, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(base64Data); // decode base64
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });
      console.log(result);


      if ((result.canceled === false && result.assets && result.assets.length > 0) || result.type === "success") {
        let file, fileName, fileUri, mimeType;

        if (result.assets && result.assets.length > 0) {
          file = result.assets[0];
          fileUri = file.uri;
          fileName = file.name;
          mimeType = file.mimeType || 'application/octet-stream';
        } else if (result.type === "success") {
          fileUri = result.uri;
          fileName = result.name;
          mimeType = 'application/octet-stream';
        } else {
          throw new Error("Không thể đọc thông tin file");
        }

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          Alert.alert("Error", "File not found.");
          return;
        }

        const formData = new FormData();
        formData.append('id', userId);
        formData.append('conversationId', conversationId);
        formData.append('file', {
          uri: fileUri,
          name: fileName,
          type: mimeType,
        });

        // Chỉ upload file, không thêm tin nhắn vào state
        // Tin nhắn sẽ được thêm tự động qua WebSocket
        console.log(formData)
        await axios.post('/api/messages/file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

      }

      const file = result.assets[0];
      const fileUri = file.uri;
      const fileName = file.name;
      const mimeType = file.mimeType || 'application/octet-stream';

      // Đọc file thành blob
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        Alert.alert("Error", "File not found.");
        return;
      }

      const formData = new FormData();
      formData.append('id', userId);
      formData.append('conversationId', conversationId);
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      });

      const response = await axios.post('/api/messages/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = response.data?.file?.url;

      const newFileMessage = {
        _id: String(new Date().getTime()),
        memberId: { userId },
        type: "FILE",
        fileName: fileName,
        content: uploadedUrl,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, newFileMessage]);

    } catch (error) {
      console.error("Error uploading file:", error.message);
      Alert.alert("Upload error", "Không thể upload file.");
    }
  };

  // Handle sending a text message.
  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    if (!userId) {
      Alert.alert("User not loaded", "Unable to send message without a valid user.");
      return;
    }
    try {
      // Create an optimistic message with a pending flag.
     const newMessage = {
  _id: String(Date.now()),
  memberId: { userId },
  type: "TEXT",
  content: message,
  createdAt: new Date().toISOString(),
  pending: true, // <== important
};

setMessages((prev) => [...prev, newMessage]);


      await axios.post("/api/messages/text", {
        conversationId: conversationId,
        content: message,
      });

      // Emit the message over socket; your server should broadcast it back
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
        conversationId: conversationId,
        content: message,
      });
    } catch (err) {
      Alert.alert("Cannot send message", err.response?.data?.message || err.message);
    }
  };

  // Listen for incoming messages from the socket.
  useEffect(() => {
    if (!socket || !conversationId) return;
const receiveHandler = (message) => {
  setMessages((prev) => {
    // If it's from the current user, replace the optimistic one
    if (message.memberId?.userId === userId) {
      const index = prev.findIndex(
        (m) => m.pending && m.content === message.content
      );
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = message;
        return updated;
      }
    }

    // If it already exists by ID, don't add
    if (prev.some((m) => m._id === message._id)) return prev;

    // Otherwise, add the new message
    return [...prev, message];
  });
};

    socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE);
    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);

    socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, conversationId);

    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
      socket.off(SOCKET_EVENTS.MESSAGE_RECALLED, recallHandler);
      socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, conversationId);
    };
  }, [socket, conversationId]);




  return (
    <View style={chatScreenStyles.container}>
<HeaderSingleChat
  conversation={conversation}
  conversationId={conversationId}
  currentUserId={userId}
  otherUser={otherUser}
/>
      <View style={chatScreenStyles.chatContainer}>
          {otherUser && (

<ChatBox
  messages={messages}
  currentUserId={userId}
  currentUserAvatar={currentUser?.avatar}
   otherUserAvatar={otherUser?.avatar}// ✅ this is fine
  onMessageLongPress={handleMessageLongPress}
/>
  )}


      </View>
      <MessageInput
        input={input}
        setInput={setInput}
        onSend={handleSendMessage}
        onPickMedia={pickImage}

        onPickFile={pickDocument}
        onEmojiPress={() => setEmojiOpen(true)}
      />
      <EmojiPicker
        onEmojiSelected={(emoji) => setInput((prev) => prev + emoji.emoji)}
        open={emojiOpen}
        onClose={() => setEmojiOpen(false)}
      />

      {/* Modal for message actions on long press */}
     <Modal
  visible={modalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setModalVisible(false)}
>
  <TouchableOpacity
    style={styles.modalOverlay}
    activeOpacity={1}
    onPressOut={() => setModalVisible(false)}
  >
    <View style={styles.modalContainer}>
      {selectedMessage?.isDeleted ? (
        // Already recalled/deleted → only allow permanent delete
        <TouchableOpacity
          style={styles.modalButton}
          onPress={handleDeleteAction}
        >
          <Text style={styles.modalButtonText}>Xoá</Text>
        </TouchableOpacity>
      ) : (
        // Normal message → all three actions
        <>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={handleRecallAction}
          >
            <Text style={styles.modalButtonText}>Thu hồi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={handleDeleteAction}
          >
            <Text style={styles.modalButtonText}>Xoá</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalButton}
             onPress={openForwardModal}
          >
            <Text style={styles.modalButtonText}>Chuyển tiếp</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  </TouchableOpacity>
</Modal>


<Modal
  visible={forwardModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setForwardModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.classifyModal}>
      <Text style={styles.manageTitle}>Chọn cuộc trò chuyện</Text>
      <FlatList
        data={conversationsList}
        keyExtractor={(c) => c._id}
        renderItem={({ item: conv }) => {
          console.log("🔸 render conv:", conv);

               const isGroup = conv.type === true;
      let title, avatarUri;

      if (isGroup) {
        // group chat
        title = conv.name;
        avatarUri = conv.avatar;
      } else {
        // private chat: use the `userId` from state, not `currentUserId`
        const other = conv.members.find(m => m.userId !== userId);
        console.log("   private-other:", other);
        title = other?.name ?? "Unknown";
        avatarUri = other?.avatar;
      }
          const isSelected = conv._id === selectedForwardId;
          return (
            <TouchableOpacity
              style={styles.classifyRow}
              onPress={() => {
                console.log("→ selected conversation:", conv._id);
                setSelectedForwardId(conv._id);
              }}
            >
              <Image
                source={avatarUri ? { uri: avatarUri } : AvatarImage}
                style={styles.friendAvatar}
              />
              <Text style={styles.classifyLabel}>{title}</Text>
              <View
                style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                ]}
              >
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[
          styles.confirmButton,
          !selectedForwardId && { opacity: 0.5 },
        ]}
        disabled={!selectedForwardId}
        onPress={() => handleSelectConversationToForward(selectedForwardId)}
      >
        <Text style={styles.confirmText}>Chuyển tiếp</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

 

    </View>
  );
}

const chatScreenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#D8EDFF" },
  chatContainer: { flex: 1 },
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalButton: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  modalButtonText: {
    fontSize: 16,
    color: "#086DC0",
  },
  forwardContainer: {
    backgroundColor: "#fff",
    padding: 20,
    marginHorizontal: 30,
    borderRadius: 10,
  },
  forwardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  friendItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    width: "100%",
  },
  friendName: {
    fontSize: 16,
    textAlign: "center",
  },
  friendItem: {
    flexDirection: "row",

    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  friendItemSelected: {
    backgroundColor: "#E3F2FD",
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendName: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  radioWrapper: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#086DC0",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#086DC0",
  },
  confirmButton: {
    backgroundColor: "#086DC0",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 16,
  },
  confirmText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  cancelText: {
    color: "#f44336",
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  },
   modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  // white card
  classifyModal: {
    backgroundColor: "white",
    width: "80%",
    borderRadius: 8,
    padding: 16,
    maxHeight: "60%",
  },

  manageTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },

  classifyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },

  classifyLabel: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#086DC0",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxSelected: {
    backgroundColor: "#086DC0",
  },

  checkmark: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 18,
  },

  confirmButton: {
    backgroundColor: "#086DC0",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
  },

  confirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

});
