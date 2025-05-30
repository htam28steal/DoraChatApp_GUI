import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  use,
} from "react";
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
  KeyboardAvoidingView,
  Animated,
  Easing,
} from "react-native";
import Toast from "react-native-toast-message";

import axios from "../api/apiConfig";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import EmojiPicker, { tr } from "rn-emoji-keyboard";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { socket } from "../utils/socketClient";
import { SOCKET_EVENTS } from "../utils/constant";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
dayjs.extend(relativeTime);
import { Video } from "expo-av";
import CreateVoteModal from "./CreateVoteModal";
import VotedModal from "./VotedModal";
import VoiceRecordModal from "./VoiceRecordModal";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import AddNewChannel from "./AddChannelModal";
import memberService from "../api/memberService";

const AvatarImage = require("../Images/avt.png");
const CallIcon = require("../icons/video_call.png");
const DetailChatIcon = require("../icons/detail_chat.png");
const FileIcon = require("../icons/paperclip.png");
const PictureIcon = require("../icons/picture.png");
const EmojiIcon = require("../icons/emoji.png");
const SendIcon = require("../icons/send.png");
const Return = require("../icons/back.png");
const MicIcon = require("../icons/mic.png");
const addChannel = require("../icons/addChannel.png");
const vote = require("../icons/ballot.png");

function dedupeMessages(msgs) {
  const seen = new Set();
  const unique = [];
  for (const msg of msgs) {
    if (!seen.has(msg._id)) {
      seen.add(msg._id);
      unique.push(msg);
    }
  }
  return unique;
}
const BUBBLE_WIDTH = 220;
const LINE_WIDTH = 140; // Adjust for duration/spacing
const LINE_HEIGHT = 3;
const BUTTON_SIZE = 40;

export function AudioBubble({ url }) {
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [position, setPosition] = useState(0);
  const [durationSec, setDurationSec] = useState(0);

  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    let loader;

    async function loadMetadata() {
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
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  })();

  return (
    <View style={audioStyles.bubble}>
      <View style={audioStyles.inner}>
        {/* Audio Line and Play Button */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: LINE_WIDTH + BUTTON_SIZE,
              height: BUTTON_SIZE,
              justifyContent: "center",
            }}
          >
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
                <View
                  style={{
                    width: 0,
                    height: 0,
                    borderLeftWidth: 16,
                    borderTopWidth: 11,
                    borderBottomWidth: 11,
                    borderLeftColor: "#fff",
                    borderTopColor: "transparent",
                    borderBottomColor: "transparent",
                    marginLeft: 3,
                  }}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
          <Text
            style={{
              marginLeft: 8,
              color: "#444",
              fontWeight: "100",
              fontSize: 10,
              alignSelf: "center",
              minWidth: 28,
            }}
          >
            {shownDuration}
          </Text>
        </View>
      </View>
    </View>
  );
}

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
const MessageItem = React.memo(
  ({
    msg,
    showAvatar,
    showTime,
    currentUserId,
    onLongPress,
    handlePressEmoji,
    isPinned,
    handleOpenVoteModal,
    allMessages,
    index,
    AudioBubble,
  }) => {
    const isMe = msg.memberId?.userId === currentUserId;
    const content = msg.content || "";
    const centerAlignedTypes = ["VOTE", "NOTIFY"];
    const isCenterAligned = centerAlignedTypes.includes(msg.type);
    const Container = onLongPress ? TouchableOpacity : View;
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [pinned, setPinned] = useState(false);
    const emojiMap = {
      0: "👍", // Like
      1: "❤️", // Love
      2: "😆", // Haha
      3: "😮", // Wow
      4: "😢", // Sad
      5: "😣", // Angry
      6: "🤗", // Care
    };

    const replied = msg.replyMessageId
      ? allMessages.find((m) => m._id === msg.replyMessageId)
      : null;

    const getFileExtension = useCallback((url) => {
      if (!url) return "";
      const fileName = url.includes("/")
        ? url.substring(url.lastIndexOf("/") + 1)
        : url;
      const lastDotIndex = fileName.lastIndexOf(".");
      return lastDotIndex !== -1
        ? fileName.substring(lastDotIndex + 1).toLowerCase()
        : "";
    }, []);

    const getFileIcon = useCallback(
      (fileNameOrUrl = "") => {
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
      },
      [getFileExtension]
    );

    const a = 1;

    useEffect(() => {
      let isMounted = true;
      const checkPinned = async () => {
        try {
          const result = await isPinned(msg);
          if (isMounted) {
            setPinned(result);
          }
        } catch (err) {
          console.log(err);
        }
      };
      checkPinned();
      return () => {
        isMounted = false;
      };
    }, [msg]);

    if (msg.type === "NOTIFY") {
      return (
        <View
          style={[messageItemStyles.container, messageItemStyles.centerAlign]}
        >
          <Text style={messageItemStyles.notifyText}>{msg.content}</Text>
        </View>
      );
    }

    const audioExtensions = ["mp3", "wav", "aac", "ogg", "m4a"];

    const isAudioFile = (fileName = "", url = "") => {
      const name = (fileName || url).toLowerCase();
      return audioExtensions.some((ext) => name.endsWith(`.${ext}`));
    };

    useEffect(() => {
      if (msg.type !== "FILE" || !msg.content) return;

      const lastDotIndex = msg.content.lastIndexOf(".");

      const ext =
        lastDotIndex !== -1
          ? msg.content.slice(lastDotIndex + 1).toLowerCase()
          : "";
      if (ext !== "m4a" || ext !== "mp3") return;

      let isMounted = true;
      let audioSound = null;

      const loadSound = async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: msg.content },
            { shouldPlay: false }
          );
          audioSound = sound;
          if (isMounted) {
            setSound(sound);
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) {
                setIsPlaying(false);
              }
            });
          }
        } catch (error) {
          console.error("Lỗi khi load audio:", error);
        }
      };

      loadSound();

      return () => {
        isMounted = false;
        if (audioSound) {
          audioSound.unloadAsync();
        }
      };
    }, [msg.content]);

    const togglePlayback = async () => {
      try {
        if (sound) {
          if (isPlaying) {
            await sound.pauseAsync();
          } else {
            await sound.playAsync();
          }
          setIsPlaying(!isPlaying);
        } else {
          await loadAudio();
        }
      } catch (error) {
        console.error("Lỗi khi phát audio:", error);
      }
    };

    const renderMessageContent = useCallback((msg) => {
      const { content, tagPositions = [] } = msg;
      if (!tagPositions.length) {
        return <Text style={messageItemStyles.textContent}>{content}</Text>;
      }

      const sortedTags = [...tagPositions].sort((a, b) => a.start - b.start);
      const elements = [];
      let lastIndex = 0;

      sortedTags.forEach((tag, idx) => {
        if (tag.start > lastIndex) {
          elements.push(
            <Text
              key={`text-${lastIndex}`}
              style={messageItemStyles.textContent}
            >
              {content.slice(lastIndex, tag.start)}
            </Text>
          );
        }
        elements.push(
          <Text
            key={`tag-${idx}`}
            style={[
              messageItemStyles.textContent,
              messageItemStyles.taggedText,
            ]}
          >
            {content.slice(tag.start, tag.end)}
          </Text>
        );
        lastIndex = tag.end;
      });

      if (lastIndex < content.length) {
        elements.push(
          <Text key={`text-end`} style={messageItemStyles.textContent}>
            {content.slice(lastIndex)}
          </Text>
        );
      }

      return <Text style={messageItemStyles.textContent}>{elements}</Text>;
    }, []);

    const prevMessage = allMessages[index - 1];
    const isFirstInGroup =
      !prevMessage ||
      prevMessage.memberId?.userId !== msg.memberId?.userId ||
      prevMessage.type === "NOTIFY" ||
      msg.type === "NOTIFY";

    const [avatarLoaded, setAvatarLoaded] = useState(false);
    const DEFAULT_AVATAR = "https://example.com/default-avatar.png";
    const shouldShowAvatar = useMemo(() => {
      if (isCenterAligned || !showAvatar) return false;
      const prevMessage = allMessages[index - 1];
      return (
        !prevMessage ||
        prevMessage.memberId?.userId !== msg.memberId?.userId ||
        prevMessage.type === "NOTIFY" ||
        msg.type === "NOTIFY"
      );
    }, [
      allMessages,
      index,
      msg.memberId?.userId,
      msg.type,
      isCenterAligned,
      showAvatar,
    ]);

    return (
      <Container
        onLongPress={onLongPress}
        activeOpacity={0.7}
        style={[
          messageItemStyles.container,
          msg.type === "VOTE"
            ? messageItemStyles.centerAlign
            : isMe
            ? messageItemStyles.rightAlign
            : messageItemStyles.leftAlign,
        ]}
      >
        {!isCenterAligned &&
          (shouldShowAvatar ? (
            <Image
              source={{ uri: msg.memberId?.avatar || DEFAULT_AVATAR }}
              style={messageItemStyles.avatar}
              onLoad={() => setAvatarLoaded(true)}
              key={`avatar-${msg._id}-${avatarLoaded}`} // Force re-render khi avatar thay đổi
            />
          ) : (
            <View style={messageItemStyles.avatarPlaceholder} />
          ))}

        <View style={messageItemStyles.contentContainer}>
          {pinned && (
            <Text
              style={[
                messageItemStyles.pinnedText,
                isMe ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
              ]}
            >
              📌 Đã ghim
            </Text>
          )}
          {msg.replyToMessage && (
            <TouchableOpacity
              style={messageItemStyles.replyContainer}
              onPress={() => onReplyPress(msg.replyToId)}
            >
              <Text style={messageItemStyles.replyAuthor}>
                {msg.replyToMessage.memberId.name}
              </Text>
              <Text numberOfLines={1} style={messageItemStyles.replySnippet}>
                {msg.replyToMessage.content}
              </Text>
            </TouchableOpacity>
          )}

          {msg.type === "NOTIFY" ? (
            <Text style={messageItemStyles.notifyText}>{content}</Text>
          ) : msg.type === "IMAGE" ? (
            <Image
              source={{ uri: content }}
              style={messageItemStyles.imageContent}
            />
          ) : msg.type === "VIDEO" ? (
            <Video
              source={{ uri: content }}
              style={messageItemStyles.videoContent}
              useNativeControls
              resizeMode="cover"
              isLooping={false}
            />
          ) : msg.type === "VOTE" ? (
            <View style={messageItemStyles.fVotes}>
              <View style={messageItemStyles.fVotesRow}>
                <Text style={messageItemStyles.txtContent}>{msg.content}</Text>
              </View>

              <View style={messageItemStyles.optionsContainer}>
                {msg.options.map((opt, index) => (
                  <View
                    key={opt._id || index}
                    style={{ position: "relative", marginBottom: 10 }}
                  >
                    <TouchableOpacity
                      style={messageItemStyles.optionButton}
                      activeOpacity={0.7}
                      onPress={() => console.log("Voted option:", opt.name)}
                    >
                      <Text style={messageItemStyles.optionText}>
                        {opt.name}
                      </Text>
                    </TouchableOpacity>

                    {opt.members?.length > 0 && (
                      <View
                        style={{
                          flexDirection: "row",
                          position: "absolute",
                          right: 10,
                          top: 8,
                        }}
                      >
                        {msg.isAnonymous ? (
                          <View
                            style={{
                              width: 25,
                              height: 25,
                              borderRadius: 15,
                              backgroundColor: "#e0e0e0",
                              justifyContent: "center",
                              alignItems: "center",
                              borderWidth: 1,
                              borderColor: "#fff",
                            }}
                          >
                            <Text style={{ fontSize: 10 }}>
                              {opt.members.length}
                            </Text>
                          </View>
                        ) : (
                          <>
                            {opt.members.slice(0, 2).map((member, i) => (
                              <Image
                                key={member._id}
                                source={{
                                  uri: member.avatar || DEFAULT_AVATAR,
                                }}
                                style={{
                                  width: 25,
                                  height: 25,
                                  borderRadius: 15,
                                  borderWidth: 1,
                                  borderColor: "#fff",
                                  marginLeft: i === 0 ? 0 : -10,
                                  zIndex: 10 - i,
                                }}
                              />
                            ))}

                            {opt.members.length > 2 && (
                              <View
                                style={{
                                  width: 25,
                                  height: 25,
                                  borderRadius: 15,
                                  backgroundColor: "#e0e0e0",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  marginLeft: -10,
                                  borderWidth: 1,
                                  borderColor: "#fff",
                                  zIndex: 8,
                                }}
                              >
                                <Text style={{ fontSize: 10 }}>
                                  +{opt.members.length - 2}
                                </Text>
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>

              <View style={messageItemStyles.fVotesRow}>
                <TouchableOpacity
                  style={messageItemStyles.btnVote}
                  onPress={() => handleOpenVoteModal(msg)}
                >
                  <Text>Bình chọn</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : msg.type === "FILE" ? (
            (() => {
              const lastDotIndex = msg.content.lastIndexOf(".");
              const ext =
                lastDotIndex !== -1
                  ? msg.content.slice(lastDotIndex + 1).toLowerCase()
                  : "";
              if (ext === "m4a" || ext === "mp3") {
                return <AudioBubble url={msg.content} />;
              } else {
                return (
                  <TouchableOpacity
                    style={messageItemStyles.fileContainer}
                    onLongPress={onLongPress}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={getFileIcon(msg.content)}
                      style={messageItemStyles.fileIcon}
                    />
                    <Text style={messageItemStyles.fileText}>
                      {msg.fileName || "Open File"}
                    </Text>
                  </TouchableOpacity>
                );
              }
            })()
          ) : (
            <View
              style={[
                isMe
                  ? messageItemStyles.myMessage
                  : messageItemStyles.theirMessage,
                msg.type === "RECALL" && { fontStyle: "italic", color: "#999" },
              ]}
            >
              {msg.type === "RECALL" ? (
                <Text
                  style={[
                    messageItemStyles.textContent,
                    { fontStyle: "italic", color: "#999" },
                  ]}
                >
                  Tin nhắn đã được thu hồi
                </Text>
              ) : (
                renderMessageContent(msg)
              )}
            </View>
          )}

          {msg.reacts && msg.reacts.length > 0 && (
            <TouchableOpacity
              style={messageItemStyles.reactContainer}
              onPress={() => handlePressEmoji(msg)}
            >
              {Object.entries(
                msg.reacts.reduce((acc, react) => {
                  const emoji = emojiMap[react.type];
                  if (emoji) {
                    acc[react.type] = (acc[react.type] || 0) + 1;
                  }
                  return acc;
                }, {})
              ).map(([type, count]) => (
                <View
                  key={type}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginRight: 4,
                  }}
                >
                  <Text style={messageItemStyles.emojiText}>
                    {emojiMap[type]}
                  </Text>
                  {count > 1 && (
                    <Text style={messageItemStyles.reactCount}>{count}</Text>
                  )}
                </View>
              ))}
            </TouchableOpacity>
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
);

const messageItemStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 4,
    alignItems: "flex-end",
  },
  centerAlign: {
    justifyContent: "center",
    flexDirection: "row",
    width: "100%",
  },
  leftAlign: { justifyContent: "flex-start" },
  rightAlign: { flexDirection: "row-reverse" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
  },
  avatarPlaceholder: { width: 40, height: 40 },

  contentContainer: {
    maxWidth: "75%",
    minWidth: 0,
    flex: 0,
    marginHorizontal: 8,
  },

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
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    fontSize: 14,
    color: "#000",
    flexShrink: 1,
    flexWrap: "wrap",
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

  myMessage: {
    backgroundColor: "#EFF8FF",
    alignSelf: "flex-start",
    borderRadius: 10,
    borderTopRightRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 300,
    minWidth: 0,
    flex: 0,
  },

  theirMessage: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    borderTopRightRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 300,
    minWidth: 0,
    flex: 0,
  },

  timeText: { fontSize: 10, color: "#959595", marginTop: 4 },
  reactContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 5,
    alignSelf: "flex-start",
    alignItems: "center",
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
    color: "#666",
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#f39c12",
    marginBottom: 4,
    maxWidth: "100%",
  },
  fVotes: {
    alignSelf: "center",
    flexWrap: "wrap",
    width: 250,
    height: "auto",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "grey",
    borderRadius: 10,
    padding: 10,
  },
  fVotesRow: {
    width: "100%",
    height: "auto",
  },
  txtContent: {
    fontWeight: "600",
  },
  optionsContainer: {
    marginTop: 10,
    gap: 8,
  },
  optionButton: {
    backgroundColor: "#f1f1f1",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
  btnVote: {
    width: "100%",
    height: 30,
    backgroundColor: "aqua",
    borderRadius: 30,
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  notifyText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginVertical: 8,
  },
  taggedText: {
    color: "#086DC0",
    fontWeight: "600",
    backgroundColor: "rgba(8, 109, 192, 0.1)",
    borderRadius: 4,
    paddingHorizontal: 2,
    overflow: "hidden",
  },
  replyContainer: {
    backgroundColor: "#e6e6fa",
    padding: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#086DC0",
    borderRadius: 6,
    marginBottom: 4,
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
});

/**
 * ChatBox Component to render a scrollable list of messages.
 */
function ChatBox({
  messages,
  allMessages,
  currentUserId,
  onMessageLongPress,
  handlePressEmoji,
  isPinned,
  handleOpenVoteModal,
  channelId,
}) {
  const scrollViewRef = useRef(null);
  const scrollPosition = useRef(0);

  const handleScroll = (event) => {
    scrollPosition.current = event.nativeEvent.contentOffset.y;
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: scrollPosition.current,
        animated: false,
      });
    }
  }, [messages, channelId]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={chatBoxStyles.container}
      contentContainerStyle={chatBoxStyles.contentContainer}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onContentSizeChange={() => {
        // Chỉ tự động scroll xuống dưới khi mới vào trang
        if (scrollPosition.current === 0) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }}
    >
      {messages.map((msg, index) => {
        const userId = msg.memberId?.userId || "";
        const prevId = messages[index - 1]?.memberId?.userId || "";
        const nextId = messages[index + 1]?.memberId?.userId || "";
        const isFirstInGroup = index === 0 || prevId !== userId;
        const isLastInGroup =
          index === messages.length - 1 || nextId !== userId;
        const key = `${msg._id}-${index}`;

        return (
          <MessageItem
            key={key}
            msg={msg}
            index={index}
            allMessages={allMessages}
            showAvatar={isFirstInGroup}
            showTime={isLastInGroup}
            currentUserId={currentUserId}
            onLongPress={() => onMessageLongPress(msg)}
            handlePressEmoji={handlePressEmoji}
            isPinned={isPinned}
            handleOpenVoteModal={handleOpenVoteModal}
            AudioBubble={AudioBubble}
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
function MessageInput({
  input,
  setInput,
  onSend,
  onPickMedia,
  onPickFile,
  onEmojiPress,
  onVotePress,
  onRecord,
  membersinconversation,
  memberNames,
}) {
  const [showMentionList, setShowMentionList] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState([]);

  const handleInputChange = (text) => {
    setInput(text);

    const mentionMatch = text.toString().match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const filtered = memberNames.filter((member) =>
        member.name.toLowerCase().includes(query)
      );
      setFilteredMembers(filtered);
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input, memberNames);
    setInput("");
    setShowMentionList(false);
  };

  const handleSelectMention = (name) => {
    const newText = input.replace(/@\w*$/, `@${name} `);
    setInput(newText);
    setShowMentionList(false);
  };

  return (
    <View style={messageInputStyles.container}>
      <TouchableOpacity
        style={messageInputStyles.iconButton}
        onPress={onPickFile}
      >
        <Image source={FileIcon} style={messageInputStyles.icon} />
      </TouchableOpacity>
      <View style={messageInputStyles.inputContainer}>
        <TextInput
          style={messageInputStyles.textInput}
          placeholder="Type a message..."
          value={input}
          onChangeText={handleInputChange}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline
        />

        {showMentionList && (
          <View style={messageInputStyles.mentionList}>
            <ScrollView>
              {filteredMembers.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={messageInputStyles.mentionItem}
                  onPress={() => {
                    handleSelectMention(member.name);
                  }}
                >
                  <Image
                    source={{ uri: member.avatar }}
                    style={{ width: 20, height: 20, borderRadius: 25 }}
                  />
                  <Text
                    style={{
                      marginLeft: 10,
                      fontWeight: "bold",
                      color: "black",
                    }}
                  >
                    {member.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={messageInputStyles.iconButton}
          onPress={onPickMedia}
        >
          <Image source={PictureIcon} style={messageInputStyles.icon} />
        </TouchableOpacity>
        <TouchableOpacity
          style={messageInputStyles.iconButton}
          onPress={onEmojiPress}
        >
          <Image source={EmojiIcon} style={messageInputStyles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onVotePress}>
          <Image source={vote} style={messageInputStyles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onRecord}>
          <Image source={MicIcon} style={messageInputStyles.icon} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={messageInputStyles.sendButton}
        onPress={handleSend}
      >
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
    paddingBottom: 20,
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
  mentionList: {
    position: "absolute",
    bottom: 70,
    left: 50,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    width: 200,
    maxHeight: 150,
    zIndex: 999,
  },
  mentionItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
  },
});

/**
 * Header Component for the chat screen.
 */

/**
 * Main ChatScreen Component which now uses the conversation details passed in via route params.
 * Also integrates a modal for long-press message options: "Thu hồi", "Xoá" and "Chuyển tiếp".
 */
export default function ChatScreen({ route, navigation }) {
  const [replyingMessage, setReplyingMessage] = useState(null);

  const { nameG, avatarG } = route.params;

  const { conversationId } = route.params;
  const [conversation, setConversation] = useState(null);
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentChannelId, setCurrentChannelId] = useState(null);
  const [channels, setChannels] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [reactDetailModalVisible, setReactDetailModalVisible] = useState(false);
  const [selectedReactors, setSelectedReactors] = useState([]);
  const [showVoteModal, setVoteShowModal] = useState(false);
  const [showVotedModal, setVotedModal] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [showRecordModal, setRecordModal] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [members, setMembers] = useState(null);
  const [memberTags, setMemberTags] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [isRemoved, setIsRemoved] = useState(false);
  const [canRecall, setCanRecall] = useState(false);

  const [readMess, setReadMess] = useState(true);
  const [forwardadndDelete, setForwardandDelete] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await axios.get(`/api/messages/${conversationId}`);
      const full = dedupeMessages(res.data);

      const withReplies = full.map((msg) => ({
        ...msg,
        replyToMessage: msg.replyMessageId
          ? full.find(
              (m) => m._id === (msg.replyMessageId._id || msg.replyMessageId)
            )
          : undefined,
      }));

      setAllMessages(withReplies);
      setMessages(withReplies.slice(-40));
    };
    load();
  }, [conversationId]);

  const handleReadMessage = async () => {
    if (!selectedMessage || selectedMessage.type !== "TEXT") return;

    try {
      const res = await axios.post("/api/messages/tts", {
        text: selectedMessage.content,
      });

      const { url } = res.data;

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message);
    } finally {
      setModalVisible(false);
    }
  };

  const handleChannelChange = (channelId) => {
    setCurrentChannelId(channelId);
    fetchAllMessages(channelId);
  };

  const emojiToType = {
    "👍": 0,
    "❤️": 1,
    "😆": 2,
    "😮": 3,
    "😢": 4,
    "😣": 5,
    "🤗": 6,
  };

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
    const fetchConversation = async () => {
      try {
        const response = await axios.get(
          `/api/conversations/${conversationId}`
        );
        setConversation(response.data);
      } catch (error) {
        Alert.alert(
          "Error",
          "Unable to fetch conversation: " +
            (error.response?.data?.message || error.message)
        );
      }
    };

    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);
  const fetchChannels = async () => {
    try {
      const response = await axios.get(`/api/channels/${conversationId}`);
      setChannels(response.data);

      if (response.data.length > 0) {
        setCurrentChannelId(response.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
      Alert.alert(
        "Error fetching channels",
        error.response?.data?.message || error.message
      );
    }
  };
  useEffect(() => {
    fetchChannels();
    if (conversation?.type) {
      fetchChannels();
    }
  }, [conversation, conversationId]);
  const fetchAllMessages = async (channelId = null) => {
    if (!conversationId) return;
    try {
      const endpoint = channelId
        ? `/api/messages/channel/${channelId}`
        : `/api/messages/${conversationId}`;
      const { data } = await axios.get(endpoint);
      const full = dedupeMessages(data);

      const withReplies = full.map((msg) => {
        // unify parent reference
        let parentId =
          msg.replyTo ||
          (msg.replyMessageId &&
            (typeof msg.replyMessageId === "object"
              ? msg.replyMessageId._id
              : msg.replyMessageId)) ||
          null;

        return {
          ...msg,
          replyToId: parentId,
          replyToMessage: parentId
            ? full.find((m) => m._id === parentId)
            : undefined,
        };
      });

      setAllMessages(withReplies);
      setMessages(withReplies.slice(-40));
    } catch (error) {
      Alert.alert(
        "Error fetching messages",
        error.response?.data?.message || error.message
      );
    }
  };

  useEffect(() => {
    if (currentChannelId) {
      fetchAllMessages(currentChannelId);
    } else {
      fetchAllMessages();
    }
  }, [currentChannelId, conversationId]);

  const handleMessageLongPress = useCallback((message) => {
    setSelectedMessage(message);
    setModalVisible(true);
  }, []);

  useEffect(() => {
    const load = async () => {
      const res = await axios.get(`/api/messages/${conversationId}`);
      const full = dedupeMessages(res.data);

      // Attach replyToMessage for reply preview
      const withReplies = full.map((msg) => ({
        ...msg,
        replyToMessage: msg.replyMessageId
          ? full.find(
              (m) => m._id === (msg.replyMessageId._id || msg.replyMessageId)
            )
          : undefined,
      }));

      setAllMessages(withReplies);
      setMessages(withReplies.slice(-40)); // or adjust window as you like
    };
    load();
  }, [conversationId]);

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

  useEffect(() => {
    const handleRecallS = (message) => {
      if (!isRemoved) return;

      setMessages((prev) =>
        prev.map((m) =>
          m._id === message._id
            ? {
                ...m,
                content: "Tin nhắn đã được thu hồi",
                isDeleted: true,
                type: "RECALL",
                updatedAt: message.updatedAt,
              }
            : m
        )
      );
    };

    const handleLeaveConversation = (data) => {
      console.log("Data received from MEMBER_REMOVED event:", data);
      if (data.conversationId === conversationId) {
        setIsRemoved(false);
      }
    };

    socket.on(SOCKET_EVENTS.MESSAGE_RECALLED, handleRecallS);
    socket.on(SOCKET_EVENTS.MEMBER_REMOVED, handleLeaveConversation);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_RECALLED, handleRecallS);
      socket.off(SOCKET_EVENTS.MEMBER_REMOVED, handleLeaveConversation);
    };
  }, [socket, conversationId, setMessages, isRemoved]);

  const isPinned = async (msg) => {
    try {
      const response = await axios.get(`/api/pin-messages/${conversationId}`);

      const listPinMess = response.data;
      return listPinMess.some((p) => p.messageId === msg._id);
    } catch (err) {
      console.log(err);
    }
  };

  const isMessagePinned = (messageId) => {
    return pinnedMessages.some((pm) => pm.messageId === messageId);
  };

  const fetchPinnedMessages = async () => {
    try {
      const response = await axios.get(`/api/pin-messages/${conversationId}`);
      setPinnedMessages(response.data);
    } catch (err) {
      console.error("Error fetching pinned messages:", err);
    }
  };

  useEffect(() => {
    if (conversationId) {
      fetchPinnedMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    const handlePinMessagesS = (message) => {
      if (!isRemoved) return;
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === message.messageId ? { ...msg, isPinned: true } : msg
        )
      );
    };

    const handleLeaveConversation = (data) => {
      if (data.conversationId === conversationId) {
        setIsRemoved(false);
      }
    };

    socket.on(SOCKET_EVENTS.PIN_MESSAGE, handlePinMessagesS);
    socket.on(SOCKET_EVENTS.MEMBER_REMOVED, handleLeaveConversation);

    return () => {
      socket.off(SOCKET_EVENTS.PIN_MESSAGE, handlePinMessagesS);
      socket.off(SOCKET_EVENTS.MEMBER_REMOVED, handleLeaveConversation);
    };
  }, [socket, conversationId, setMessages, isRemoved]);

  const handlePinMessages = async (message) => {
    if (!message) return;

    try {
      const isPinned = isMessagePinned(message._id);

      if (isPinned) {
        await handleUnpinMessage(message._id);
        return;
      }

      const response = await axios.post("/api/pin-messages", {
        messageId: message._id,
        conversationId: message.conversationId,
        pinnedBy: memberId,
      });

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === message._id ? { ...msg, isPinned: true } : msg
        )
      );

      // Cập nhật danh sách pinned messages
      setPinnedMessages((prev) => [...prev, response.data]);
    } catch (err) {
      console.error("Lỗi khi thao tác ghim:", err.message);
    }
  };

  useEffect(() => {
    const handleUnpinS = (message) => {
      if (!isRemoved) return;
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === message.messageId ? { ...msg, isPinned: false } : msg
        )
      );
    };
    const handleLeaveConversation = (data) => {
      if (data.conversationId === conversationId) {
        setIsRemoved(false);
      }
    };
    socket.on(SOCKET_EVENTS.UNPIN_MESSAGE, handleUnpinS);
    socket.on(SOCKET_EVENTS.MEMBER_REMOVED, handleLeaveConversation);

    return () => {
      socket.off(SOCKET_EVENTS.UNPIN_MESSAGE, handleUnpinS);
      socket.off(SOCKET_EVENTS.MEMBER_REMOVED, handleLeaveConversation);
    };
  }, [socket, conversationId, setMessages, isRemoved]);

  const handleUnpinMessage = async (messageId) => {
    try {
      const memberResponse = await axios.get(
        `/api/members/${conversationId}/${userId}`
      );

      const memberId = memberResponse.data.data?._id;

      await axios.delete(`/api/pin-messages/${messageId?._id}/${memberId}`);

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId?._id ? { ...msg, isPinned: false } : msg
        )
      );
      setPinnedMessages((prevPinnedMessages) =>
        prevPinnedMessages.filter((msg) => msg.messageId !== messageId)
      );

      setModalVisible(false);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể gỡ ghim tin nhắn");
    }
  };

  // function PinnedMessagesSection({ pinnedMessages }) {
  //     if (!pinnedMessages || pinnedMessages.length === 0) {
  //         return null;
  //     }

  //     return (
  //         <View style={pinnedMessageStyles.container}>
  //             <ScrollView horizontal showsHorizontalScrollIndicator={false}>

  //                 <View key={pinnedMessages._id} style={pinnedMessageStyles.messageItem}>
  //                     <Text style={pinnedMessageStyles.messageContent} numberOfLines={1}>
  //                         {pinnedMessages.content || "Nội dung đã ghim"}
  //                     </Text>
  //                     <Text style={pinnedMessageStyles.pinnedBy}>
  //                         Được ghim bởi {pinnedMessages.pinnedBy.name || "ai đó"}
  //                     </Text>
  //                 </View>

  //             </ScrollView>
  //         </View>
  //     );
  // }

  // const pinnedMessageStyles = StyleSheet.create({
  //     container: {
  //         width: '100%',
  //         minHeight: 50,
  //         backgroundColor: 'white',
  //         backgroundColor: "#D8EDFF",
  //         height: 'auto',
  //     },
  //     title: {
  //         fontSize: 12,
  //         fontWeight: '600',
  //         color: '#666',
  //         marginBottom: 4,
  //     },
  //     messageItem: {
  //         backgroundColor: '#f0f8ff',
  //         paddingVertical: 6,
  //         paddingHorizontal: 12,
  //         borderRadius: 16,
  //         marginRight: 8,
  //         borderWidth: 1,
  //         borderColor: '#e0e0e0',
  //         width: '100%',
  //         maxWidth: '100%',
  //     },
  //     messageContent: {
  //         fontSize: 14,
  //         fontWeight: '500',
  //     },
  //     pinnedBy: {
  //         fontSize: 10,
  //         color: '#888',
  //         marginTop: 2,
  //     }
  // });

  const checkaddChannel = (conversation, memberId) => {
    if (conversation?.leaderId === memberId?.toString()) return true;
    if (!conversation?.managerIds || conversation.managerIds.length === 0) {
      return false;
    }
    if (!memberId) {
      return false;
    }

    return conversation.managerIds.some(
      (id) => id?.toString() === memberId?.toString()
    );
  };

  function HeaderSingleChat({
    handleAddChannel,
    checkaddChannel,
    onChannelChange,
    nameG,
    avatarG,
    conversationId,
    currentChannelId,
  }) {
    const navigation = useNavigation();

    const handleChannelPress = (channelId) => {
      onChannelChange(channelId);
    };

    return (
      <View style={headerStyles.container}>
        <View style={headerStyles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={headerStyles.backBtnContainer}
          >
            <Image source={Return} style={headerStyles.backBtn} />
          </TouchableOpacity>

          <Image source={{ uri: avatarG }} style={headerStyles.avatar} />

          <View style={headerStyles.infoContainer}>
            <Text style={headerStyles.name}>{nameG}</Text>
            <View style={headerStyles.statusContainer}></View>
          </View>

          <View style={headerStyles.iconsContainer}>
            <TouchableOpacity
              style={headerStyles.iconButton}
              onPress={() => {
                navigation.navigate("CallScreen", {
                  conversationId,
                  channelId: currentChannelId,
                });
              }}
            >
              <Image source={CallIcon} style={headerStyles.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={headerStyles.iconButton}
              onPress={async () => {
                try {
                  // get userId from storage (adjust as needed)
                  const userId = await AsyncStorage.getItem("userId");
                  // fetch member info
                  const res = await axios.get(
                    `/api/conversations/${conversationId}/members`
                  );
                  // find current member
                  const currentMember = res.data.find(
                    (m) => m.userId === userId
                  );
                  if (!currentMember) {
                    Toast.show({
                      type: "error",
                      text1: "You are not a member of this group.",
                    });
                    return;
                  }
                  if (currentMember.active === false) {
                    Toast.show({
                      type: "error",
                      text1:
                        "You are no longer an active member of this group.",
                    });
                    return;
                  }
                  // navigate if all ok
                  navigation.navigate("GroupDetailScreen", { conversationId });
                } catch (err) {
                  Toast.show({
                    type: "error",
                    text1: "Cannot check membership status",
                  });
                }
              }}
            >
              <Image source={DetailChatIcon} style={headerStyles.icon} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={headerStyles.channelsContainer}>
          <View style={{ width: 200, height: "100%" }}>
            <ScrollView
              horizontal={true}
              style={{ width: "100%", maxHeight: 300, flexDirection: "row" }}
            >
              {channels.map((channel) => (
                <TouchableOpacity
                  key={channel._id}
                  onPress={() => handleChannelPress(channel._id)}
                  style={[
                    headerStyles.channelButton,
                    currentChannelId === channel._id &&
                      headerStyles.channelSelected,
                  ]}
                >
                  <Text
                    style={[
                      headerStyles.channelText,
                      currentChannelId === channel._id &&
                        headerStyles.channelTextSelected,
                    ]}
                  >
                    {channel.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {checkaddChannel(conversation, memberId) && (
            <TouchableOpacity
              style={{ position: "absolute", right: 5, top: 10 }}
              onPress={() => handleAddChannel()}
            >
              <Image source={addChannel} style={{ height: 20, width: 20 }} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const headerStyles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderColor: "#ccc",
      marginTop: 10,
      height: "auto",
    },
    headerContent: {
      paddingTop: 10,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    backBtnContainer: {
      justifyContent: "center",
      alignItems: "center",
      width: 30,
      height: 35,
      marginRight: 20,
    },
    backBtn: {
      width: "80%",
      height: "80%",
      resizeMode: "contain",
    },
    avatar: { width: 45, height: 45, borderRadius: 35 },
    infoContainer: { marginLeft: 12, flex: 1, width: 300 },
    name: { fontSize: 15, fontWeight: "600", color: "#086DC0" },
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    statusDot: {
      width: 10,
      height: 10,
      backgroundColor: "#00F026",
      borderRadius: 5,
    },
    statusText: { fontSize: 14, marginLeft: 6, color: "#333" },

    channelsContainer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 10,
    },
    channelButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: "#ccc",
      borderRadius: 15,
      marginRight: 8,
      marginBottom: 8,
      alignItems: "center",
    },
    channelSelected: {
      backgroundColor: "#086DC0",
    },
    channelText: {
      color: "#fff",
      fontSize: 14,
    },

    iconsContainer: { flexDirection: "row" },
    iconButton: { padding: 8, marginLeft: 8 },
    icon: { width: 15, height: 15, resizeMode: "contain" },
  });

  const handleDeleteAction = async () => {
    if (!selectedMessage) return;

    try {
      setMessages((prev) => prev.filter((m) => m._id !== selectedMessage._id));
      await axios.delete(`/api/messages/${selectedMessage._id}/only`, {
        data: {
          conversationId: conversationId,
        },
      });
    } catch (error) {
      console.error("Error deleting message:", error);

      Alert.alert("Lỗi", "Không thể xóa tin nhắn. Vui lòng thử lại sau.");
    } finally {
      setModalVisible(false);
    }
  };

  const handleForwardAction = () => {
    Alert.alert("Chuyển tiếp", "Forward action triggered.");
    setModalVisible(false);
  };

  const pickImage = async () => {
    const formData = new FormData();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission denied", "Gallery access needed.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      const selectedImage = result.assets[0];

      const imageUri = selectedImage.uri;
      const fileName = selectedImage.uri.split("/").pop(); // Lấy tên file từ URI
      const mimeType = selectedImage.mimeType;

      const file = {
        uri: imageUri,
        name: fileName,
        type: mimeType,
      };

      formData.append("id", userId);
      formData.append("image", file);
      formData.append("conversationId", conversationId);

      try {
        // Gửi tệp lên server
        const response = await axios.post("/api/messages/images", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 20000,
        });

        const imageUrl = response.data?.file?.url;
        const newMsg = {
          _id: String(Date.now()),
          memberId: { userId: userId || "" },
          type: "IMAGE",
          content: imageUrl,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMsg]);
      } catch (err) {
        Alert.alert("Error", "Failed to upload image");
      }
    }
  };

  const pickMedia = async () => {
    const formData = new FormData();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission denied", "Gallery access needed.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Cho phép chọn cả Images và Videos
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedMedia = result.assets[0];
      const mediaUri = selectedMedia.uri;
      const fileName = selectedMedia.uri.split("/").pop();
      const mimeType =
        selectedMedia.mimeType ||
        (selectedMedia.type === "video" ? "video/mp4" : "image/jpeg");

      const file = {
        uri: mediaUri,
        name: fileName,
        type: mimeType,
      };

      formData.append("id", userId);
      formData.append(selectedMedia.type === "video" ? "video" : "image", file);
      formData.append("conversationId", conversationId);
      formData.append("channelId", currentChannelId);

      try {
        const endpoint =
          selectedMedia.type === "video"
            ? "/api/messages/video"
            : "/api/messages/images";
        const response = await axios.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: selectedMedia.type === "video" ? 30000 : 20000,
        });

        const content =
          selectedMedia.type === "video"
            ? response.data.content
            : response.data[0]?.content;

        const newMsg = {
          _id: String(Date.now()),
          memberId: { userId: userId || "" },
          type: selectedMedia.type === "video" ? "VIDEO" : "IMAGE",
          content: content,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMsg]);
      } catch (err) {
        console.error(`Error uploading ${selectedMedia.type}:`, err);
        Alert.alert("Error", `Failed to upload ${selectedMedia.type}`);
      }
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (
        (result.canceled === false &&
          result.assets &&
          result.assets.length > 0) ||
        result.type === "success"
      ) {
        let file, fileName, fileUri, mimeType;

        if (result.assets && result.assets.length > 0) {
          file = result.assets[0];
          fileUri = file.uri;
          fileName = file.name;
          mimeType = file.mimeType || "application/octet-stream";
        } else if (result.type === "success") {
          fileUri = result.uri;
          fileName = result.name;
          mimeType = "application/octet-stream";
        } else {
          throw new Error("Không thể đọc thông tin file");
        }

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          Alert.alert("Error", "File not found.");
          return;
        }

        const formData = new FormData();
        formData.append("id", userId);
        formData.append("conversationId", conversationId);
        formData.append("channelId", currentChannelId);

        formData.append("file", {
          uri: fileUri,
          name: fileName,
          type: mimeType,
        });

        const newMsg = await axios.post("/api/messages/file", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 8000,
        });
        const newMsg1 = {
          _id: String(Date.now()),
          memberId: { userId: userId || "" },
          type: "FILE",
          content: fileName,
          fileName: fileName,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMsg1]);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Alert.alert("Upload error", "Không thể upload file.");
    }
  };

  const handleOpenVoteModal = async (msg) => {
    try {
      setSelectedMessage(msg);
      setVotedModal(true);
    } catch (error) {}
  };

  const handlePressEmoji = async (msg) => {
    try {
      const reactors = await Promise.all(
        msg.reacts.map(async (react) => {
          const member = await handleGetMember(react.memberId);
          return {
            ...member,
            type: react.type,
          };
        })
      );

      setSelectedReactors(reactors);
      setReactDetailModalVisible(true);
    } catch (err) {
      console.log(err);
    }
  };

  const handleGetMember = async (memberId) => {
    try {
      const response = await axios.get(`/api/members/member/${memberId._id}`);

      return response.data.data;
    } catch (error) {
      console.error("Failed to get member:", error);
      throw error;
    }
  };

  useEffect(() => {
    const handleReactS = (message) => {
      setMessages((prevMessages) =>
        prevMessages.map((m) =>
          m._id === message._id
            ? { ...m, reacts: message?.reacts || m.reacts }
            : m
        )
      );
    };
    socket.on(SOCKET_EVENTS.REACT_TO_MESSAGE, handleReactS);
    return () => {
      socket.off(SOCKET_EVENTS.REACT_TO_MESSAGE, handleReactS);
    };
  }, [socket]);

  const handleReact = async (message, reactType) => {
    try {
      const response = await axios.post("/api/messages/react", {
        conversationId: message.conversationId,
        messageId: message._id,
        reactType: reactType,
      });

      //socket.emit phát sự kiện
      // socket.on lắng nghe
    } catch (error) {
      console.error(
        "Failed to send react:",
        error.response?.data || error.message
      );
    }
  };

  const checkTagsWithPosition = (message, members) => {
    const tagRegex = /@[a-zA-ZÀ-ỹ]+(?:\s[a-zA-ZÀ-ỹ]+)*/g;
    const tags = [...message.matchAll(tagRegex)];

    const tagPositions = [];
    const seenIds = new Set();
    const validTags = [];

    const normalize = (str) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    tags.forEach((match) => {
      const tagText = match[0];
      const tagName = tagText.substring(1).trim();
      const start = match.index;
      const end = start + tagText.length;

      if (!tagName) return;

      const member = members.find(
        (m) => normalize(m.name) === normalize(tagName)
      );

      if (!member) return;

      const memberId = String(member._id);

      if (!seenIds.has(memberId)) {
        validTags.push(memberId);
        seenIds.add(memberId);
      }

      tagPositions.push({
        memberId,
        start,
        end,
        name: member.name,
      });
    });

    return { validTags, tagPositions };
  };

  const handleSendMessage = useCallback(async (message, members) => {
    if (!isRemoved) {
      Alert.alert("Lỗi", "Bạn không còn trong nhóm này");
      return;
    }
    if (!message.trim()) return;

    if (!userId) {
      Alert.alert(
        "User not loaded",
        "Unable to send message without a valid user."
      );
      return;
    }

    try {
      const { validTags, tagPositions } = checkTagsWithPosition(
        message,
        members
      );

      const newMessage = {
        _id: String(Date.now()), // temporary id
        memberId: { userId: userId },
        type: "TEXT",
        content: message,
        createdAt: new Date().toISOString(),
        pending: true,
        replyTo: replyingMessage ? replyingMessage._id : undefined,
        replyToMessage: replyingMessage || undefined,
        replyMessageId: replyingMessage?._id || undefined,
      };

      if (replyingMessage) {
        newMessage.replyTo = replyingMessage._id;
        newMessage.replyToMessage = replyingMessage;
      }

      setMessages((prev) => [...prev, newMessage]);
      setReplyingMessage(null);

      const payload = {
        userId: userId,
        conversationId: conversationId,
        content: message,
        channelId: currentChannelId,
      };
      if (replyingMessage) payload.replyTo = replyingMessage._id;
      if (replyingMessage) payload.replyMessageId = replyingMessage._id;

      if (validTags.length > 0) {
        payload.tags = validTags;
        payload.tagPositions = tagPositions;
      }

      await axios.post("/api/messages/text", payload);

      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
        conversationId: conversationId,
        content: message,
        channelId: currentChannelId,
        replyTo: replyingMessage ? replyingMessage._id : undefined,
      });
    } catch (err) {
      Alert.alert(
        "Cannot send message",
        err.response?.data?.message || err.message
      );
    }
  });

  // useEffect(() => {
  //     if (isRemoved) {
  //         socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, conversationId);

  //         Alert.alert("Thông báo", "Bạn đã bị xóa khỏi nhóm");
  //         navigation.goBack();
  //     }
  // }, [isRemoved]);

  useEffect(() => {
    if (!socket || !conversationId || !isRemoved) return;

    const receiveHandler = (message) => {
      if (!isRemoved) return;
      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => !(m.pending && m.content === message.content)
        );

        if (message.replyMessageId) {
          const replyToId =
            typeof message.replyMessageId === "object"
              ? message.replyMessageId._id
              : message.replyMessageId;
          message.replyToMessage = prev.find((m) => m._id === replyToId);
        }

        const existingIndex = filtered.findIndex((m) => m._id === message._id);

        if (existingIndex !== -1) {
          const newMessages = [...filtered];
          newMessages[existingIndex] = message;
          return newMessages;
        }

        return [...filtered, message];
      });
    };

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
    socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, conversationId);

    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
      socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, conversationId);
    };
  }, [socket, conversationId, userId, isRemoved]);

  const handleCreatePoll = () => {
    fetchAllMessages(currentChannelId);
    setVoteShowModal(false);
  };
  const handleVoteSubmit = (updatedVoteMessage) => {
    if (!updatedVoteMessage) {
      console.error("Không nhận được dữ liệu vote cập nhật");
      return;
    }
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg._id === updatedVoteMessage._id
          ? {
              ...msg,
              options: updatedVoteMessage.options || msg.options,
            }
          : msg
      )
    );
  };

  useEffect(() => {
    const fetchMemberId = async () => {
      if (conversationId && userId) {
        try {
          const res = await axios.get(
            `/api/members/${conversationId}/${userId}`
          );
          const member = res.data.data;

          setIsRemoved(res.data.data.active);
          setMemberId(member._id);
        } catch (err) {
          console.error("Lỗi lấy memberId:", err);
        }
      }
    };

    fetchMemberId();
  }, [conversationId, userId]);

  const openCreateChannel = () => {
    setShowAddChannel(true);
  };
  const handleCreateChannel = async (newChannelName) => {
    await fetchChannels();
  };

  const fetchMembersInConversation = async () => {
    try {
      const res = await axios.get(`/api/members/${conversationId}`);
      const members = res.data.data;
      setMembers(members);
    } catch (err) {
      console.error("Lỗi lấy members:", err);
    }
  };

  useEffect(() => {
    fetchMembersInConversation();
  }, [conversationId]);

  useEffect(() => {
    if (members && memberId) {
      const filteredMembers = members.filter(
        (member) => String(member._id) !== String(memberId)
      );
      setMemberTags(filteredMembers);
    }
  }, [members, memberId]);

  useEffect(() => {
    const handleRemoveEvent = (data) => {
      if (data.memberId === memberId) {
        setIsRemoved(false);
        socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, conversationId);
      }
    };

    socket.on(SOCKET_EVENTS.MEMBER_REMOVED, handleRemoveEvent);

    return () => {
      socket.off(SOCKET_EVENTS.MEMBER_REMOVED, handleRemoveEvent);
    };
  }, [memberId, conversationId]);

  useEffect(() => {
    const handleAddGroup = () => {
      setIsRemoved(true);
    };
    socket.on(SOCKET_EVENTS.MEMBER_ADDED, handleAddGroup);
    return () => {
      socket.off(SOCKET_EVENTS.MEMBER_ADDED, handleAddGroup);
    };
  }, [socket]);

  const checkRecall = () => {
    if (selectedMessage === null) return false;
    const mb = selectedMessage.memberId.userId;
    return mb === userId;
  };
  useEffect(() => {
    const result = checkRecall();
    setCanRecall(result);
  }, [selectedMessage, userId]);

  useEffect(() => {
    if (
      selectedMessage === null ||
      !["FILE", "IMAGE", "VIDEO", "VOTE"].includes(selectedMessage.type)
    ) {
      setReadMess(true);
    } else {
      setReadMess(false);
    }
  }, [selectedMessage, setReadMess]);

  useEffect(() => {
    if (selectedMessage === null || !["VOTE"].includes(selectedMessage.type)) {
      setForwardandDelete(true);
    } else {
      setForwardandDelete(false);
    }
  }, [selectedMessage, setForwardandDelete]);
  return (
    <View style={chatScreenStyles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <HeaderSingleChat
          handleAddChannel={openCreateChannel}
          checkaddChannel={checkaddChannel}
          onChannelChange={handleChannelChange}
          nameG={nameG}
          avatarG={avatarG}
          conversationId={conversationId}
          currentChannelId={currentChannelId}
        />
        <View style={chatScreenStyles.chatContainer}>
          <ChatBox
            messages={messages}
            allMessages={allMessages}
            currentUserId={userId}
            onMessageLongPress={handleMessageLongPress}
            handlePressEmoji={handlePressEmoji}
            isPinned={isPinned}
            handleOpenVoteModal={handleOpenVoteModal}
            channelId={channels}
          />
        </View>
        {replyingMessage && (
          <View style={styles.replyPreview}>
            <View style={styles.replyLeftAccent} />
            <View style={styles.replyContent}>
              <Text style={styles.replyTitle}>
                Trả lời {replyingMessage.memberId.name}
              </Text>
              <Text
                style={styles.replySnippet}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {replyingMessage.content}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingMessage(null)}>
              <Text style={styles.replyCloseText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
        {isRemoved ? (
          <MessageInput
            input={input}
            setInput={setInput}
            onSend={handleSendMessage}
            onPickMedia={pickMedia}
            onPickFile={pickDocument}
            onEmojiPress={() => setEmojiOpen(true)}
            onModalReact={handlePressEmoji}
            onVotePress={() => setVoteShowModal(true)}
            onRecord={() => setRecordModal(true)}
            membersinconversation={members}
            memberNames={memberTags}
          />
        ) : (
          <Text style={{ textAlign: "center", padding: 10, color: "gray" }}>
            Hiện bạn đã bị xoá khỏi nhóm và không thể trả lời.
          </Text>
        )}
        <EmojiPicker
          onEmojiSelected={(emoji) => setInput((prev) => prev + emoji.emoji)}
          open={emojiOpen}
          onClose={() => setEmojiOpen(false)}
        />
        <CreateVoteModal
          visible={showVoteModal}
          channelId={currentChannelId}
          conversationId={conversation}
          memberId={memberId}
          onClose={() => setVoteShowModal(false)}
          onCreate={handleCreatePoll}
        />
        <VotedModal
          visible={showVotedModal}
          onClose={() => setVotedModal(false)}
          message={selectedMessage}
          memberId={memberId}
          onSubmit={handleVoteSubmit}
          conversation={conversation}
        />

        <VoiceRecordModal
          isVisible={showRecordModal}
          onClose={() => setRecordModal(false)}
          conversationId={conversationId}
          channelId={currentChannelId}
          onSendRecord={(uri) => fetchAllMessages(currentChannelId)}
        />

        <AddNewChannel
          visible={showAddChannel}
          onCancel={() => setShowAddChannel(false)}
          onCreate={handleCreateChannel}
          memberId={memberId}
          conversation={conversationId}
        />

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
              <View
                style={{
                  width: 300,
                  backgroundColor: "#fff",
                  justifyContent: "center",
                  alignItems: "center",
                  paddingBottom: 10,
                  paddingLeft: 10,
                  paddingRight: 10,
                  borderRadius: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    alignItems: "center",
                    width: "100%",
                    marginTop: 10,
                  }}
                >
                  {["👍", "❤️", "😆", "😮", "😢", "😣", "🤗"].map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => {
                        const type = emojiToType[emoji];
                        handleReact(selectedMessage, type);
                        setModalVisible(false);
                      }}
                      style={{
                        width: 30,
                        height: 30,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 25 }}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View
                style={{
                  width: 300,
                  height: "auto",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  marginTop: 10,
                  backgroundColor: "#fff",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                {forwardadndDelete && (
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleDeleteAction}
                  >
                    <View>
                      <Image
                        source={require("../icons/Delete.png")}
                        style={{ width: 25, height: 25 }}
                      />
                    </View>
                    <Text style={styles.modalButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
                {forwardadndDelete && (
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleForwardAction}
                  >
                    <View>
                      <Image
                        source={require("../icons/forward.png")}
                        style={{ width: 25, height: 25 }}
                      />
                    </View>
                    <Text style={styles.modalButtonText}>Forward</Text>
                  </TouchableOpacity>
                )}
                {readMess && (
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleReadMessage}
                  >
                    <View>
                      <Image
                        source={require("../icons/reply.png")}
                        style={{ width: 25, height: 25 }}
                      />
                    </View>
                    <Text style={styles.modalButtonText}>Read Mesage</Text>
                  </TouchableOpacity>
                )}
                {forwardadndDelete && (
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setReplyingMessage(selectedMessage);
                      setModalVisible(false);
                    }}
                  >
                    <View>
                      <Image
                        source={require("../icons/reply.png")}
                        style={{ width: 25, height: 25 }}
                      />
                    </View>
                    <Text style={styles.modalButtonText}>Reply</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    if (
                      selectedMessage &&
                      isMessagePinned(selectedMessage._id)
                    ) {
                      handleUnpinMessage(selectedMessage);
                    } else {
                      handlePinMessages(selectedMessage);
                    }
                  }}
                >
                  <Text style={styles.modalButtonText}>
                    {selectedMessage &&
                    isMessagePinned(selectedMessage?._id) ? (
                      <View style={{ alignItems: "center" }}>
                        <View>
                          <Image
                            source={require("../icons/Unpin.png")}
                            style={{ width: 25, height: 25 }}
                          />
                        </View>
                        <Text style={styles.modalButtonText}>
                          Un pin message
                        </Text>
                      </View>
                    ) : (
                      <View style={{ alignItems: "center" }}>
                        <View>
                          <Image
                            source={require("../icons/Pin_action.png")}
                            style={{ width: 25, height: 25 }}
                          />
                        </View>
                        <Text style={styles.modalButtonText}>Pin message</Text>
                      </View>
                    )}
                  </Text>
                </TouchableOpacity>
                {canRecall && (
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleRecallAction}
                  >
                    <View>
                      <Image
                        source={require("../icons/undo.png")}
                        style={{ width: 25, height: 25 }}
                      />
                    </View>
                    <Text style={styles.modalButtonText}>Recall</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={reactDetailModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setReactDetailModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Người đã thả:</Text>

              <FlatList
                data={selectedReactors}
                keyExtractor={(item) => item.userId}
                renderItem={({ item }) => {
                  const emojiMap = {
                    0: "👍", // Like
                    1: "❤️", // Love
                    2: "😆", // Haha
                    3: "😮", // Wow
                    4: "😢", // Sad
                    5: "😣", // Angry
                    6: "🤗", // Care
                  };

                  const emoji = emojiMap[item.type];

                  return (
                    <View style={styles.reactorItem}>
                      {item.avatar && (
                        <Image
                          source={{ uri: item.avatar }}
                          style={styles.avatar}
                        />
                      )}
                      <Text style={styles.reactorName}>
                        {item.name} đã thả {emoji}
                      </Text>
                    </View>
                  );
                }}
              />

              <TouchableOpacity
                onPress={() => setReactDetailModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const chatScreenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#D8EDFF", height: 10 },
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
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 10,
    width: "80%",
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  modalButton: {
    width: "30%",
    alignItems: "center",
    marginBottom: 10,
  },
  modalButtonText: {
    fontSize: 12,
    textAlign: "center",
  },
  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    padding: 8,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
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
    color: "#086DC0",
    marginBottom: 2,
  },
  replySnippet: {
    fontSize: 14,
    color: "#333",
  },
  replyCloseText: {
    fontSize: 16,
    color: "#999",
    marginLeft: 8,
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
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 20, marginBottom: 10 },
  reactBar: { flexDirection: "row", gap: 10 },
  reactButton: { padding: 10, backgroundColor: "#eee", borderRadius: 8 },
  emoji: { fontSize: 24 },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  reactorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  avatar: { fontSize: 20, marginRight: 10 },
  closeButton: { marginTop: 15, alignSelf: "center" },
  closeText: { color: "blue" },
});
