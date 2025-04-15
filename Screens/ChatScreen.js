import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Dimensions,
  Platform,
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

// ASSETS
const AvatarImage = require("../Images/avt.png");
const CallIcon = require("../assets/Call.png");
const VideoCallIcon = require("../assets/VideoCall.png");
const DetailChatIcon = require("../icons/userdetail.png");
const FileIcon = require("../icons/paperclip.png");
const PictureIcon = require("../icons/picture.png");
const EmojiIcon = require("../icons/emoji.png");
const SendIcon = require("../icons/send.png");
const FileSent = require("../icons/filesent.png");
const Return = require("../icons/back.png");

const screenWidth = Dimensions.get("window").width;

/**
 * Message Bubble Component with support for onLongPress to recall a message.
 */
function MessageItem({ msg, showAvatar, showTime, currentUserId, onLongPress }) {
  const isMe = msg.memberId?.userId === currentUserId;
  const content = msg.content || "";
  const MAX_TEXT_LENGTH = 350;

  const Container = onLongPress ? TouchableOpacity : View;

  const getFileIcon = (fileName = "") => {

    const extension = fileName.split(".").pop().toLowerCase(); // lấy đuôi
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

  const openFile = async (uri, fileName = "") => {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else if (Platform.OS === "android") {
        const mimeType = "application/octet-stream";
        await Linking.openURL(uri);
      } else {
        Alert.alert("Cannot open file", "Device does not support opening this file.");
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("Cannot open file", "An error occurred when opening the file.");
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
        <Image source={AvatarImage} style={messageItemStyles.avatar} />
      ) : (
        <View style={messageItemStyles.avatarPlaceholder} />
      )}
      <View style={messageItemStyles.contentContainer}>
        {msg.type === "IMAGE" ? (
          <Image source={{ uri: content }} style={messageItemStyles.imageContent} />
        ) : msg.type === "FILE" ? (
          <TouchableOpacity
            style={messageItemStyles.fileContainer}
            onPress={() => openFile(msg.content, msg.fileName)}
          >
            <Image source={getFileIcon(msg.fileName)} style={messageItemStyles.fileIcon} />
            <Text style={messageItemStyles.fileText}>
              {msg.fileName || "Open File"}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text
            style={[
              messageItemStyles.textContent,
              isMe ? messageItemStyles.myMessage : messageItemStyles.theirMessage,
              msg.type === "RECALL" && { fontStyle: "italic", color: "#999" },
            ]}
          >
            {msg.type === "RECALL"
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
  myMessage: { backgroundColor: "#EFF8FF", alignSelf: "flex-end" },
  theirMessage: { backgroundColor: "#F5F5F5" },
  timeText: { fontSize: 10, color: "#959595", marginTop: 4 },
});

/**
 * ChatBox Component to render a scrollable list of messages.
 */
function ChatBox({ messages, currentUserId, onMessageLongPress }) {
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
function MessageInput({ input, setInput, onSend, onPickImage, onPickFile, onEmojiPress }) {
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
        <TouchableOpacity style={messageInputStyles.iconButton} onPress={onPickImage}>
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
function HeaderSingleChat({ handleDetail }) {
  const navigation = useNavigation();
  return (
    <View style={headerStyles.container}>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate("ConversationScreen");
        }}
      >
        <Image source={Return} style={headerStyles.avatar} />
      </TouchableOpacity>

      <Image source={AvatarImage} style={headerStyles.avatar} />
      <View style={headerStyles.infoContainer}>
        <Text style={headerStyles.name}>John Doe</Text>
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
        <TouchableOpacity style={headerStyles.iconButton} onPress={handleDetail}>
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
  avatar: { width: 70, height: 70, borderRadius: 35 },
  infoContainer: { marginLeft: 12, flex: 1 },
  name: { fontSize: 22, fontWeight: "600", color: "#086DC0" },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusDot: { width: 10, height: 10, backgroundColor: "#00F026", borderRadius: 5 },
  statusText: { fontSize: 14, marginLeft: 6, color: "#333" },
  iconsContainer: { flexDirection: "row" },
  iconButton: { padding: 8, marginLeft: 8 },
  icon: { width: 24, height: 24, resizeMode: "contain" },
});

/**
 * Main ChatScreen Component which now uses the conversation details passed in via route params.
 */
export default function ChatScreen({ route, navigation }) {
  // Extract the conversation object from the route parameters.
  const { conversation } = route.params;
  const conversationId = conversation._id;
  // Use the conversation _id received from HomeScreen.


  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

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

  // Fetch all messages for the conversation using the dynamic conversationId.
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

  // Handle recall message when user long presses on their own message.
  const handleRecallMessage = (message) => {
    if (message.memberId?.userId !== userId) return;

    Alert.alert("Recall Message", "Do you want to recall this message?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            await axios.delete(
              `/api/messages/${message._id}/conversation/${conversationId}`
            );
            setMessages((prev) =>
              prev.map((m) =>
                m._id === message._id
                  ? { ...m, content: "[Message recalled]", type: "RECALL" }
                  : m
              )
            );
          } catch (err) {
            Alert.alert("Error", err.response?.data?.message || err.message);
          }
        },
      },
    ]);
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        type: "*/*", // cho tất cả định dạng
        copyToCacheDirectory: true, // rất quan trọng trên iOS
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        Alert.alert("No file selected", "You didn't select any file.");
        return;
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
      console.error("Error uploading file:", error);
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
      const newMessage = {
        _id: String(Date.now()), // temporary id if backend doesn't return one immediately
        memberId: { userId: userId },
        type: "TEXT",
        content: message,
        createdAt: new Date().toISOString(),
      };
      // Update local state immediately (optimistic UI update)
      setMessages((prev) => [...prev, newMessage]);

      await axios.post("/api/messages/text", {
        conversationId: conversationId, // ensure you’re using the dynamic conversationId here
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
      console.log(message.content);
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    };
    socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE);
    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);

    socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, conversationId);

    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
      socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, conversationId);
    };
  }, [socket, conversationId]);


  return (
    <View style={chatScreenStyles.container}>
      <HeaderSingleChat />
      <View style={chatScreenStyles.chatContainer}>
        <ChatBox
          messages={messages}
          currentUserId={userId}
          onMessageLongPress={handleRecallMessage}
        />
      </View>
      <MessageInput
        input={input}
        setInput={setInput}
        onSend={handleSendMessage}
        onPickImage={pickImage}
        onPickFile={pickDocument}
        onEmojiPress={() => setEmojiOpen(true)}
      />
      <EmojiPicker
        onEmojiSelected={(emoji) => setInput((prev) => prev + emoji.emoji)}
        open={emojiOpen}
        onClose={() => setEmojiOpen(false)}
      />
    </View>
  );
}

const chatScreenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#D8EDFF" },
  chatContainer: { flex: 1 },
});
