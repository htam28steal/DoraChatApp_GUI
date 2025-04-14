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
import * as Sharing from 'expo-sharing';
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

// CONSTANTS
const CONVERSATION_ID = "67dcf8eac3a67270b6534c60"; // Có thể đổi thành dynamic nếu cần.
const screenWidth = Dimensions.get("window").width;

/**
 * Message Bubble Component với hỗ trợ onLongPress để recall tin nhắn.
 */
function MessageItem({ msg, showAvatar, showTime, currentUserId, onLongPress }) {
  // Kiểm tra nếu tin nhắn do chính người dùng gửi.
  const isMe = msg.memberId?.userId === currentUserId;
  const content = msg.content || "";
  const MAX_TEXT_LENGTH = 350;

  // Nếu có onLongPress (chỉ dành cho tin nhắn của chính mình) thì bọc trong TouchableOpacity.
  const Container = onLongPress ? TouchableOpacity : View;


  const getFileIcon = (fileName = "") => {
    const extension = fileName.split(".").pop().toLowerCase();

    console.log(extension);


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
        const mimeType = getMimeType(fileName);

        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: uri,
          flags: 1,
          type: mimeType,
        });
      } else {
        Alert.alert("Không thể mở file", "Thiết bị không hỗ trợ mở file này.");
      }
    } catch (error) {
      console.error("Mở file lỗi:", error);
      Alert.alert("Không thể mở file", "Đã xảy ra lỗi khi mở file.");
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
          <Image
            source={{ uri: content }}
            style={messageItemStyles.imageContent}
          />
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
              // Nếu đây là tin nhắn đã recall, ta có thể thay đổi style (ví dụ: in nghiêng)
              msg.type === "RECALL" && { fontStyle: "italic", color: "#999" },
            ]}
          >
            {msg.type === "RECALL"
              ? "[Message recalled]"
              : content.length > MAX_TEXT_LENGTH
              ? content.slice(0, MAX_TEXT_LENGTH) + "..."
              : content}
          </Text>
        )}
        {showTime && (
          <Text
            style={[
              messageItemStyles.timeText,
              isMe && { alignSelf: "flex-end" },
            ]}
          >
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
    alignItems: "flex-end" 
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
 * ChatBox Component nhận thêm hàm onMessageLongPress.
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
        // Nhóm các tin nhắn liên tiếp cùng người gửi.
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
            // Chỉ cho phép recall tin nhắn của chính người dùng, nên onLongPress mới được truyền.
            onLongPress={msg.memberId?.userId === currentUserId ? () => onMessageLongPress(msg) : null}
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

function MessageInput({

  input, setInput, onSend, onPickImage, onPickFile, onEmojiPress
}) {
  const [selectedFile, setSelectedFile] = useState(null);


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
 * Header Component (không thay đổi)
 */
function HeaderSingleChat({ handleDetail }) {
  return (
    <View style={headerStyles.container}>
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
 * Main ChatScreen Component với recallMessage tích hợp.
 */
export default function ChatSingle() {
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

  // Lấy user id từ AsyncStorage.
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

  // Hàm recall message khi nhấn giữ vào tin nhắn.
  const handleRecallMessage = (message) => {
    // Chỉ cho phép recall tin nhắn của chính người dùng.
    if (message.memberId?.userId !== userId) return;

    Alert.alert("Recall Message", "Do you want to recall this message?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            // Gọi API recall message theo route DELETE đã định nghĩa:
            // router.delete("/:id/conversation/:conversationId", messageController.recallMessage)
            await axios.delete(`/api/messages/${message._id}/conversation/${CONVERSATION_ID}`);
            // Cập nhật state: đổi nội dung và type thành RECALL.
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

  // Pick Image (cho tin nhắn media)
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
      // Optionally, upload the image to the server here.
    }
  };

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
        // Expo DocumentPicker mới trả về kết quả trong assets array
        const file = result.assets[0];
        const newFileMessage = {
          _id: String(new Date().getTime()),
          memberId: { userId: CURRENT_USER_ID },
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
          memberId: { userId: CURRENT_USER_ID },
          type: "FILE",
          fileName: name,
          content: uri,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newFileMessage]);
      }
    } catch (error) {
      console.error("File picking error:", error);
      Alert.alert("Lỗi", "Không thể chọn file, vui lòng thử lại.");
    }
  };

  // function MessageItem({ msg, showAvatar, showTime }) {
  //   const [expanded, setExpanded] = useState(false);
  //   const MAX_TEXT_LENGTH = 350;
  //   const isMe = msg.memberId.userId === CURRENT_USER_ID;
  //   const isImage = msg.type === "IMAGE";

  //   const isFile = msg.type === "FILE";

  //   const getFileIcon = (fileName = "") => {
  //     const extension = fileName.split(".").pop().toLowerCase();

  //     console.log(extension);


  //     switch (extension) {
  //       case "pdf":
  //         return require("../icons/pdf.png");
  //       case "xls":
  //       case "xlsx":
  //         return require("../icons/xls.png");
  //       case "doc":
  //       case "docx":
  //         return require("../icons/doc.png");
  //       case "ppt":
  //       case "pptx":
  //         return require("../icons/ppt.png");
  //       case "txt":
  //         return require("../icons/txt.png");
  //       default:
  //         return require("../icons/fileDefault.png");
  //     }
  //   };



  //   return (
  //     <View
  //       style={[
  //         messageItemStyles.container,
  //         isMe ? messageItemStyles.rightAlign : messageItemStyles.leftAlign,
  //       ]}
  //     >
  //       {showAvatar ? (
  //         <Image source={AvatarImage} style={messageItemStyles.avatar} />
  //       ) : (
  //         <View style={messageItemStyles.avatarPlaceholder} />
  //       )}
  //       <View style={messageItemStyles.contentContainer}>
  //         {isImage ? (
  //           <Image source={{ uri: msg.content }} style={messageItemStyles.imageContent} />
  //         ) : isFile ? (
  //           // Hiển thị tin nhắn file
  //           <TouchableOpacity
  //             style={messageItemStyles.fileContainer}
  //             onPress={() => {
  //               try {
  //                 if (msg.content) {
  //                   Linking.openURL(msg.content); // Mở file khi nhấn vào
  //                 }
  //               } catch (error) {
  //                 Alert.alert("Không thể mở file", "Đã xảy ra lỗi khi mở file.");
  //               }
  //             }}
  //           >
  //             <Image source={getFileIcon(msg.fileName)} style={messageItemStyles.fileIcon} />
  //             <Text style={messageItemStyles.fileText}>
  //               {msg.fileName || "Mở File"} {/* Hiển thị tên file */}
  //             </Text>
  //           </TouchableOpacity>
  //         ) : (
  //           <Text
  //             style={[
  //               messageItemStyles.textContent,
  //               isMe ? messageItemStyles.myMessage : messageItemStyles.theirMessage,
  //             ]}
  //           >
  //             {expanded ? msg.content : msg.content.slice(0, MAX_TEXT_LENGTH)}
  //             {msg.content.length > MAX_TEXT_LENGTH && (
  //               <Text
  //                 style={messageItemStyles.expandText}
  //                 onPress={() => setExpanded(!expanded)}
  //               >
  //                 {expanded ? " Thu gọn" : " Xem thêm"}
  //               </Text>
  //             )}
  //           </Text>
  //         )}
  //         {showTime && (
  //           <Text
  //             style={[messageItemStyles.timeText, isMe && { alignSelf: "flex-end" }]}
  //           >
  //             {dayjs(msg.createdAt).fromNow()}
  //           </Text>
  //         )}
  //       </View>
  //     </View>
  //   );
  // }





  // Gửi tin nhắn text qua axios và socket.
  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    if (!userId) {
      Alert.alert("User not loaded", "Unable to send message without a valid user.");
      return;
    }

    console.log("Sending message from user:", userId);
    console.log("Message content:", message);

    try {
      // Giả sử accessToken được lưu trong AsyncStorage
      const token = await AsyncStorage.getItem("accessToken");
      const response = await axios.post("/api/messages/text", {
        conversationId: CONVERSATION_ID,
        content: message,
      });
      const newMsg = response.data;
      // Emit message đến các client khác qua socket.
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, newMsg);
    } catch (err) {
      Alert.alert("Cannot send message", err.response?.data?.message || err.message);
    }
  };

  // Lắng nghe tin nhắn đến từ socket.
  useEffect(() => {
    if (!socket) return;

    const receiveHandler = (message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
    socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, CONVERSATION_ID);

    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
      socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, CONVERSATION_ID);
    };
  }, []);

  // Seed initial messages cho mục demo.
  useEffect(() => {
    setMessages([
      {
        _id: "1",
        memberId: { userId: "user1" },
        type: "TEXT",
        content: "Hello, how are you?",
        createdAt: "2025-04-07T10:00:00Z",
      },
      {
        _id: "2",
        memberId: { userId: userId || "current_user" },
        type: "TEXT",
        content: "I'm good, thanks!",
        createdAt: "2025-04-08T10:01:00Z",
      },
    ]);
  }, [userId]);

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
