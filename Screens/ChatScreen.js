import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
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
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  SafeAreaView,
  Animated,
  Easing
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
import { Audio } from "expo-av";


const urlRegex = /(https?:\/\/[^\s]+)/g;

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



// Messenger-style constants
const BUBBLE_WIDTH = 220;
const LINE_WIDTH = 140; // Adjust for duration/spacing
const LINE_HEIGHT = 3;
const BUTTON_SIZE = 40;

export function AudioBubble({ url}) {
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [position, setPosition] = useState(0);
  const [durationSec, setDurationSec] = useState(0); 

  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
  let mounted = true;
  let loader;

  async function loadMetadata() {
    // create the Sound, but don’t start playing
    const { sound: s, status } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: false }
    );
    if (!mounted) {
      return s.unloadAsync();
    }
    if (status.durationMillis) {
      setDurationSec(status.durationMillis / 1000);
    }
    // we don’t need to keep it loaded until play
    await s.unloadAsync();
  }

  loadMetadata();

  return () => {
    mounted = false;
  };
}, [url]);


  // Clean up sound when unmount
  React.useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const playAudio = async () => {
    if (sound) {
      await sound.replayAsync();
      setPlaying(true);
      animateButton(0, 1, durationSec);
      return;
    }
     const { sound: snd, status } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true }
    );
    setSound(snd);
    setPlaying(true);

    if (status.durationMillis) {
      setDurationSec(status.durationMillis / 1000);
    }

    animateButton(0, 1, (status.durationMillis || 0) / 1000);

    snd.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        setPlaying(false);
        animated.setValue(0);
      }
    });
  };

  const pauseAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setPlaying(false);
      Animated.timing(animated).stop();
    }
  };

  const animateButton = (from, to, dur) => {
    animated.setValue(from);
    Animated.timing(animated, {
      toValue: to,
      duration: dur * 1000,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start();
  };

  // Position for button
  const translateX = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [0, LINE_WIDTH],
  });

  const shownDuration = (() => {
    const total = Math.round(durationSec);
    const m = Math.floor(total/60).toString().padStart(2,'0');
    const s = (total%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  })();

  return (
    <View style={audioStyles.bubble}>
      <View style={audioStyles.inner}>
        {/* Audio Line and Play Button */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: LINE_WIDTH + BUTTON_SIZE, height: BUTTON_SIZE, justifyContent: "center" }}>
            {/* The Line */}
            <View
              style={{
                position: "absolute",
                left: BUTTON_SIZE / 2,
                top: BUTTON_SIZE / 2 - LINE_HEIGHT / 2,
                width: LINE_WIDTH,
                height: LINE_HEIGHT,
                backgroundColor: "#369CFF",
                borderRadius: 2,
                opacity: 0.8,
              }}
            />
            {/* Play Button (moves along the line) */}
            <Animated.View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: [{ translateX }],
                zIndex: 2,
              }}
            >
              <TouchableOpacity
                onPress={playing ? pauseAudio : playAudio}
                activeOpacity={0.8}
                style={{
                  width: BUTTON_SIZE,
                  height: BUTTON_SIZE,
                  backgroundColor: "#2380F7",
                  borderRadius: BUTTON_SIZE / 2,
                  justifyContent: "center",
                  alignItems: "center",
                  elevation: 2,
                  shadowColor: "#2380F7",
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                }}
              >
                <View style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 16,
                  borderTopWidth: 11,
                  borderBottomWidth: 11,
                  borderLeftColor: "#fff",
                  borderTopColor: "transparent",
                  borderBottomColor: "transparent",
                  marginLeft: 3,
                }} />
              </TouchableOpacity>
            </Animated.View>
          </View>
          {/* Timer */}
          <Text style={{
            marginLeft: 8,
            color: "#444",
            fontWeight: "100",
            fontSize: 10,
            alignSelf: "center",
            minWidth: 28,
          }}>
            {shownDuration}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Style
const audioStyles = StyleSheet.create({
  bubble: {
    backgroundColor: "#D8F1FF",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 2,
    minWidth: 160,
    maxWidth: 270,
    alignSelf: "flex-start",
    // Optional shadow
    shadowColor: "#51b8ff",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
  },
});


function renderTextWithLinks(content, onInvitePress) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const inviteLinkRegex = /(https?:\/\/[^\s]+\/join\/[a-f0-9]+)/g;

  const parts = content.split(urlRegex);

  return parts.map((part, i) => {
    if (inviteLinkRegex.test(part)) {
      return (
        <TouchableOpacity
          key={i}
          style={{
            backgroundColor: "#4285f4",
            borderRadius: 6,
            paddingVertical: 5,
            paddingHorizontal: 16,
            alignSelf: "flex-start",
          }}
            onPress={() => {
      console.log('[InviteLink] User pressed invite link:', part);
      onInvitePress && onInvitePress(part);
    }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>
            Group invitation
          </Text>
        </TouchableOpacity>
      );
    } else if (urlRegex.test(part)) {
      return (
        <Text
          key={i}
          style={[messageItemStyles.textContent, messageItemStyles.linkText]}
          onPress={() => Linking.openURL(part).catch(() => Alert.alert('Error', 'Cannot open link'))}
        >
          {part}
        </Text>
      );
    } else {
      return (
        <Text key={i} style={messageItemStyles.textContent}>
          {part}
        </Text>
      );
    }
  });
}


/**
 * Message Bubble Component with support for onLongPress to show message options.
 */
const MessageItem = forwardRef(function MessageItem(
  props,
  ref
) {
  const {
    msg,
    showAvatar,
    showTime,
    currentUserId,
    onLongPress,
    currentUserAvatar,
    otherUserAvatar,
    allMessages,
    onReplyPress,
    handlePressEmoji,
    onMediaLoad,
  } = props;



  

const [imgLoading, setImgLoading] = useState(true);

  const navigation = useNavigation();
  const [recordingModal, setRecordingModal] = useState(false);
  const audioExtensions = ['mp3', 'wav', 'aac', 'ogg', 'm4a'];

const isAudioFile = (fileName = '', url = '') => {
  // Simple extension check (could enhance with mimetype if you have it)
  const name = (fileName || url).toLowerCase();
  return audioExtensions.some(ext => name.endsWith(`.${ext}`));
};


  const downloadFile = async (url, fileName = 'downloaded_file') => {
  try {
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      FileSystem.documentDirectory + fileName
    );

    const { uri } = await downloadResumable.downloadAsync();
    Alert.alert("Success", `File downloaded to:\n${uri}`);
  } catch (error) {
    console.error("Download error:", error);
    Alert.alert("Error", "Failed to download the file.");
  }
};


  const isMe = msg.memberId?.userId === currentUserId;
  const content = msg.content || "";
  const MAX_TEXT_LENGTH = 350;
      const emojiMap = {
        1: '❤️',
        2: '😂',
        3: '😢',
        4: '👍',
        5: '👎',
        6: '😮',
    };
  const innerRef = useRef();

  useImperativeHandle(ref, () => ({
    measureLayout: (...args) => {
      if (innerRef.current?.measureLayout) {
        innerRef.current.measureLayout(...args);
      }
    },
  }));


  const repliedMsg = msg.replyMessageId
  ? allMessages.find(m => m._id === msg.replyMessageId)
  : null;


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
    if (msg.type === "NOTIFY") {
    return (
      <View style={messageItemStyles.notifyContainer}>
        <Text style={messageItemStyles.notifyText}>
          {msg.content}
        </Text>
      </View>
    );
  }

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

const Container = onLongPress ? TouchableOpacity : View;

  return (
     <Container
       onLongPress={onLongPress}
       activeOpacity={0.7}
     >
        <View
        ref={innerRef}
         style={[
           messageItemStyles.container,
           msg.memberId.userId === currentUserId
             ? messageItemStyles.rightAlign
             : messageItemStyles.leftAlign,
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
        {msg.isPinned && (
  <View style={messageItemStyles.pinnedContainer}>

    <Text style={messageItemStyles.pinnedLabel}> 📌  Pinned</Text>
  </View>
)}

        {repliedMsg && (
          // wrap the quote in its own TouchableOpacity
          <TouchableOpacity
            style={messageItemStyles.replyContainer}
            onPress={() => onReplyPress(repliedMsg._id)}
            onLongPress={() => { /* swallow longPress here */ }}
          >
            <Text style={messageItemStyles.replyAuthor}>
              {repliedMsg.memberId.name || "Unknown"}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={messageItemStyles.replySnippet}
            >
              {repliedMsg.content}
            </Text>
          </TouchableOpacity>
        )}


{msg.replyTo && (
  <View style={messageItemStyles.replyContainer}>
    {/* optional arrow icon */}
    <Image
      source={require("../icons/arrow.png")}
      style={messageItemStyles.replyIcon}
    />
    <View style={messageItemStyles.replyTextContainer}>
      <Text style={messageItemStyles.replyAuthor}>
        {msg.replyTo.memberId.userName || "Unknown"}
      </Text>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={messageItemStyles.replySnippet}
      >
        {msg.replyTo.content}
      </Text>
    </View>
  </View>
)}

        
{msg.type === "IMAGE" ? (
 <View style={{ position: "relative" }}
  
 >
  <TouchableOpacity
     style={{ position: "relative" }}
     activeOpacity={0.8}
     onPress={() =>
       navigation.navigate("FullScreenImage", { uri: msg.content })
     }
     onLongPress={onLongPress}
   >
  <Image
    source={{ uri: msg.content }}
    style={messageItemStyles.imageContent}
    onLoadStart={() => setImgLoading(true)}
    onLoadEnd={() => {
      setImgLoading(false);
      onMediaLoad?.();
    }}
  />
  {imgLoading && (
    <View style={messageItemStyles.imageOverlay}>
      <ActivityIndicator size="small" color="#086DC0" />
    </View>
  )}
  </TouchableOpacity>
</View>


        ) : msg.type === "VIDEO" ? (
          <Video
            source={{ uri: content }}
            style={messageItemStyles.videoContent}
            useNativeControls
            resizeMode="cover"
            isLooping={false}
             onLoad={() => onMediaLoad?.()}
          />
          ) : msg.type === "FILE" && isAudioFile(msg.fileName, msg.content) ? (
         <AudioBubble url={msg.content} />
        ) : msg.type === "FILE" ? (
<TouchableOpacity
  style={messageItemStyles.fileContainer}
  onPress={() => downloadFile(msg.content, msg.fileName)}
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
     : renderTextWithLinks(content, props.onInvitePress)
  }
</Text>
        )}
         {msg.reacts && msg.reacts.length > 0 && (
                            <TouchableOpacity
                                style={messageItemStyles.reactContainer}
                                onPress={() => handlePressEmoji(msg)}
                            >
                                {msg.reacts.map((react, idx) => {
                                    const emoji = emojiMap[react.type];
                                    return emoji ? (
                                        <Text key={idx} style={messageItemStyles.emojiText}>
                                            {emoji}
                                        </Text>
                                    ) : null;
                                })}
                                <Text style={messageItemStyles.reactCount}>
                                    {msg.reacts.length}
                                </Text>
                            </TouchableOpacity>
                        )}
        {showTime && (
          <Text style={[messageItemStyles.timeText, isMe && { alignSelf: "flex-end" }]}>
            {dayjs(msg.createdAt).fromNow()}
          </Text>
        )}
      </View>
      </View>
    </Container>
  );
}

);
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
  contentContainer: {  maxWidth: screenWidth * 0.8, marginHorizontal: 8, },
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
  flexWrap: "wrap",
  flexShrink: 1,       // <-- this lets it shrink rather than overflow
},
imageOverlay: {
  ...StyleSheet.absoluteFillObject,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#F0F0F0",
  borderRadius: 8,
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
  replyContainer: {
  backgroundColor: "#E6E6FA",
  padding: 8,
  borderLeftWidth: 4,
  borderLeftColor: "#086DC0",
  borderRadius: 6,
  marginBottom: 4,
},
  linkText: {
    color: '#086DC0',
    textDecorationLine: 'underline',
  },
replyAuthor: {
  fontSize: 12,
  fontWeight: "bold",
  color: "#086DC0",
  marginBottom: 2,
},

replySnippet: {
  fontSize: 13,
  color: "#333",
},

replyTextContainer: {
  flex: 1,
},
  notifyContainer: {
    alignSelf: "center",        // push it into the middle
    backgroundColor: "#ECECEC", // light grey pill
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 10,
    maxWidth: "80%",
  },
  notifyText: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
    fontStyle:'italic'
  },
      reactContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginTop: 5,
        alignSelf: 'flex-start',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    emojiText: {
        fontSize: 16,
        marginRight: 2,
    },
    reactCount: {
        fontSize: 12,
        marginLeft: 4,
        color: '#666',
    },
    pinnedLabel: {
  fontSize: 12,
  color: "#FF2D55",  // or any strong color
  marginBottom: 4,
  fontWeight: "bold",
},
pinnedContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 4,
  gap: 4, // spacing between icon and text
},

pinIcon: {
  width: 14,
  height: 14,
  resizeMode: 'contain',
  tintColor: '#FF2D55', // optional: to match your UI theme
},

pinnedLabel: {
  fontSize: 12,
  color: "#FF2D55",
  fontWeight: "bold",
},


});

/**
 * ChatBox Component to render a scrollable list of messages.
 */
function ChatBox({
  messages,
  currentUserId,
  currentUserAvatar,
  otherUserAvatar,
  onMessageLongPress,
  handlePressEmoji,
  loadMoreMessages,
  loadingMore,
  allMessages, 
  scrollToMessageId,
    onInvitePress, 
}) {


 const lastIdRef = useRef(messages[messages.length - 1]?._id);
const prevLengthRef = useRef(0);
  const scrollViewRef = useRef(null);
  const messageRefs    = useRef({});

// helper to jump:
const scrollToMessage = useCallback((messageId) => {
  const item = messageRefs.current[messageId];
  if (!item || !scrollViewRef.current) return;

  if (item.measureLayout) {
    item.measureLayout(
      scrollViewRef.current, 
      (x, y) => scrollViewRef.current.scrollTo({ y: y - 20, animated: true }),
      () => {}
    );
  } else {
    console.warn("Ref missing measureLayout for messageId:", messageId);
  }
}, []);


   useEffect(() => {
    if (scrollToMessageId && messages.length) {
      // give the list a frame to render
      setTimeout(() => scrollToMessage(scrollToMessageId), 50);
    }
  }, [scrollToMessageId, messages]);
  
  useEffect(() => {
  const newLastId = messages[messages.length - 1]?._id;

  // scroll only when a brand-new message is at the bottom
  if (newLastId && newLastId !== lastIdRef.current) {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }

  lastIdRef.current = newLastId;
  }, [messages]);

  return (
    
<ScrollView
  style={chatBoxStyles.container}
  contentContainerStyle={chatBoxStyles.contentContainer}
  ref={scrollViewRef}
  onScroll={({ nativeEvent }) => {
    if (nativeEvent.contentOffset.y <= 50) {
      loadMoreMessages();
    }
  }}
  scrollEventThrottle={100}

  onContentSizeChange={() => {
   if (scrollToMessageId) {
     // once the content has rendered, fire your scroll
     scrollToMessage(scrollToMessageId);
   }
 }}
>
    {loadingMore && (
    <ActivityIndicator
      size="small"
      color="#086DC0"
      style={{ marginBottom: 8 }}
    />
  )}

      {messages.map((msg, index) => {
        const userId = msg.memberId?.userId || "";
        const prevMsg = messages[index - 1];
        const prevId = prevMsg?.memberId?.userId || "";
        const nextId = messages[index + 1]?.memberId?.userId || "";
        const isLastInGroup = index === messages.length - 1 || nextId !== userId;
        const key = `${msg._id}-${index}`;

        const isFirstInGroup =
  index === 0 ||
  prevId !== userId ||
  prevMsg?.type === "NOTIFY";

        return (
        <MessageItem
            key={msg._id}
          ref={ref => (messageRefs.current[msg._id] = ref)}
          msg={msg}
            allMessages={allMessages}
          showAvatar={isFirstInGroup}
          showTime={isLastInGroup}
          currentUserId={currentUserId}
          currentUserAvatar={currentUserAvatar}
           otherUserAvatar={otherUserAvatar}
onLongPress={() => onMessageLongPress(msg)}
        onReplyPress={scrollToMessage}
          onInvitePress={onInvitePress}

        handlePressEmoji={handlePressEmoji}
         onMediaLoad={() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100); // slight delay to allow layout to recalculate
  }}
          
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
function MessageInput({ input, setInput, onSend, onPickMedia, onPickFile, onEmojiPress, onStartRecording}) {
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
          numberOfLines={1}
        />
        <TouchableOpacity style={messageInputStyles.iconButton}  onPress={onStartRecording}
>
          <Image source={require('../icons/mic.png')} style={messageInputStyles.icon} />
        </TouchableOpacity>
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
    marginBottom:20
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
        <Text style={headerStyles.name} numberOfLines={1}>
  {other?.name}
</Text>

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
  avatar: { width: 45, height: 45, borderRadius: 35 },
  infoContainer: { marginLeft: 12, flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#086DC0" },
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
  const [channelsList, setChannelsList] = useState([]);
const [inviteModalVisible, setInviteModalVisible] = useState(false);
const [inviteInfo, setInviteInfo] = useState(null);
const [inviteLoading, setInviteLoading] = useState(false);
const [inviteError, setInviteError] = useState(null);
const [joining, setJoining] = useState(false);
const [joinError, setJoinError] = useState(null);

const [recording, setRecording] = useState(null);
const [recordingModal, setRecordingModal] = useState(false);
const [recordedUri, setRecordedUri] = useState(null);
const [recordingDuration, setRecordingDuration] = useState(0);
const [isRecording, setIsRecording] = useState(false);
const [playing, setPlaying] = useState(false);
const [sound, setSound] = useState(null);

  
      const [selectedReactors, setSelectedReactors] = useState([]);
      const [reactDetailModalVisible, setReactDetailModalVisible] = useState(false);
const [userId, setUserId] = useState(null);
  const { conversation, scrollToMessageId } = route.params;
  const conversationId = conversation._id;
const [conversationsList, setConversationsList] = useState([]);
const [uploading, setUploading] = useState(false);

const [userIdReady, setUserIdReady] = useState(false);
const [replyTo, setReplyTo] = useState(null);
const [pinnedMessages, setPinnedMessages] = useState([]);

const [inviteToken, setInviteToken] = useState('');


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


const [loadingMore, setLoadingMore] = useState(false);


const [allMessages, setAllMessages] = useState([]);

const [pagination, setPagination] = useState({ skip: 0, limit: 20 });
const [hasMore, setHasMore] = useState(true);

const handleShowInviteModal = async (inviteLink) => {
  // Example link: https://dora.chat/join/8a379855
const match = inviteLink.match(/\/join\/([a-f0-9]+)/);
if (!match) return;
const token = match[1];
setInviteToken(token); // <--- Save it!
setInviteModalVisible(true);
setInviteLoading(true);
setInviteError(null);

  
  console.log("[Invite] Opening invite modal for token:", token, "from link:", inviteLink);

  try {
    const res = await axios.get(`/api/conversations/invite/${token}`);
    console.log("[Invite] Invite info fetched:", res.data);
    setInviteInfo(res.data);
  } catch (e) {
    console.log("[Invite] Failed to fetch invite info:", e.response?.data || e);
    setInviteError(e.response?.data?.message || e.message);
    setInviteInfo(null);
  } finally {
    setInviteLoading(false);
  }
};

const startRecording = async () => {
  try {
    if (recording) {
      // Try to stop previous recording if it exists
      try {
        await recording.stopAndUnloadAsync();
      } catch (e) {
        // Already stopped, do nothing
      }
      setRecording(null); // Clear out previous
    }

    const permission = await Audio.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission required', 'Please grant audio permission');
      return;
    }

    setRecordingModal(true);
    setRecordedUri(null);
    setRecordingDuration(0);

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // DOUBLE-CHECK: If any previous recording, do NOT proceed
    if (recording) {
      return; // Defensive: should never happen
    }

    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(newRecording);
    setIsRecording(true);

    newRecording.setOnRecordingStatusUpdate(status => {
      if (status.isRecording) setRecordingDuration(Math.floor(status.durationMillis / 1000));
    });
  } catch (err) {
    console.error(err);
    Alert.alert('Lỗi', err.message || 'Không thể bắt đầu ghi âm.');
  }
};

const stopRecording = async () => {
  if (!recording) return;
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordedUri(uri);
  } catch (e) {
    // Already stopped or error
  } finally {
    setIsRecording(false);
    setRecording(null);
  }
};





const resetRecording = () => {
  setRecording(null);
  setRecordedUri(null);
  setRecordingModal(false);
  setRecordingDuration(0);
  setIsRecording(false);
};

const playRecording = async () => {
  if (!recordedUri) return;
  const { sound } = await Audio.Sound.createAsync({ uri: recordedUri });
  setSound(sound);
  setPlaying(true);
  sound.playAsync();
  sound.setOnPlaybackStatusUpdate(status => {
    if (status.didJustFinish) {
      setPlaying(false);
      sound.unloadAsync();
    }
  });
};

const sendRecording = async () => {
  if (!recordedUri) {
    console.log("[Audio] No recorded URI!");
    return;
  }
  setRecordingModal(false);
  const fileName = `audio_${Date.now()}.aac`;

  // Log out the URI and fileName for debugging
  console.log("[Audio] Preparing to upload file:", recordedUri, "as", fileName);

  const formData = new FormData();
  formData.append("id", userId);
  formData.append("conversationId", conversationId);
  formData.append("file", {
    uri: recordedUri,
    name: fileName,
    type: "audio/aac",
  });

  // Log out the FormData for debugging (works only in Chrome debugger, not in Hermes)
  // This will print FormData keys, not values. It's a limitation of React Native.
  for (let [key, value] of formData._parts || []) {
    console.log(`[Audio] FormData field: ${key}`, value);
  }

  try {
    console.log("[Audio] Sending POST /api/messages/file...");
    await axios.post("/api/messages/file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 20000,
    });
    console.log("[Audio] Upload successful!");
    resetRecording();
  } catch (error) {
    // Axios error can have response, request, or message
    if (error.response) {
      console.error("[Audio] Axios upload failed – response error:", error.response.data);
    } else if (error.request) {
      console.error("[Audio] Axios upload failed – request error:", error.request);
    } else {
      console.error("[Audio] Axios upload failed – unknown error:", error.message);
    }
    Alert.alert("Gửi thất bại", "Không gửi được bản ghi âm.");
    resetRecording();
  }
};



  const handlePinSocket = useCallback(({ conversationId: convId, messageId }) => {
    if (convId !== conversationId) return;
    // update pinnedMessages list
    setPinnedMessages(prev => [...prev, { messageId }]);
    // mark that message is pinned in your message list
    setMessages(prev =>
      prev.map(m => m._id === messageId
        ? { ...m, isPinned: true }
        : m
      )
    );
  }, [conversationId]); 

    const handleUnpinSocket = useCallback(({ conversationId: convId, messageId }) => {
    if (convId !== conversationId) return;
    // remove from pinnedMessages
    setPinnedMessages(prev => prev.filter(p => p.messageId !== messageId));
    // mark that message is no longer pinned
    setMessages(prev =>
      prev.map(m => m._id === messageId
        ? { ...m, isPinned: false }
        : m
      )
    );
  }, [conversationId]);

useEffect(() => {
  const fetchPinnedMessages = async () => {
    try {
      const response = await axios.get(`/api/pin-messages/${conversationId}`);
      const pinned = response.data || [];

      setPinnedMessages(pinned);

      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          isPinned: pinned.some((pin) => pin.messageId === msg._id),
        }))
      );
    } catch (err) {
      console.error("❌ Failed to fetch pinned messages:", err);
    }
  };

  if (conversationId) {
    fetchPinnedMessages();
  }
}, [conversationId]);

const handlePinMessages = async (message) => {
  if (!message) return;

  try {
    console.log("📌 Attempting to pin message:", message);

    // ✅ Get memberId from backend (to avoid relying on potentially stale UI state)
    const memberRes = await axios.get(`/api/members/${conversationId}/${userId}`);
    const memberId = memberRes.data.data?._id;

    const payload = {
      messageId: message._id,
      conversationId: message.conversationId,
       pinnedBy: message.memberId._id, // ✅ safest
    };

    console.log("📦 Sending pin payload:", payload);

    await axios.post("/api/pin-messages", payload);

    const refreshed = await handlePinnedMessages();

    socket.emit(SOCKET_EVENTS.PIN_MESSAGE, {
  conversationId,
  messageId: message._id,
});
    setPinnedMessages(refreshed);
    // Update UI
setMessages((prevMessages) =>
  prevMessages.map((msg) =>
    refreshed.some((p) => p.messageId === msg._id)
      ? { ...msg, isPinned: true }
      : msg

      
  )
  
);
  } catch (err) {
    console.error("❌ Error during pin request:", err);

  }
};
const handleUnpinMessage = async (message) => {
  if (!message || !message._id || !userId) {

    return;
  }

  try {
    // Step 1: Fetch memberId (_id) for current user
    const res = await axios.get(`/api/members/${conversationId}/${userId}`);
    const memberId = res.data?.data?._id;

    

    if (!memberId) throw new Error("Không tìm thấy thành viên.");

    console.log("🔎 message.pinnedBy:", message.pinnedBy, "→ type:", typeof message.pinnedBy);
console.log("🔎 Your memberId:", memberId);


    // Step 2: Check if this user is the one who pinned the message
const pinEntry = pinnedMessages.find((p) => p.messageId === message._id);
const pinnedById = pinEntry?.pinnedBy?._id || pinEntry?.pinnedBy || null;

if (!pinnedById || pinnedById !== memberId) {

  return;
}


    // Step 3: Proceed to unpin
    await axios.delete(`/api/pin-messages/${message._id}/${memberId}`);

    // Step 4: Refresh UI
    const refreshed = await handlePinnedMessages();
    socket.emit(SOCKET_EVENTS.UNPIN_MESSAGE, {
  conversationId,
  messageId: message._id,
});
    setPinnedMessages(refreshed);

    setMessages((prev) =>
      prev.map((msg) =>
        refreshed.some((p) => p.messageId === msg._id)
          ? { ...msg, isPinned: true }
          : { ...msg, isPinned: false }
      )
    );


  } catch (err) {
    console.error("❌ Error unpinning message:", err);
    Alert.alert("Lỗi", err.response?.data?.message || "Không thể bỏ ghim.");
  }
};


    const handlePinnedMessages = async () => {
        try {
            const response = await axios.get(`/api/pin-messages/${conversationId}`);
            return response.data;
        } catch (err) {
            console.log(err);
            return [];
        }
    };

const loadMoreMessages = async () => {
  if (loadingMore || !hasMore) return;

  setLoadingMore(true);
  try {
    const { skip, limit } = pagination;
    const newSkip = Math.max(0, skip - limit);
    const more = allMessages.slice(newSkip, skip); // fetch the older batch

    if (more.length === 0) {
      setHasMore(false);
    } else {
      setMessages((prev) => [...more, ...prev]);
      setPagination({ skip: newSkip, limit });
    }
  } catch (error) {
    console.error("Error loading more messages:", error);
  } finally {
    setLoadingMore(false);
  }
};

    const emojiToType = {
        '❤️': 1,
        '😂': 2,
        '😢': 3,
        '👍': 4,
        '👎': 5,
        '😮': 6,
    };
const handleGetMember = async (memberId) => {
  console.log("🔍 currentUser:", currentUser?._id, "otherUser:", otherUser?._id, "looking for:", memberId);

  // 1) If it’s you
  if (currentUser && currentUser._id === memberId) {
    return { name: currentUser.name, avatar: currentUser.avatar };
  }

  // 2) If it’s the other chat partner
  if (otherUser && otherUser._id === memberId) {
    return { name: otherUser.name, avatar: otherUser.avatar };
  }

  // 3) Fallback: fetch any other user by their Mongo _id
  try {
    const data = await UserService.getUserById(memberId);
    console.log("✅ Fetched fallback user:", data);
    return { name: data.name, avatar: data.avatar };
  } catch (err) {
    console.error("❌ Failed to fetch fallback user:", err);
    return { name: "Unknown", avatar: null };
  }
};




    
const handlePressEmoji = async (msg) => {
  try {
    const reactors = await Promise.all(
      msg.reacts.map(async (react) => {
        // Step 1: Extract the memberId
        const memberId = typeof react.memberId === "object"
          ? react.memberId._id
          : react.memberId;

        // Step 2: Lookup in conversation.members to find userId
        const matchedMember = conversation.members.find(
          (m) => m._id === memberId
        );

        const userId = matchedMember?.userId;

        if (!userId) {
          console.warn("❌ Cannot find userId for memberId:", memberId);
          return {
            name: "Unknown",
            avatar: null,
            type: react.type,
          };
        }

        // Step 3: Try fetching full user data from userId
        try {
          const user = await UserService.getUserById(userId);
          return {
            name: user.name,
            avatar: user.avatar,
            type: react.type,
          };
        } catch (err) {
          console.warn("❌ Failed to fetch user info for userId:", userId);
          return {
            name: "Unknown",
            avatar: null,
            type: react.type,
          };
        }
      })
    );

    console.log("✅ Final reactors:", reactors);
    setSelectedReactors(reactors);
    setReactDetailModalVisible(true);
  } catch (err) {
    console.error("❌ handlePressEmoji failed:", err);
    Alert.alert("Lỗi", "Không thể hiển thị chi tiết cảm xúc.");
  }
};



    const handleReact = async (message, reactType) => {
        try {
            const response = await axios.post('/api/messages/react', {
                conversationId: message.conversationId,
                messageId: message._id,
                reactType: reactType,
            });

            // Chỉ cập nhật message được react
            setMessages(prevMessages =>
                prevMessages.map(m =>
                    m._id === message._id
                        ? { ...m, reacts: response.data?.reacts || m.reacts }
                        : m
                )
            );
            socket.emit(SOCKET_EVENTS.REACT_TO_MESSAGE, {
  conversationId: message.conversationId,
  messageId: message._id,
  reactType, // optional if server handles type logic
});

        } catch (error) {
            console.error('Failed to send react:', error.response?.data || error.message);
        }
    };


const handleReplyAction = () => {

  setReplyTo(selectedMessage);
  setModalVisible(false);
};


// In ChatScreen component
const handleReadMessage = async () => {
  if (!selectedMessage || selectedMessage.type !== "TEXT") return;

  try {
    console.log("✉️ Sending TTS request for text:", selectedMessage.content);
    const res = await axios.post("/api/messages/tts", {
      text: selectedMessage.content,
    });
    console.log("✅ TTS response:", res.data);

    const { url } = res.data;
    console.log("▶️ Playing audio from:", url);

    // 1) Create a new Sound object
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true }  // auto-start playback
    );

    // 2) Optionally track when it’s done
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        console.log("🔈 Finished playing TTS");
        sound.unloadAsync();
      }
    });

  } catch (err) {
    console.error("❌ TTS error:", err);
    Alert.alert("Error", err.response?.data?.message || err.message);
  } finally {
    setModalVisible(false);
  }
};



const openForwardModal = async () => {
  try {
    const { data: conversations } = await axios.get("/api/conversations");
    const filteredConversations = conversations.filter(c => c._id !== conversationId);


    // split out groups vs. private
    const groupConvs   = filteredConversations.filter(c => c.type === true);
    const privateConvs = filteredConversations.filter(c => c.type !== true);

    // 1️⃣ build group→channels list exactly as you had it
    const channelPromises = groupConvs.map(async (conv) => {
      try {
        const { data: channels } = await axios.get(`/api/channels/${conv._id}`);
        return channels.map(ch => ({
          _id:         ch._id,
          type:        "channel",
          channelName: ch.name,
          groupName:   conv.name,
          groupAvatar: conv.avatar,
          groupId:     conv._id,
        }));
      } catch (err) {
        console.error(`Failed to load channels for group ${conv._id}`, err);
        return [];
      }
    });

    // 2️⃣ build private chats list by fetching:
    //   • the user’s actual profile (to get real name & avatar)
    //   • the member-record (to get their conversation-alias)
    const privatePromises = privateConvs.map(async (conv) => {
      // find the “other” member
      const otherM = conv.members.find(m => m.userId !== userId);
      if (!otherM) return null;

      // fetch their member record (alias)
      const memberRes = await axios.get(`/api/members/${conv._id}/${otherM.userId}`);
      const memberRec = memberRes.data.data;            // { name: "Tran Tam", ... }

      // fetch the actual user record
      const userRec   = await UserService.getUserById(otherM.userId);  
      // { name: "Quang Hoang", avatar: "..." }

      return {
        _id:         conv._id,
        type:        "private",
        channelName: userRec.name,        // real name on top
        groupName:   memberRec.name,      // alias below
        groupAvatar: userRec.avatar,
      };
    });

    const [allGroupChannels, allPrivate] = await Promise.all([
      Promise.all(channelPromises),
      Promise.all(privatePromises),
    ]);

    const fullList = [
      // filter out any nulls
      ...allPrivate.filter(Boolean),
      ...allGroupChannels.flat(),
    ];

    console.log("Full forward list:", fullList);
    setConversationsList(fullList);
    setModalVisible(false);
    setForwardModalVisible(true);
  } catch (err) {
    console.error("Error fetching conversations/channels:", err);
    Alert.alert("Lỗi", err.message);
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
useEffect(() => {
  const fetchAllMessages = async () => {
    try {
      const [msgRes, pinRes] = await Promise.all([
        axios.get(`/api/messages/${conversationId}`),
        axios.get(`/api/pin-messages/${conversationId}`),
      ]);

      const all = msgRes.data || [];

      console.log(
  "🔍 fetched messages:",
  all.map(m => ({
    _id: m._id,
    type: m.type,
    fileName: m.fileName,
    createdAt: m.createdAt
  }))
);

      const pinned = pinRes.data || [];

      setAllMessages(all);

      // Attach isPinned flag
      const pinnedIds = new Set(pinned.map(p => p.messageId));
      const decorated = all.map(msg =>
        pinnedIds.has(msg._id)
          ? { ...msg, isPinned: true }
          : msg
      );

      const initialLimit = 40;
      const skip = Math.max(0, decorated.length - initialLimit);
      const lastMessages = decorated.slice(skip);

      setMessages(lastMessages);
      setPagination({ skip, limit: 20 });
      setHasMore(skip > 0);
      setPinnedMessages(pinned);

    } catch (err) {
      console.error("Failed to load messages or pins", err);
    }
  };

  if (conversationId) fetchAllMessages();
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

// At the bottom of your ChatScreen component, replace your
// existing handleSelectConversationToForward with this:

// replace your old handleSelectConversationToForward with this:

const handleSelectConversationToForward = async (selectedId) => {
  try {
    const item = conversationsList.find(i => i._id === selectedId);
    if (!item) throw new Error("Không tìm thấy cuộc trò chuyện.");

    // build the payload
    const body = {
      conversationId: item.type === "channel" ? item.groupId : item._id,
      channelId:      item.type === "channel" ? item._id     : null,
      content:        selectedMessage.content,
      type:           selectedMessage.type,
      fileName:       selectedMessage.fileName,
    };

    console.log("📤 Forward payload:", body);

    const res = await axios.post("/api/messages/text", body);

    console.log("📥 Forward response:", res.data);
  } catch (err) {
    // log everything we can from the AxiosError
    console.error("🔄 Forward error:", err);
    if (err.response) {
      console.error("➡️ Status:", err.response.status);
      console.error("➡️ Response body:", err.response.data);
    }
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



const uploadMediaAndSendMessage = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Permission denied", "Gallery access needed.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    quality: 1,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) return;
  

  const selectedMedia = result.assets[0];
  const mediaUri = selectedMedia.uri;
  const fileName = mediaUri.split("/").pop();
  const mimeType = selectedMedia.mimeType || (selectedMedia.type === "video" ? "video/mp4" : "image/jpeg");

  const formData = new FormData();
  formData.append("id", userId);
  formData.append("conversationId", conversationId);
  formData.append(selectedMedia.type === "video" ? "video" : "image", {
    uri: mediaUri,
    name: fileName,
    type: mimeType,
  });

 try {
  const endpoint = selectedMedia.type === "video"
    ? "/api/messages/video"
    : "/api/messages/images";

  const response = await axios.post(endpoint, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: selectedMedia.type === "video" ? 30000 : 20000,
  });

  const responseData = Array.isArray(response.data) ? response.data[0] : response.data;

  const mediaUrl =
    responseData?.file?.url ||
    responseData?.url ||
    responseData?.content ||
    responseData?.message?.url ||
    null;

  if (!mediaUrl) {
    console.warn("⚠️ Unexpected upload response:", response.data);
    throw new Error("Server did not return a URL");
  }

  // sendOptimisticMediaMessage({
  //   type: selectedMedia.type === "video" ? "VIDEO" : "IMAGE",
  //   url: mediaUrl,
  // });

} catch (err) {
  console.error("Upload error:", err);
  Alert.alert("Error", "Failed to upload media.");
}

};



 const pickDocument = async () => {
  setUploading(true);
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result?.canceled || (!result.assets && result.type !== "success")) {
      setUploading(false);
      return;
    }

    let fileUri, fileName, mimeType;

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      fileUri = asset.uri;
      fileName = asset.name;
      mimeType = asset.mimeType || "application/octet-stream";
    } else {
      fileUri = result.uri;
      fileName = result.name;
      mimeType = "application/octet-stream";
    }

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      Alert.alert("Error", "File not found.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("id", userId);
    formData.append("conversationId", conversationId);
    formData.append("file", {
      uri: Platform.OS === "android" ? fileUri : fileUri.replace("file://", ""),
      name: fileName,
      type: mimeType,
    });

    await axios.post("/api/messages/file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        
      },
       timeout: 30000,
    });

  } catch (error) {
    console.error("Full Axios Error:", JSON.stringify(error, null, 2));
    Alert.alert("Upload error", error.message || "Không thể upload file.");
  } finally {
    setUploading(false);
  }
};
const handleSendMessage = async (text) => {
  if (!text.trim()) return;

  const tempId = String(Date.now());
  const optimisticMsg = {
    _id: tempId,
    memberId: { userId },
    type: "TEXT",
    content: text,
    pending: true,
    replyMessageId: replyTo?._id,
    createdAt: new Date().toISOString(),
  };

  setMessages(prev => [...prev, optimisticMsg]);

  try {
    const { data } = await axios.post("/api/messages/text", {
      conversationId,
      content: text,
      type: "TEXT",
      replyMessageId: replyTo?._id || null,
      channelId: null,
      tags: [],
      tagPositions: [],
    });

    setMessages(prev =>
      prev.map((m) =>
        m._id === tempId ? data : m
      )
    );

    setReplyTo(null); // ✅ clear after successful send
  } catch (error) {
    console.error("❌ Failed to send message:", error);
    Alert.alert("Error", "Không thể gửi tin nhắn.");
    setMessages(prev => prev.filter(m => m._id !== tempId));
  }
};

const reactUpdateHandler = (message) => {
  if (!message || !message._id || !message.reacts) {
    console.warn("⚠️ Invalid reaction payload:", message);
    return;
  }

  const messageId = message._id;
  const reacts = message.reacts;

  console.log("🆕 Updating message", messageId, "with reacts:", reacts);

  setMessages((prev) =>
    prev.map((msg) =>
      msg._id === messageId ? { ...msg, reacts } : msg
    )
  );
};



useEffect(() => {

    if (!socket || !conversationId || !userId) return;

    

  const receiveHandler = (message) => {
    if (message.conversationId !== conversationId) return;
    setMessages((prev) => {
      // replace the optimistic placeholder if it matches
      console.log("📨 Received message from server:", message);

      if (message.memberId?.userId === userId) {
        const idx = prev.findIndex(
          m => m.pending && m.content === message.content
        );
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = message;
          return updated;
        }
      }
      // otherwise skip if it’s already there by server _id
      if (prev.some(m => m._id === message._id)) return prev;
      return [...prev, message];
    });
  };
  

  socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
  socket.on(SOCKET_EVENTS.MESSAGE_RECALLED, recallHandler);
  
console.log("➡️ Joining conversation with userId:", userId, "conversationId:", conversationId);

socket.emit(SOCKET_EVENTS.JOIN, userId);

// 2. When entering a chat screen
socket.emit(SOCKET_EVENTS.JOIN_CONVERSATIONS, [conversationId]);
    socket.on(SOCKET_EVENTS.PIN_MESSAGE,   handlePinSocket);
    socket.on(SOCKET_EVENTS.UNPIN_MESSAGE, handleUnpinSocket);

    socket.on(SOCKET_EVENTS.REACT_TO_MESSAGE, reactUpdateHandler); 

  return () => {
    socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
    socket.off(SOCKET_EVENTS.MESSAGE_RECALLED, recallHandler);
    socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, conversationId);
      socket.off(SOCKET_EVENTS.REACT_TO_MESSAGE, reactUpdateHandler); 
        socket.off(SOCKET_EVENTS.PIN_MESSAGE,   handlePinSocket);
      socket.off(SOCKET_EVENTS.UNPIN_MESSAGE, handleUnpinSocket);
  };
}, [socket, conversationId, userId, recallHandler,  handlePinSocket,
    handleUnpinSocket,]);



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#D8EDFF' }}>
     <KeyboardAvoidingView
       style={{ flex: 1 }}
       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
       >

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
   allMessages={allMessages} 
  currentUserId={userId}
  currentUserAvatar={currentUser?.avatar}
  otherUserAvatar={otherUser?.avatar}
  handlePressEmoji={handlePressEmoji}
  onMessageLongPress={handleMessageLongPress}
  loadMoreMessages={loadMoreMessages}
  loadingMore={loadingMore} 
   scrollToMessageId={scrollToMessageId}  
    onInvitePress={handleShowInviteModal}
/>


  )}


      </View>


  {replyTo && (
  <View style={styles.replyPreview}>
    <View style={styles.replyLeftAccent} />
    <View style={styles.replyContent}>
      <Text style={styles.replyTitle}>
        Đang trả lời {replyTo.memberId.userName || otherUser?.name}
      </Text>
      <Text
        style={styles.replySnippet}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {replyTo.content}
      </Text>
    </View>
    <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyClose}>
      <Text style={styles.replyCloseText}>×</Text>
    </TouchableOpacity>
  </View>
)}

      <MessageInput
        input={input}
        setInput={setInput}
        onSend={handleSendMessage}
        onPickMedia={uploadMediaAndSendMessage}
          onStartRecording={() => setRecordingModal(true)} 
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
  animationType="slide"
  onRequestClose={() => setModalVisible(false)}
>
  <TouchableOpacity
    style={styles.modalOverlay}
    activeOpacity={1}
    onPressOut={() => setModalVisible(false)}
  >
    <View style={styles.modalContent}>
      {/* —————————————————————— */}
      {/* 1) Reaction bar */}

                            <View style={styles.reactionBar}>
                                {['❤️', '😂', '😢', '👍', '👎', '😮'].map((emoji) => (
                                    <TouchableOpacity
                                        key={emoji}
                                        onPress={() => {
                                            const type = emojiToType[emoji];
                                            handleReact(selectedMessage, type);
                                            setModalVisible(false);
                                        }}
                                    >
                                        <Text style={{ fontSize: 24 }}>{emoji}</Text>
                                    </TouchableOpacity>
        ))}
      </View>

      {/* —————————————————————— */}
      {/* 2) Action grid */}
      <View style={styles.optionsGrid}>
        {[

            ...(selectedMessage?.memberId?.userId === userId
    ? [{ icon: require('../icons/undo.png'), label: 'Recall', onPress: handleRecallAction }]
    : []
  ),
            { icon: require('../icons/forward.png'), label: 'Forward', onPress: openForwardModal },
          { icon: require('../icons/reply.png'),   label: 'Reply',    onPress: handleReplyAction },
          { icon: require('../icons/Delete.png'),   label: 'Delete',    onPress: handleDeleteAction },
selectedMessage?.isPinned
  ? {
      icon: require('../icons/Unpin.png'), 
      label: 'Unpin message',
      onPress: () => handleUnpinMessage(selectedMessage),
    }
  : {
      icon: require('../icons/Pin_action.png'),
      label: 'Pin message',
      onPress: () => {
        handlePinMessages(selectedMessage);
      },
    },
...(selectedMessage?.type === 'TEXT'
  ? [{
      icon: require('../icons/mic.png'),
      label: 'Read Message',
      onPress: handleReadMessage,
    }]
  : []),


        ].map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={styles.optionItem}
            onPress={() => {
              opt.onPress();
              setModalVisible(false);
            }}
          >
            <Image source={opt.icon} style={styles.optionIcon} />
            <Text style={styles.optionLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  </TouchableOpacity>
</Modal>


<Modal
  visible={forwardModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setForwardModalVisible(false)}
>
  <View style={styles.forwardOverlay}>
    <View style={styles.forwardModal}>
      {/* Header */}
      <View style={styles.forwardHeader}>
        <Text style={styles.forwardTitle}>Chuyển tiếp tới</Text>
        <Text style={styles.forwardSubtitle}>
          Chọn nơi bạn muốn chia sẻ tin nhắn này.
        </Text>

          <TouchableOpacity
    onPress={() => setForwardModalVisible(false)}
    style={styles.closeModalButton}
  >
    <Image
      source={require('../icons/Close.png')} // Replace with your close icon path
      style={styles.closeModalIcon}
    />
  </TouchableOpacity>

      </View>



      {/* Conversation list */}
<FlatList
  data={conversationsList}
  keyExtractor={item => item._id}
  style={styles.forwardList}
  renderItem={({ item }) => {
    const isSelected = item._id === selectedForwardId;
    return (
      <TouchableOpacity
        style={styles.forwardRow}
        onPress={() => setSelectedForwardId(item._id)}
      >
        <Image
          source={item.groupAvatar ? { uri: item.groupAvatar } : AvatarImage}
          style={styles.forwardAvatar}
        />
        <View style={styles.forwardText}>
          {/* top line: channelName (user name or channel name) */}
          <Text style={styles.forwardName}>{item.channelName}</Text>
          {/* bottom line: for private → member alias; for group→ group name */}
          {item.groupName && (
            <Text style={styles.forwardDesc}>{item.groupName}</Text>
          )}
        </View>
        <View style={styles.radioWrapper}>
          <View style={styles.radioOuter}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  }}
/>


      {/* Send button */}
      <TouchableOpacity
        style={[
          styles.forwardSend,
          !selectedForwardId && { opacity: 0.5 }
        ]}
        disabled={!selectedForwardId}
        onPress={() => handleSelectConversationToForward(selectedForwardId)}
      >
        <Text style={styles.forwardSendText}>Chuyển tiếp</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


 
<Modal
  visible={reactDetailModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setReactDetailModalVisible(false)}
>
                   <View style={styles.reactModalBackground}>
    <View style={styles.reactModalContainer}>
      {/* Header */}
      <View style={styles.reactModalHeader}>
        <Text style={styles.reactModalTitle}>Cảm xúc về tin nhắn</Text>
        <TouchableOpacity onPress={() => setReactDetailModalVisible(false)}>
          <Image source={require('../icons/Close.png')} style={styles.reactModalClose} />
        </TouchableOpacity>
      </View>
      
<FlatList
  data={selectedReactors}
  keyExtractor={(item, index) => `${item.name}-${index}`}
  
  renderItem={({ item }) => {
    const emojiMap = {
      1: '❤️',
      2: '😂',
      3: '😢',
      4: '👍',
      5: '👎',
      6: '😮',
    };

    
    const emoji = emojiMap[item.type];

    return (
      <View style={styles.reactorRow}>
        <Image
          source={item.avatar ? { uri: item.avatar } : AvatarImage}
          style={styles.reactorAvatar}
        />
        <View style={styles.reactorInfo}>
          <Text style={styles.reactorName}>{item.name || "Unknown"}</Text>

        </View>
        <Text style={styles.reactorHeart}>{emoji}</Text>
      </View>
    );
  }}
/>


                        </View>
                    </View>
                </Modal>
                <Modal
  visible={inviteModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setInviteModalVisible(false)}
>
  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 20,
      width: '92%',
      paddingHorizontal: 0,
      alignItems: 'center',
      paddingBottom: 24,
      maxWidth: 400
    }}>
      <TouchableOpacity
        style={{ alignSelf: "flex-start", margin: 14 }}
        onPress={() => setInviteModalVisible(false)}
      >
        <Text style={{ fontSize: 30, color: '#888' }}>×</Text>
      </TouchableOpacity>
      {inviteLoading ? (
        <ActivityIndicator size="large" color="#4285f4" style={{ marginTop: 40 }} />
      ) : inviteError ? (
        <Text style={{ color: "#E33", padding: 16 }}>{inviteError}</Text>
      ) : inviteInfo ? (
        <>
          {/* Avatar */}
          <View style={{ marginTop: -16, marginBottom: 16 }}>
            <Image
              source={inviteInfo.avatar ? { uri: inviteInfo.avatar } : AvatarImage}
              style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#e9e9e9' }}
            />
          </View>
          {/* Name and Info */}
          <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 }}>
            {inviteInfo.name}
          </Text>
          <Text style={{ fontSize: 15, color: '#333', marginBottom: 8 }}>
            {inviteInfo.members?.length || 0} members
          </Text>


<Text style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
 Created {inviteInfo.createdAt ? dayjs(inviteInfo.createdAt).fromNow() : 'một thời gian trước'}
</Text>
          {/* Join Button */}
<TouchableOpacity
  style={{
    backgroundColor: "#086DC0",
    borderRadius: 24,
    width: 230,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 2
  }}
  disabled={joining}
  onPress={async () => {
    setJoining(true);
    setJoinError(null);
    try {
      console.log("[Invite] Attempting to join group with token:", inviteToken);
      const response = await axios.post(`/api/conversations/join/${inviteToken}`);


      console.log("[Invite] Join response:", response.data);

      if (response.data.status === "joined") {
        setInviteModalVisible(false);
        Alert.alert("Thành công", "Bạn đã tham gia nhóm!");
      } else {
        setInviteModalVisible(false);
        Alert.alert("Yêu cầu gửi", "Yêu cầu tham gia nhóm đã được gửi. Vui lòng chờ duyệt!");
      }
    } catch (err) {
      console.log("[Invite] Join failed:", err.response?.data || err);
      setJoinError(err.response?.data?.message || "Lỗi khi tham gia nhóm");
    } finally {
      setJoining(false);
    }
  }}
>
  {joining ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={{ color: "#fff", fontWeight: 'bold', fontSize: 16 }}>Join</Text>
  )}
</TouchableOpacity>
{joinError && (
  <Text style={{ color: "#E33", padding: 10, marginTop: 5, textAlign: "center" }}>
    {joinError}
  </Text>
)}

        </>
      ) : null}
    </View>
  </View>
</Modal>
<Modal
  visible={recordingModal}
  transparent
  animationType="slide"
  onRequestClose={resetRecording}
>
  <View style={{
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 28,
      width: '88%',
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 12,
      maxWidth: 340
    }}>
      {/* ========== NOT RECORDING YET ========== */}
      {!isRecording && !recordedUri && (
        <>
          <Text style={{ color: '#666', fontSize: 16, marginBottom: 26 }}>
            Bấm để ghi âm
          </Text>
          <TouchableOpacity
            style={{
              width: 70, height: 70,
              backgroundColor: '#086DC0',
              borderRadius: 35,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 10,
              shadowColor: "#086DC0",
              shadowOpacity: 0.17,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 3,
            }}
            onPress={startRecording}
          >
            <Image source={require('../icons/mic.png')} style={{ width: 38, height: 38, tintColor: '#fff' }} />
          </TouchableOpacity>
        </>
      )}

      {/* ========== RECORDING ========== */}
      {isRecording && !recordedUri && (
        <>
          <Text style={{ fontSize: 18, color: '#555', marginBottom: 16 }}>
            Đang ghi âm... {recordingDuration}s
          </Text>
          <TouchableOpacity
            style={{
              width: 70, height: 70,
              backgroundColor: '#E33',
              borderRadius: 35,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 18,
            }}
            onPress={stopRecording}
          >
            <Image source={require('../icons/stop.png')} style={{ width: 38, height: 38, tintColor: '#fff' }} />
          </TouchableOpacity>
        </>
      )}

      {/* ========== RECORDED (READY TO SEND) ========== */}
      {recordedUri && (
        <>
          {/* Action buttons row */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 0, gap: 28 }}>
            {/* Xóa */}
            <TouchableOpacity onPress={resetRecording} style={{ alignItems: 'center' }}>
              <View style={{
                width: 50, height: 50,
                backgroundColor: '#f5f6fa',
                borderRadius: 25,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4
              }}>
                <Image source={require('../icons/Trash.png')} style={{ width: 25, height: 25, tintColor: '#222' }} />
              </View>
              <Text style={{ color: '#222', fontSize: 15 }}>Xóa</Text>
            </TouchableOpacity>
            {/* Gửi */}
            <TouchableOpacity onPress={sendRecording} style={{ alignItems: 'center' }}>
              <View style={{
                width: 50, height: 50,
                backgroundColor: '#086DC0',
                borderRadius: 25,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4
              }}>
                <Image source={require('../icons/play.png')} style={{ width: 25, height: 25, tintColor: '#fff' }} />
              </View>
              <Text style={{ color: '#086DC0', fontSize: 15, fontWeight: 'bold' }}>Gửi</Text>
            </TouchableOpacity>
            {/* Nghe lại */}
            <TouchableOpacity onPress={playRecording} style={{ alignItems: 'center' }}>
              <View style={{
                width: 50, height: 50,
                backgroundColor: '#f5f6fa',
                borderRadius: 25,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4
              }}>
                <Image source={require('../icons/wave.png')} style={{ width: 25, height: 25, tintColor: '#222' }} />
              </View>
              <Text style={{ color: '#222', fontSize: 15 }}>Nghe lại</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ marginTop: 18, fontSize: 18, color: '#555' }}>{`${recordingDuration}s`}</Text>
        </>
      )}
    </View>
  </View>
</Modal>


    </KeyboardAvoidingView>
    </SafeAreaView>
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
  loadingOverlay: {
  position: "absolute",
  alignItems: "center",
  zIndex: 10,
},
  placeholder: {
    backgroundColor: "#F0F0F0",  // or whatever matches your chat background
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0, left: 0,
    // imageContent already sets width/height/borderRadius
  },
  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  replyLeftAccent: {
    width: 4,
    height: "100%",
    backgroundColor: "#086DC0",
    marginRight: 8,
    borderRadius: 2,
  },
  replyContent: {
    flex: 1,
  },
  replyTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  replySnippet: {
    fontSize: 14,
    color: "#555",
  },
  replyClose: {
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  replyCloseText: {
    fontSize: 18,
    color: "#777",
  },

      reactModalContainer: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        width: "80%",
        maxHeight: "70%",
    },
    reactModalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    reactorItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    reactorInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    emojiLarge: {
        fontSize: 24,
        marginRight: 10,
    },
    reactorName: {
        fontSize: 16,
    },
    removeButton: {
        backgroundColor: "#f0f0f0",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    removeButtonText: {
        color: "#666",
        fontSize: 14,
    },
    closeButton: {
        backgroundColor: "#086DC0",
        paddingVertical: 10,
        borderRadius: 5,
        marginTop: 15,
        alignItems: "center",
    },
    closeButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
        modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: 'white', padding: 20, borderRadius: 10 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    reactorItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
    reactModalBackground: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
},
reactModalContainer: {
  width: '90%',
  maxHeight: '70%',
  backgroundColor: '#fff',
  borderRadius: 10,
  paddingVertical: 12,
  paddingHorizontal: 16,
},
reactModalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
reactModalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
},
reactModalClose: {
  width: 20,
  height: 20,
  tintColor: '#333',
},
reactTabs: {
  flexDirection: 'row',
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
  marginBottom: 8,
},
reactTab: {
  flex: 1,
  alignItems: 'center',
  paddingVertical: 8,
},
reactTabText: {
  fontSize: 14,
  color: '#086DC0',
  fontWeight: '600',
},
reactorRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#f0f0f0',
},
reactorAvatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 12,
},
reactorInfo: {
  flex: 1,
},
reactorName: {
  fontSize: 16,
  color: '#333',
},
reactorSubtitle: {
  fontSize: 12,
  color: '#888',
  marginTop: 2,
},
reactorHeart: {
  width: 24,
  height: 24,
  tintColor: '#E0245E',
},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // white rounded container
  modalContent: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    elevation: 10,           // shadow on Android
    shadowColor: '#000',     // shadow on iOS
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  // —— Reaction bar ——
  reactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reactionIcon: {
    padding: 4,
  },
  reactionEmoji: {
    fontSize: 28,
  },

  // —— Options grid ——
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,

  },
  optionItem: {
    width: '25%',           // 4 items per row
    alignItems: 'center',
    marginBottom: 16,
  },
  optionIcon: {
    width: 32,
    height: 32,
    marginBottom: 6,
  },
  optionLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
// overlay to dim background
forwardOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.6)",
  justifyContent: "center",
  alignItems: "center",
},
// the white card
forwardModal: {
  width: "90%",
  maxHeight: "80%",
  backgroundColor: "#fff",
  borderRadius: 8,
  padding: 16,
},
forwardHeader: {
  marginBottom: 12,
},
forwardTitle: {
  color: "#000",
  fontSize: 18,
  fontWeight: "600",
},
forwardSubtitle: {
  color: "#AAA",
  fontSize: 12,
  marginTop: 4,
},


forwardList: {
  flexGrow: 0,
  marginBottom: 12,
},
forwardRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 10,
},
forwardAvatar: {
  width: 32,
  height: 32,
  borderRadius: 16,
},
forwardText: {
  flex: 1,
  marginLeft: 12,
},
forwardName: {
  color: "#000",
  fontSize: 16,
},
forwardDesc: {
  color: "#AAA",
  fontSize: 12,
  marginTop: 2,
},
forwardCheckbox: {
  width: 20,
  height: 20,
  borderWidth: 2,
  borderColor: "#72767D",
  borderRadius: 4,
  justifyContent: "center",
  alignItems: "center",
},
forwardCheckboxSelected: {
  backgroundColor: "#5865F2",
  borderColor: "#5865F2",
},
checkmark: {
  color: "#FFF",
  fontSize: 14,
  lineHeight: 14,
},
forwardSend: {
  backgroundColor: "#086DC0",
  borderRadius: 24,
  paddingVertical: 10,
  alignItems: "center",
},
forwardSendText: {
  color: "#FFF",
  fontSize: 16,
  fontWeight: "600",
},
radioWrapper: {
  paddingLeft: 12,
  paddingRight: 4,
  justifyContent: "center",
  alignItems: "center",
},

radioOuter: {
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: "#086DC0",
  justifyContent: "center",
  alignItems: "center",
},

radioInner: {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: "#086DC0",
},
closeModalButton: {
  position: "absolute",
  top: 0,
  right: 0,
  padding: 6,
  zIndex: 10,
},

closeModalIcon: {
  width: 25,
  height: 25,
  tintColor: "#FF0000", // Optional: match your theme
  resizeMode: "contain",

},


});
