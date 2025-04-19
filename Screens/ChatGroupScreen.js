// ChatGroup.js
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
  Dimensions,
  Modal,
  Linking,
} from "react-native";
import axios from "../api/apiConfig";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Video } from "expo-av";
import { socket } from "../utils/socketClient";
import { SOCKET_EVENTS } from "../utils/constant";

dayjs.extend(relativeTime);

const screenWidth = Dimensions.get("window").width;

// Assets
const ReturnIcon = require("../icons/back.png");
const FileIcon = require("../icons/paperclip.png");
const PictureIcon = require("../icons/picture.png");
const EmojiIcon = require("../icons/emoji.png");
const SendIcon = require("../icons/send.png");
const CallIcon = require("../assets/Call.png");
const VideoCallIcon = require("../assets/VideoCall.png");
const DetailIcon = require("../icons/userdetail.png");
const DefaultAvatar = require("../Images/avt.png");

// -- Header --
function HeaderGroupChat({ conversation, onBack, onDetail }) {
  const members = conversation?.members || [];
  // Show up to 3 overlapping avatars
  return (
    <View style={headerStyles.container}>
      <TouchableOpacity onPress={onBack}>
        <Image source={ReturnIcon} style={headerStyles.backBtn} />
      </TouchableOpacity>
      <View style={headerStyles.avatarGroup}>
        {members.slice(0, 3).map((m, i) => (
          <Image
            key={i}
            source={{ uri: m.avatar }}
            style={[
              headerStyles.memberAvatar,
              { left: i *  -10, zIndex: members.length - i },
            ]}
          />
        ))}
        {!members.length && (
          <Image source={DefaultAvatar} style={headerStyles.memberAvatar} />
        )}
      </View>
      <View style={headerStyles.infoContainer}>
        <Text style={headerStyles.name}>{conversation.name || "Group Chat"}</Text>
        <Text style={headerStyles.subtitle}>
          {members.length} member{members.length !== 1 ? "s" : ""}
        </Text>
      </View>
      <View style={headerStyles.iconsContainer}>
        <TouchableOpacity onPress={() => Alert.alert("Voice call not set up yet")}>
          <Image source={CallIcon} style={headerStyles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert("Video call not set up yet")}>
          <Image source={VideoCallIcon} style={headerStyles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDetail}>
          <Image source={DetailIcon} style={headerStyles.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// -- Message bubble --
function MessageItem({ msg, currentUserId, onLongPress }) {
  const isMe = msg.memberId?.userId === currentUserId;
  const content = msg.content || "";
  const MAX = 350;
  const Container = onLongPress ? TouchableOpacity : View;

  // File icon helper
  const ext = (url) => url.split('.').pop().toLowerCase();
  const fileIcon = (url) => {
    switch (ext(url)) {
      case "pdf": return require("../icons/pdf.png");
      case "xls": case "xlsx": return require("../icons/xls.png");
      case "doc": case "docx": return require("../icons/doc.png");
      default: return require("../icons/fileDefault.png");
    }
  };

  return (
    <Container
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[styles.msgContainer, isMe ? styles.rightAlign : styles.leftAlign]}
    >
      {msg.type === "IMAGE" ? (
        <Image source={{ uri: content }} style={styles.imageContent} />
      ) : msg.type === "VIDEO" ? (
        <TouchableOpacity onPress={() => Linking.openURL(content)}>
          <Video
            source={{ uri: content }}
            style={styles.videoContent}
            useNativeControls
          />
        </TouchableOpacity>
      ) : msg.type === "FILE" ? (
        <View style={styles.fileContainer}>
          <Image source={fileIcon(content)} style={styles.fileIcon} />
          <Text style={styles.fileText}>{msg.fileName || "File"}</Text>
        </View>
      ) : (
        <Text
          style={[
            styles.textContent,
            isMe ? styles.myMessage : styles.theirMessage,
            msg.type === "RECALL" && { fontStyle: "italic", color: "#999" },
          ]}
        >
          {msg.type === "RECALL"
            ? "This message was recalled"
            : content.length > MAX
            ? content.slice(0, MAX) + "…"
            : content}
        </Text>
      )}
      <Text style={[styles.timeText, isMe && { alignSelf: "flex-end" }]}>
        {dayjs(msg.createdAt).fromNow()}
      </Text>
    </Container>
  );
}

// -- Scrollable list of messages --
function ChatBox({ messages, currentUserId, onLongPress }) {
  const ref = useRef();
  useEffect(() => {
    ref.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <ScrollView ref={ref} style={styles.chatBox} contentContainerStyle={{ padding: 8 }}>
      {messages.map((m, i) => (
        <MessageItem
          key={m._id + i}
          msg={m}
          currentUserId={currentUserId}
          onLongPress={m.memberId?.userId === currentUserId ? () => onLongPress(m) : null}
        />
      ))}
    </ScrollView>
  );
}

// -- Input bar --
function MessageInput({ text, setText, onSend, onPickMedia, onPickFile, onEmoji }) {
  const submit = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText("");
    }
  };
  return (
    <View style={styles.inputBar}>
      <TouchableOpacity onPress={onPickFile}>
        <Image source={FileIcon} style={styles.iconSmall} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onPickMedia}>
        <Image source={PictureIcon} style={styles.iconSmall} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onEmoji}>
        <Image source={EmojiIcon} style={styles.iconSmall} />
      </TouchableOpacity>
      <TextInput
        style={styles.textInput}
        placeholder="Type a message…"
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        returnKeyType="send"
      />
      <TouchableOpacity onPress={submit}>
        <Image source={SendIcon} style={styles.iconSmall} />
      </TouchableOpacity>
    </View>
  );
}

// -- Main ChatGroup --
export default function ChatGroup({ route, navigation }) {
  const { conversationId } = route.params;
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState("");
  const [text, setText] = useState("");
  // For long‑press modal
  const [selMsg, setSelMsg] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // load userId
  useEffect(() => {
    AsyncStorage.getItem("userId").then((id) => {
      if (!id) Alert.alert("Error", "No userId stored");
      else setUserId(id);
    });
  }, []);

  // fetch group info and messages
  useEffect(() => {
    if (!conversationId) return;

    axios.get(`/api/conversations/${conversationId}`)
      .then(res => setConversation(res.data))
      .catch(() => Alert.alert("Error", "Failed to load conversation"));

    axios.get(`/api/messages/${conversationId}`)
      .then(res => setMessages(res.data))
      .catch(() => Alert.alert("Error", "Failed to load messages"));
  }, [conversationId]);

  // socket listeners
  useEffect(() => {
    if (!socket || !conversationId) return;
    const onRecv = (msg) => {
      setMessages(prev => {
        // replace optimistic
        if (msg.memberId?.userId === userId) {
          const idx = prev.findIndex(m => m.pending && m.content === msg.content);
          if (idx > -1) {
            const arr = [...prev];
            arr[idx] = msg;
            return arr;
          }
        }
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };
    const onRecall = ({ messageId }) => {
      setMessages(prev =>
        prev.map(m => m._id === messageId
          ? { ...m, content: "[Recalled]", type: "RECALL" }
          : m
        )
      );
    };

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, onRecv);
    socket.on(SOCKET_EVENTS.MESSAGE_RECALLED, onRecall);
    socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, conversationId);

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, conversationId);
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, onRecv);
      socket.off(SOCKET_EVENTS.MESSAGE_RECALLED, onRecall);
    };
  }, [socket, conversationId, userId]);

  // send text
  const sendText = async (msg) => {
    const temp = {
      _id: String(Date.now()),
      memberId: { userId },
      type: "TEXT",
      content: msg,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages(prev => [...prev, temp]);
    try {
      await axios.post("/api/messages/text", { conversationId, content: msg });
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { conversationId, content: msg });
    } catch {
      Alert.alert("Error", "Failed to send");
    }
  };

  // image/video picker
  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission needed");

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (res.canceled || !res.assets.length) return;

    const file = res.assets[0];
    const uri = file.uri;
    const name = uri.split("/").pop();
    const type = file.mimeType || (file.type === "video" ? "video/mp4" : "image/jpeg");

    const form = new FormData();
    form.append("conversationId", conversationId);
    form.append(file.type === "video" ? "video" : "image", { uri, name, type });

    try {
      const { data } = await axios.post(
        file.type === "video" ? "/api/messages/video" : "/api/messages/images",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const newMsg = {
        _id: String(Date.now()),
        memberId: { userId },
        type: file.type === "video" ? "VIDEO" : "IMAGE",
        content: data.file.url,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMsg]);
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
        conversationId,
        content: newMsg.content,
        type: newMsg.type,
      });
    } catch {
      Alert.alert("Upload failed");
    }
  };

  // file picker
  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      if (res.type !== "success") return;
      const { uri, name } = res;
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) return Alert.alert("File not found");

      const form = new FormData();
      form.append("conversationId", conversationId);
      form.append("file", { uri, name, type: res.mimeType || "application/octet-stream" });

      await axios.post("/api/messages/file", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch {
      Alert.alert("Upload error");
    }
  };

  // long‑press actions
  const recallMsg = () => {
    axios.delete(`/api/messages/${selMsg._id}/conversation/${conversationId}`)
      .then(() => {
        setMessages(prev =>
          prev.map(m =>
            m._id === selMsg._id
              ? { ...m, content: "[Recalled]", type: "RECALL" }
              : m
          )
        );
        socket.emit(SOCKET_EVENTS.MESSAGE_RECALLED, {
          conversationId,
          messageId: selMsg._id,
        });
      })
      .catch(() => Alert.alert("Recall failed"));
    setMenuVisible(false);
  };
  const deleteMsg = () => {
    axios.delete(`/api/messages/${selMsg._id}/only`, {
      data: { conversationId },
    })
      .then(() => {
        setMessages(prev => prev.filter(m => m._id !== selMsg._id));
      })
      .catch(() => Alert.alert("Delete failed"));
    setMenuVisible(false);
  };
  const forwardMsg = () => {
    // reuse your forward logic…
    setMenuVisible(false);
  };

  return (
    <View style={styles.screen}>
      <HeaderGroupChat
        conversation={conversation || {}}
        onBack={() => navigation.goBack()}
        onDetail={() => navigation.navigate("GroupDetail", { conversationId })}
      />
      <ChatBox
        messages={messages}
        currentUserId={userId}
        onLongPress={(m) => {
          setSelMsg(m);
          setMenuVisible(true);
        }}
      />
      <MessageInput
        text={text}
        setText={setText}
        onSend={sendText}
        onPickMedia={pickMedia}
        onPickFile={pickFile}
        onEmoji={() => Alert.alert("Emoji picker")}
      />

      {/* Long-press menu */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
        >
          <View style={styles.menu}>
            <TouchableOpacity onPress={recallMsg}>
              <Text style={styles.menuText}>Recall</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteMsg}>
              <Text style={styles.menuText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={forwardMsg}>
              <Text style={styles.menuText}>Forward</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// -- Styles --
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  chatBox: { flex: 1, backgroundColor: "#F6F6F6" },
  msgContainer: {
    marginVertical: 4,
    maxWidth: screenWidth * 0.75,
    padding: 10,
    borderRadius: 8,
  },
  leftAlign: { alignSelf: "flex-start", backgroundColor: "#eee" },
  rightAlign: { alignSelf: "flex-end", backgroundColor: "#c7eaff" },
  textContent: { fontSize: 14, color: "#000" },
  myMessage: {},
  theirMessage: {},
  timeText: { fontSize: 10, color: "#666", marginTop: 4 },
  imageContent: { width: 200, height: 200, borderRadius: 8 },
  videoContent: { width: 200, height: 200, borderRadius: 8 },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#eff8ff",
    borderRadius: 8,
  },
  fileIcon: { width: 32, height: 32, marginRight: 8 },
  fileText: { color: "#086DC0" },
  inputBar: {
    flexDirection: "row",
    padding: 8,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  iconSmall: { width: 24, height: 24, marginHorizontal: 6 },
  textInput: { flex: 1, fontSize: 16, padding: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: "70%",
  },
  menuText: {
    fontSize: 16,
    paddingVertical: 8,
    color: "#086DC0",
  },
});

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  backBtn: { width: 32, height: 32 },
  avatarGroup: {
    flexDirection: "row",
    marginLeft: 10,
    width: 50,
    height: 50,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "absolute",
    borderWidth: 2,
    borderColor: "#fff",
  },
  infoContainer: { flex: 1, marginLeft: 10 },
  name: { fontSize: 18, fontWeight: "bold" },
  subtitle: { fontSize: 12, color: "#666" },
  iconsContainer: { flexDirection: "row" },
  icon: { width: 24, height: 24, marginHorizontal: 6 },
});
