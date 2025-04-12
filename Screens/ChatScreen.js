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
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import EmojiPicker from "rn-emoji-keyboard";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

// ICONS / IMAGES
const AvatarImage = require("../Images/avt.png");
const CallIcon = require("../assets/Call.png");
const VideoCallIcon = require("../assets/VideoCall.png");
const DetailChatIcon = require("../icons/userdetail.png");
const FileIcon = require("../icons/paperclip.png");
const PictureIcon = require("../icons/picture.png");
const EmojiIcon = require("../icons/emoji.png");
const SendIcon = require("../icons/send.png");

const screenWidth = Dimensions.get("window").width;
const CURRENT_USER_ID = "current_user_id";

function MessageItem({ msg, showAvatar, showTime }) {
  const [expanded, setExpanded] = useState(false);
  const MAX_TEXT_LENGTH = 350;
  const isMe = msg.memberId.userId === CURRENT_USER_ID;
  const isImage = msg.type === "IMAGE";
  const isFile = msg.type === "FILE";

  return (
    <View
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
        {isImage ? (
          <Image source={{ uri: msg.content }} style={messageItemStyles.imageContent} />
        ) : isFile ? (
          <TouchableOpacity
            style={messageItemStyles.fileContainer}
            onPress={() => {
              try {
                if (msg.content) {
                  Linking.openURL(msg.content);
                }
              } catch (error) {
                Alert.alert("Không thể mở file", "Đã xảy ra lỗi khi mở file.");
              }
            }}
          >
            <Image source={FileIcon} style={messageItemStyles.fileIcon} />
            <Text style={messageItemStyles.fileText}>
              {msg.fileName || "Mở File"}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text
            style={[
              messageItemStyles.textContent,
              isMe ? messageItemStyles.myMessage : messageItemStyles.theirMessage,
            ]}
          >
            {expanded ? msg.content : msg.content.slice(0, MAX_TEXT_LENGTH)}
            {msg.content.length > MAX_TEXT_LENGTH && (
              <Text
                style={messageItemStyles.expandText}
                onPress={() => setExpanded(!expanded)}
              >
                {expanded ? " Thu gọn" : " Xem thêm"}
              </Text>
            )}
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
    </View>
  );
}

const messageItemStyles = StyleSheet.create({
  container: { flexDirection: "row", marginVertical: 4, alignItems: "flex-end" },
  leftAlign: { justifyContent: "flex-start" },
  rightAlign: { flexDirection: "row-reverse" },
  avatar: { width: 40, height: 40, borderRadius: 20},
  avatarPlaceholder: { width: 40, height: 40 },
  contentContainer: { maxWidth: 468, marginHorizontal: 8 },
  imageContent: {
    width: 250,
    height: 250,
    borderRadius: 8,
    resizeMode: "cover",
  },
  fileContainer: {
    padding: 10,
    backgroundColor: "#EFF8FF",
    borderRadius: 12,
    alignItems: "center",
  },
  fileIcon: {
    width: 48,
    height: 48,
    tintColor: "#086DC0",
  },
  fileText: {
    marginTop: 4,
    color: "#086DC0",
    fontSize: 14,
    textDecorationLine: "underline",
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
  expandText: { color: "#086DC0" },
  timeText: { fontSize: 10, color: "#959595", marginTop: 4 },
});

function ChatBox({ messages }) {
  const scrollViewRef = useRef(null);
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={chatBoxStyles.container}
      contentContainerStyle={chatBoxStyles.contentContainer}
    >
      {messages.map((msg, index) => {
        const isFirstInGroup =
          index === 0 || messages[index - 1].memberId.userId !== msg.memberId.userId;
        const isLastInGroup =
          index === messages.length - 1 || messages[index + 1].memberId.userId !== msg.memberId.userId;

        return (
          <MessageItem
            key={msg._id || index}
            msg={msg}
            showAvatar={isFirstInGroup}
            showTime={isLastInGroup}
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

export default function ChatSingle() {
  const conversationId = "67ee2539dc14e5903dc8b4ce";
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "We need permission to access your gallery!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      const newImageMessage = {
        _id: String(new Date().getTime()),
        memberId: { userId: CURRENT_USER_ID },
        type: "IMAGE",
        content: selectedImage.uri,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newImageMessage]);
    }
  };

  // const pickDocument = async () => {
  //   try {
  //     const result = await DocumentPicker.getDocumentAsync({
  //       type: "*/*",
  //       copyToCacheDirectory: true,
  //       multiple: false,
  //     });

  //     if (result.type === "success") {
  //       const { name, uri } = result;

  //       const newFileMessage = {
  //         _id: String(new Date().getTime()),
  //         memberId: { userId: CURRENT_USER_ID },
  //         type: "FILE",
  //         fileName: name,
  //         content: uri,
  //         createdAt: new Date().toISOString(),
  //       };

  //       setMessages((prev) => [...prev, newFileMessage]);
  //     }
  //   } catch (error) {
  //     console.error("File picking error:", error);
  //   }
  // };

  const handleSendMessage = (message) => {
    if (!message.trim()) return;
    const newMsg = {
      _id: String(new Date().getTime()),
      memberId: { userId: CURRENT_USER_ID },
      type: "TEXT",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  useEffect(() => {
    setMessages([
      {
        _id: "1",
        memberId: { userId: "user1" },
        type: "TEXT",
        content: "Qua cam khong?",
        createdAt: "2025-04-07T10:00:00Z",
      },
      {
        _id: "2",
        memberId: { userId: CURRENT_USER_ID },
        type: "TEXT",
        content: "Riêng m",
        createdAt: "2025-04-08T10:01:00Z",
      },
    ]);
  }, [conversationId]);

  return (
    <View style={chatScreenStyles.container}>
      <HeaderSingleChat />
      <View style={chatScreenStyles.chatContainer}>
        <ChatBox messages={messages} />
      </View>
      <MessageInput
        input={input}
        setInput={setInput}
        onSend={handleSendMessage}
        onPickImage={pickImage}
        // onPickFile={pickDocument}
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
