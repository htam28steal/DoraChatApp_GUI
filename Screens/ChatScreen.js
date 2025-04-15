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
  Modal,
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
 * Message Bubble Component with support for onLongPress to show message options.
 */
function MessageItem({ msg, showAvatar, showTime, currentUserId, onLongPress }) {
  const isMe = msg.memberId?.userId === currentUserId;
  const content = msg.content || "";
  const MAX_TEXT_LENGTH = 350;
  const Container = onLongPress ? TouchableOpacity : View;

  const getFileIcon = (fileName = "") => {
    const extension = fileName.split(".").pop().toLowerCase();
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
function ChatBox({ messages, currentUserId, onMessageLongPress, scrollToBottomOnMount }) {
  const scrollViewRef = useRef(null);

  const scrollToEnd = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  // 🔁 Scroll when messages change
  useEffect(() => {
    const timeout = setTimeout(scrollToEnd, 100);
    return () => clearTimeout(timeout);
  }, [messages]);

  // 🚀 Scroll when the component first mounts
  useEffect(() => {
    if (scrollToBottomOnMount) {
      const timeout = setTimeout(scrollToEnd, 200); // slightly longer delay on mount
      return () => clearTimeout(timeout);
    }
  }, []);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={chatBoxStyles.container}
      contentContainerStyle={chatBoxStyles.contentContainer}
      showsVerticalScrollIndicator={false}
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
      <TouchableOpacity onPress={() => navigation.navigate("ConversationScreen")}>
        <Image source={Return} style={headerStyles.backBtn} />
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
  backBtn:{width:50, height:35, marginRight:20},
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
 * Also integrates a modal for long-press message options: "Thu hồi", "Xoá" and "Chuyển tiếp".
 */
export default function ChatScreen({ route, navigation }) {
  // ✅ Extract both conversation and userId from route.params
  const { conversation, userId: passedUserId } = route.params;
  const conversationId = conversation._id;

  

  // ✅ Directly use the passed userId
  const [userId, setUserId] = useState(passedUserId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!userId) {
      (async () => {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          setUserId(storedUserId);
        }
      })();
    }
  }, [userId]);
  

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
            setMessages((prev) =>
              prev.map((m) =>
                m._id === selectedMessage._id
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
    setModalVisible(false);
  };

  // Delete action: Remove the message from local state.
  const handleDeleteAction = () => {
    if (!selectedMessage) return;
    setMessages((prev) => prev.filter((m) => m._id !== selectedMessage._id));
    setModalVisible(false);
  };

  const handleForwardAction = async () => {
    try {
      const response = await axios.get("/api/friends");
      const friends = response.data;
  
      if (!friends || friends.length === 0) {
        Alert.alert("Không có bạn bè nào để chuyển tiếp.");
        return;
      }
  
      Alert.alert(
        "Chọn người nhận",
        "Hãy chọn người để chuyển tiếp:",
        friends.map((friend) => ({
          text: friend.name || friend.username,
          onPress: async () => {
            try {
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
  
              await axios.post("/api/messages/text", messageToForward);
  
              // ✅ Send to socket too
              socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
                conversationId: newConv._id,
                content: selectedMessage.content,
                type: selectedMessage.type,
                fileName: selectedMessage.fileName,
              });
  
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
  
  

  // Pick image for media message.
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission denied", "Gallery access needed.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      const newMsg = {
        _id: String(Date.now()),
        memberId: { userId: userId || "" },
        type: "IMAGE",
        content: selectedImage.uri,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      // Optionally, you could also upload the image to the server here.
    }
  };

  // Pick document for file message.
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
          "application/vnd.ms-project",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const newFileMessage = {
          _id: String(new Date().getTime()),
          memberId: { userId: userId },
          type: "FILE",
          fileName: file.name,
          content: file.uri,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newFileMessage]);
      } else if (result.type === "success") {
        const { name, uri } = result;
        const newFileMessage = {
          _id: String(new Date().getTime()),
          memberId: { userId: userId },
          type: "FILE",
          fileName: name,
          content: uri,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newFileMessage]);
      }
    } catch (error) {
      console.error("File picking error:", error);
      Alert.alert("Error", "Cannot pick file. Please try again.");
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
        _id: String(Date.now()), // temporary id
        memberId: { userId: userId },
        type: "TEXT",
        content: message,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      // Update local state immediately (optimistic UI update)
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

  useEffect(() => {
    if (!socket || !conversationId || !userId) return;
    
    const receiveHandler = (message) => {
      // handle message logic (updating state, etc.)
    };
  
    socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE);
    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
  
    // Emit join event with userId (it should now be defined)
    socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId, userId });
  
    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
      socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, { conversationId, userId });
    };
  }, [socket, conversationId, userId]);
  
  
  return (
    <View style={chatScreenStyles.container}>
      <HeaderSingleChat />
      <View style={chatScreenStyles.chatContainer}>
      <ChatBox
  messages={messages}
  currentUserId={userId}
  onMessageLongPress={handleMessageLongPress}
  scrollToBottomOnMount={true}
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
            <TouchableOpacity style={styles.modalButton} onPress={handleRecallAction}>
              <Text style={styles.modalButtonText}>Thu hồi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleDeleteAction}>
              <Text style={styles.modalButtonText}>Xoá</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleForwardAction}>
              <Text style={styles.modalButtonText}>Chuyển tiếp</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
});
