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
    FlatList,
    KeyboardAvoidingView
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';


import axios from "../api/apiConfig";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import EmojiPicker, { tr } from "rn-emoji-keyboard";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { socket } from "../utils/socketClient";
import { SOCKET_EVENTS } from "../utils/constant";
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
dayjs.extend(relativeTime);
import { Video } from "expo-av";
import CreateVoteModal from "./CreateVoteModal";
import VotedModal from './VotedModal';
import VoiceRecordModal from "./VoiceRecordModal";
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AddNewChannel from './AddChannelModal';


const AvatarImage = require("../Images/avt.png");
const CallIcon = require("../assets/Call.png");
const VideoCallIcon = require("../assets/VideoCall.png");
const DetailChatIcon = require("../icons/userdetail.png");
const FileIcon = require("../icons/paperclip.png");
const PictureIcon = require("../icons/picture.png");
const EmojiIcon = require("../icons/emoji.png");
const SendIcon = require("../icons/send.png");
const Return = require("../icons/back.png");
const MicIcon = require("../icons/mic.png");
const addChannel = require("../icons/addChannel.png")
/**
 * Message Bubble Component with support for onLongPress to show message options.
 */
const MessageItem = React.memo(({ msg, showAvatar, showTime, currentUserId, onLongPress, handlePressEmoji, isPinned, handleOpenVoteModal }) => {
    const isMe = msg.memberId?.userId === currentUserId;
    const content = msg.content || "";
    console.log(msg.content);
    const MAX_TEXT_LENGTH = 350;
    const centerAlignedTypes = ["VOTE", "NOTIFY"];
    const isCenterAligned = centerAlignedTypes.includes(msg.type);
    const Container = onLongPress ? TouchableOpacity : View;
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const emojiMap = {
        1: '❤️',
        2: '😂',
        3: '😢',
        4: '👍',
        5: '👎',
        6: '😮',
    };
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

    const [pinned, setPinned] = useState(false);

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
            <View style={[messageItemStyles.container, messageItemStyles.centerAlign]}>
                <Text style={messageItemStyles.notifyText}>
                    {msg.content}
                </Text>
            </View>
        );
    }


    const lastDotIndex = msg.content.lastIndexOf('.');
    const ext = lastDotIndex !== -1 ? msg.content.slice(lastDotIndex + 1).toLowerCase() : '';
    useEffect(() => {
        if (ext !== 'm4a') return;  // chỉ chạy nếu ext là m4a

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
                    sound.setOnPlaybackStatusUpdate(status => {
                        if (status.didJustFinish) {
                            setIsPlaying(false);
                        }
                    });
                }
            } catch (error) {
                console.error('Lỗi khi load audio:', error);
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
                // Nếu chưa load audio thì load trước
                await loadAudio();
            }
        } catch (error) {
            console.error('Lỗi khi phát audio:', error);
        }
    };


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
            {!isCenterAligned && (showAvatar ? (
                <Image source={AvatarImage} style={messageItemStyles.avatar} />
            ) : (
                <View style={messageItemStyles.avatarPlaceholder} />
            ))}

            <View style={messageItemStyles.contentContainer}>
                {pinned && (
                    <Text
                        style={[
                            messageItemStyles.pinnedText,
                            isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
                        ]}
                    >
                        📌 Đã ghim
                    </Text>
                )}
                {msg.type === "NOTIFY" ? (
                    <Text style={messageItemStyles.notifyText}>
                        {content}
                    </Text>
                ) :
                    msg.type === "IMAGE" ? (
                        <Image source={{ uri: content }} style={messageItemStyles.imageContent} />
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
                                    <View key={opt._id || index} style={{ position: 'relative', marginBottom: 10 }}>
                                        <TouchableOpacity
                                            style={messageItemStyles.optionButton}
                                            activeOpacity={0.7}
                                            onPress={() => console.log("Voted option:", opt.name)}
                                        >
                                            <Text style={messageItemStyles.optionText}>{opt.name}</Text>
                                        </TouchableOpacity>

                                        {opt.members?.length > 0 && (
                                            <View style={{ flexDirection: 'row', position: 'absolute', right: 10, top: 8 }}>
                                                {opt.members.slice(0, 2).map((member, i) => (
                                                    <Image
                                                        key={member._id}
                                                        source={{ uri: member.avatar || DEFAULT_AVATAR }}
                                                        style={{
                                                            width: 25,
                                                            height: 25,
                                                            borderRadius: 15,
                                                            borderWidth: 1,
                                                            borderColor: '#fff',
                                                            marginLeft: i === 0 ? 0 : -10,
                                                            zIndex: 10 - i
                                                        }}
                                                    />
                                                ))}

                                                {opt.members.length > 2 && (
                                                    <View style={{
                                                        width: 25,
                                                        height: 25,
                                                        borderRadius: 15,
                                                        backgroundColor: '#e0e0e0',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        marginLeft: -10,
                                                        borderWidth: 1,
                                                        borderColor: '#fff',
                                                        zIndex: 8
                                                    }}>
                                                        <Text style={{ fontSize: 10 }}>+{opt.members.length - 2}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>

                            <View style={messageItemStyles.fVotesRow}>
                                <TouchableOpacity style={messageItemStyles.btnVote} onPress={() => handleOpenVoteModal(msg)}>
                                    <Text>Bình chọn</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : msg.type === "FILE" ? (
                        (() => {
                            const lastDotIndex = msg.content.lastIndexOf('.');
                            const ext = lastDotIndex !== -1 ? msg.content.slice(lastDotIndex + 1).toLowerCase() : '';
                            if (ext === 'm4a') {
                                return (
                                    <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
                                        <Ionicons
                                            name={isPlaying ? 'pause' : 'play'}
                                            size={24}
                                            color="#086DC0"
                                        />
                                    </TouchableOpacity>
                                );
                            } else {
                                return (
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
                                );
                            }
                        })()
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
                            <View key={type} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
                                <Text style={messageItemStyles.emojiText}>
                                    {emojiMap[type]}
                                </Text>
                                {count > 1 && (
                                    <Text style={messageItemStyles.reactCount}>
                                        {count}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </TouchableOpacity>
                )}
                {showTime && (
                    <Text style={[messageItemStyles.timeText, isMe && { alignSelf: "flex-end" }]}>
                        {dayjs(msg.createdAt).fromNow()}
                    </Text>
                )}
            </View>
        </Container>

    );
})


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
    pinnedText: {
        fontSize: 11,
        fontWeight: "500",
        color: "#f39c12",
        marginBottom: 4,
        maxWidth: '100%',
    },
    fVotes: {
        alignSelf: 'center',
        flexWrap: 'wrap',
        width: 250,
        height: 'auto',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'grey',
        borderRadius: 10,
        padding: 10,
    },
    fVotesRow: {
        width: '100%',
        height: 'auto'
    },
    txtContent: {
        fontWeight: '600'
    },
    optionsContainer: {
        marginTop: 10,
        gap: 8,
    },

    optionButton: {
        backgroundColor: '#f1f1f1',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },

    optionText: {
        fontSize: 14,
        color: '#333',
    },

    txtContent: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    btnVote: {
        width: '100%',
        height: 30,
        backgroundColor: 'aqua',
        borderRadius: 30,
        marginTop: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    notifyText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginVertical: 8,
    },
});

/**
 * ChatBox Component to render a scrollable list of messages.
 */
function ChatBox({ messages, currentUserId, onMessageLongPress, handlePressEmoji, isPinned, handleOpenVoteModal }) {
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
    }, [messages]);

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
                const isLastInGroup = index === messages.length - 1 || nextId !== userId;
                const key = `${msg._id}-${index}`;

                return (
                    <MessageItem
                        key={key}
                        msg={msg}
                        showAvatar={isFirstInGroup}
                        showTime={isLastInGroup}
                        currentUserId={currentUserId}
                        onLongPress={() => onMessageLongPress(msg)}
                        handlePressEmoji={handlePressEmoji}
                        isPinned={isPinned}
                        handleOpenVoteModal={handleOpenVoteModal}
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
function MessageInput({ input, setInput, onSend, onPickMedia, onPickFile, onEmojiPress, onVotePress, onRecord }) {
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
                <TouchableOpacity onPress={onVotePress}  ><Text>Vote</Text></TouchableOpacity>
                <TouchableOpacity onPress={onRecord}><Image source={MicIcon} style={messageInputStyles.icon} /></TouchableOpacity>
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
});

/**
 * Header Component for the chat screen.
 */


/**
 * Main ChatScreen Component which now uses the conversation details passed in via route params.
 * Also integrates a modal for long-press message options: "Thu hồi", "Xoá" and "Chuyển tiếp".
 */
export default function ChatScreen({ route, navigation }) {
    const { conversationId } = route.params;  // Lấy conversationId từ route.params
    const [conversation, setConversation] = useState(null);
    const [userId, setUserId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    console.log(`Tin nhắn được chọn `, selectedMessage?._id)
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



    const emojiToType = {
        '❤️': 1,
        '😂': 2,
        '😢': 3,
        '👍': 4,
        '👎': 5,
        '😮': 6,
    };


    console.log(`Messages là : `, messages);
    // Lấy userId từ AsyncStorage
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

    // Fetch thông tin cuộc trò chuyện
    useEffect(() => {
        const fetchConversation = async () => {
            try {
                const response = await axios.get(`/api/conversations/${conversationId}`);
                console.log('Conversation Data:', response.data);
                setConversation(response.data);
            } catch (error) {
                Alert.alert("Error", "Unable to fetch conversation: " + (error.response?.data?.message || error.message));
            }
        };

        if (conversationId) {
            fetchConversation();
        }
    }, [conversationId]);

    // Fetch danh sách channel nếu là nhóm (conversation.type === true)
    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const response = await axios.get(`/api/channels/${conversationId}`);
                setChannels(response.data);
                console.log("Channels:", response.data);
            } catch (error) {
                console.error("Error fetching channels:", error);
                Alert.alert(
                    "Error fetching channels",
                    error.response?.data?.message || error.message
                );
            }
        };

        if (conversation?.type) {  // Kiểm tra nếu là nhóm
            fetchChannels();
        }
    }, [conversation, conversationId]);

    const fetchAllMessages = async () => {
        if (!conversationId) return;

        try {
            const response = await axios.get(`/api/messages/${conversationId}`);
            setMessages(response.data);
        } catch (error) {
            console.error("Error fetching messages:", error);
            Alert.alert(
                "Error fetching messages",
                error.response?.data?.message || error.message
            );
        }
    };

    useEffect(() => {
        fetchAllMessages();
    }, [conversationId]);

    const firstChannelId = channels.length > 0 ? channels[0]._id : null;
    console.log("First Channel ID:", firstChannelId);

    const handleMessageLongPress = useCallback((message) => {
        setSelectedMessage(message);
        setModalVisible(true);
    }, []);


    const handleRecallAction = () => {
        if (!selectedMessage) return;

        Alert.alert("Thu hồi", "Bạn có muốn thu hồi tin nhắn này?", [
            { text: "Hủy", style: "cancel" },
            {
                text: "OK",
                onPress: async () => {
                    try {
                        await axios.delete(`/api/messages/${selectedMessage._id}/conversation/${conversationId}`);
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


    const isPinned = async (msg) => {
        try {
            const response = await axios.get(`/api/pin-messages/${conversationId}`);

            const listPinMess = response.data;
            return listPinMess.some(p => p.messageId === msg._id);
        } catch (err) {
            console.log(err)
        }

    };


    const isMessagePinned = (messageId) => {
        return pinnedMessages.some(pm => pm.messageId === messageId);
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




    const handlePinMessages = async (message) => {
        if (!message) return;

        try {
            const isPinned = isMessagePinned(message._id);

            if (isPinned) {
                await handleUnpinMessage(message._id);
                return;
            }

            const response = await axios.post('/api/pin-messages', {
                messageId: message._id,
                conversationId: message.conversationId,
                pinnedBy: message.memberId._id,
            });

            // Chỉ cập nhật trạng thái pin cho message cụ thể
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg._id === message._id
                        ? { ...msg, isPinned: true }
                        : msg
                )
            );

            // Cập nhật danh sách pinned messages
            setPinnedMessages(prev => [...prev, response.data]);

        } catch (err) {
            console.error('Lỗi khi thao tác ghim:', err.message);
        }
    };


    const handleUnpinMessage = async (messageId) => {
        try {
            const memberResponse = await axios.get(`/api/members/${conversationId}/${userId}`);

            const memberId = memberResponse.data.data?._id;

            await axios.delete(`/api/pin-messages/${messageId?._id}/${memberId}`);

            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg._id === messageId?._id
                        ? { ...msg, isPinned: false }
                        : msg
                )
            );
            setPinnedMessages(prevPinnedMessages =>
                prevPinnedMessages.filter(msg => msg.messageId !== messageId)
            );

            setModalVisible(false);
        } catch (err) {
            console.error(" Lỗi khi gỡ ghim:", err.message);
            Alert.alert('Lỗi', 'Không thể gỡ ghim tin nhắn');
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

    function PinnedMessagesSection({ pinnedMessages }) {
        if (!pinnedMessages || pinnedMessages.length === 0) {
            return null;
        }

        return (
            <View style={pinnedMessageStyles.container}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>

                    <View key={pinnedMessages._id} style={pinnedMessageStyles.messageItem}>
                        <Text style={pinnedMessageStyles.messageContent} numberOfLines={1}>
                            {pinnedMessages.content || "Nội dung đã ghim"}
                        </Text>
                        <Text style={pinnedMessageStyles.pinnedBy}>
                            Được ghim bởi {pinnedMessages.pinnedBy.name || "ai đó"}
                        </Text>
                    </View>

                </ScrollView>
            </View>
        );
    }

    const pinnedMessageStyles = StyleSheet.create({
        container: {
            width: '60%',
            minHeight: 60,
            backgroundColor: 'white',
            padding: 8,
            backgroundColor: "#D8EDFF",

        },
        title: {
            fontSize: 12,
            fontWeight: '600',
            color: '#666',
            marginBottom: 4,
        },
        messageItem: {
            backgroundColor: '#f0f8ff',
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 16,
            marginRight: 8,
            borderWidth: 1,
            borderColor: '#e0e0e0',
            maxWidth: 200,
        },
        messageContent: {
            fontSize: 14,
            fontWeight: '500',
        },
        pinnedBy: {
            fontSize: 10,
            color: '#888',
            marginTop: 2,
        }
    });

    const checkaddChannel = async (conversation, memberId) => {
        conversation.managerIds.forEach(id => {
            console.log('ID:', id);
        });
        console.log(`kkkkkkk`, memberId.toString());
        console.log(`cccc`, conversation.managerIds.some(id => id === memberId.toString()))

        return conversation.managerIds.some(id => id.toString() === memberId.toString());
    };

    function HeaderSingleChat({ handleAddChannel, checkaddChannel }) {
        const navigation = useNavigation();
        const [localPinnedMessages, setLocalPinnedMessages] = useState([]);

        console.log(`HEADER NÈ `, checkaddChannel(conversation, memberId))

        useEffect(() => {
            if (channels.length > 0) {
                setCurrentChannelId(channels[0]._id);
            }
        }, [channels]);

        useEffect(() => {
            const loadPinnedMessages = async () => {
                const messages = await handlePinnedMessages();
                setLocalPinnedMessages(messages);
            };

            loadPinnedMessages();
        }, [conversation, pinnedMessages]);

        const lastMessage = localPinnedMessages[localPinnedMessages.length - 1];
        return (
            <View style={headerStyles.container}>
                <View style={headerStyles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={headerStyles.backBtnContainer}>
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
                        <TouchableOpacity
                            style={headerStyles.iconButton}
                            onPress={() => navigation.navigate('GroupDetailScreen', { conversationId })}
                        >
                            <Image source={DetailChatIcon} style={headerStyles.icon} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={headerStyles.channelsContainer}>
                    <View style={{ width: 200, height: '100%' }}>
                        <ScrollView horizontal={true} style={{ width: '100%', maxHeight: 300, flexDirection: 'row', }}>
                            {channels.map((channel) => (
                                <TouchableOpacity
                                    key={channel._id}
                                    onPress={() => setCurrentChannelId(channel._id)}
                                    style={[
                                        headerStyles.channelButton,
                                        currentChannelId === channel._id && headerStyles.channelSelected
                                    ]}
                                >
                                    <Text style={headerStyles.channelText}>{channel.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                    {checkaddChannel(conversation, memberId) && (
                        <TouchableOpacity style={{ position: 'absolute', right: 5, top: 10, }} onPress={() => { handleAddChannel('123') }}><Image source={addChannel} style={{ height: 20, width: 20 }} /></TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={[{ width: '100%', color: "black", display: 'flex' }]}>
                    <PinnedMessagesSection pinnedMessages={lastMessage} style={{ backgroundColor: 'black' }} />
                </TouchableOpacity>

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
            height: 'auto'
        },
        headerContent: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
        },
        backBtnContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            width: 30,
            height: 35,
            marginRight: 20,
        },
        backBtn: {
            width: '80%',
            height: '80%',
            resizeMode: 'contain',
        },
        avatar: { width: 55, height: 55, borderRadius: 35 },
        infoContainer: { marginLeft: 12, flex: 1 },
        name: { fontSize: 22, fontWeight: "600", color: "#086DC0" },
        statusContainer: {
            flexDirection: "row",
            alignItems: "center",
            marginTop: 4,
        },
        statusDot: { width: 10, height: 10, backgroundColor: "#00F026", borderRadius: 5 },
        statusText: { fontSize: 14, marginLeft: 6, color: "#333" },

        channelsContainer: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: 10,
        },
        channelButton: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            backgroundColor: '#ccc',
            borderRadius: 15,
            marginRight: 8,
            marginBottom: 8,
            alignItems: 'center'
        },
        channelSelected: {
            backgroundColor: '#086DC0',
        },
        channelText: {
            color: '#fff',
            fontSize: 14,
        },

        iconsContainer: { flexDirection: "row" },
        iconButton: { padding: 8, marginLeft: 8 },
        icon: { width: 24, height: 24, resizeMode: "contain" },
    });




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
            const fileName = selectedMedia.uri.split('/').pop();
            const mimeType = selectedMedia.mimeType || (selectedMedia.type === 'video' ? 'video/mp4' : 'image/jpeg');

            const file = {
                uri: mediaUri,
                name: fileName,
                type: mimeType,
            };

            formData.append('id', userId);
            formData.append(selectedMedia.type === 'video' ? 'video' : 'image', file);
            formData.append('conversationId', conversationId);
            formData.append('channelId', currentChannelId);

            try {
                const endpoint = selectedMedia.type === 'video' ? '/api/messages/video' : '/api/messages/images';
                const response = await axios.post(endpoint, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: selectedMedia.type === 'video' ? 30000 : 20000,
                });

                const mediaUrl = response.data?.file?.url;
                const newMsg = {
                    _id: String(Date.now()),
                    memberId: { userId: userId || "" },
                    type: selectedMedia.type === 'video' ? "VIDEO" : "IMAGE",
                    content: mediaUrl,
                    createdAt: new Date().toISOString(),
                };

                setMessages((prev) => [...prev, newMsg]);
                console.log(`${selectedMedia.type} uploaded successfully:`, mediaUrl);
            } catch (err) {
                console.error(`Error uploading ${selectedMedia.type}:`, err);
                Alert.alert('Error', `Failed to upload ${selectedMedia.type}`);
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
                formData.append('channelId', currentChannelId);
                formData.append('file', {
                    uri: fileUri,
                    name: fileName,
                    type: mimeType,
                });

                // Chỉ upload file, không thêm tin nhắn vào state
                // Tin nhắn sẽ được thêm tự động qua WebSocket
                await axios.post('/api/messages/file', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

            }
        } catch (error) {
            console.error("Error uploading file:", error);
            Alert.alert("Upload error", "Không thể upload file.");
        }
    };

    const handleOpenVoteModal = async (msg) => {
        try {
            setSelectedMessage(msg);
            setVotedModal(true)

        } catch (error) {

        }

    }

    const handlePressEmoji = async (msg) => {
        try {
            const reactors = await Promise.all(
                msg.reacts.map(async (react) => {
                    const member = await handleGetMember(react.memberId);
                    console.log(`MemberId: `, react.memberId)
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
            console.log(`MemberId La : `, memberId)
            const response = await axios.get(`/api/members/member/${memberId._id}`);

            return response.data.data;
        } catch (error) {
            console.error('Failed to get member:', error);
            throw error;
        }
    }

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
        } catch (error) {
            console.error('Failed to send react:', error.response?.data || error.message);
        }
    };

    const handleSendMessage = async (message) => {
        if (!message.trim()) return;
        if (!userId) {
            Alert.alert("User not loaded", "Unable to send message without a valid user.");
            return;
        }
        try {
            const newMessage = {
                _id: String(Date.now()), // temporary id
                memberId: { userId: userId },
                type: "TEXT",
                content: message,
                createdAt: new Date().toISOString(),
                pending: true,
            };
            setMessages((prev) => [...prev, newMessage]);

            await axios.post("/api/messages/text", {
                userId: userId,
                conversationId: conversationId,
                content: message,
                channelId: currentChannelId,
            });

            socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
                conversationId: conversationId,
                content: message,
            });
        } catch (err) {
            Alert.alert("Cannot send message", err.response?.data?.message || err.message);
        }
    };

    useEffect(() => {
        if (!socket || !conversationId) return;

        const receiveHandler = (message) => {
            setMessages(prev => {
                // Nếu là message của user hiện tại
                if (message.memberId?.userId === userId) {
                    return prev.map(m =>
                        m.pending && m.content === message.content
                            ? message
                            : m
                    );
                }

                // Nếu message đã tồn tại thì cập nhật, không thì thêm mới
                const existingIndex = prev.findIndex(m => m._id === message._id);
                if (existingIndex !== -1) {
                    const newMessages = [...prev];
                    newMessages[existingIndex] = message;
                    return newMessages;
                }

                return [...prev, message];
            });
        };

        socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
        socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, conversationId);

        return () => {
            socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, receiveHandler);
            socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, conversationId);
        };
    }, [socket, conversationId, userId]);

    const handleSendRecord = () => {
        setRecordModal(false);
    }


    const handleCreatePoll = () => {
        fetchAllMessages();
        setVoteShowModal(false);
    };
    const handleVoteSubmit = (updatedVoteMessage) => {
        console.log("Dữ liệu nhận được từ VoteModal:", updatedVoteMessage);

        if (!updatedVoteMessage) {
            console.error("Không nhận được dữ liệu vote cập nhật");
            return;
        }
        setMessages(prevMessages =>
            prevMessages.map(msg =>
                msg._id === updatedVoteMessage._id ? {
                    ...msg,
                    options: updatedVoteMessage.options || msg.options,
                } : msg
            )
        );
    };

    useEffect(() => {
        const fetchMemberId = async () => {
            if (conversationId && userId) {
                try {
                    const res = await axios.get(`/api/members/${conversationId}/${userId}`);
                    const member = res.data.data;
                    setMemberId(member._id);
                } catch (err) {
                    console.error("Lỗi lấy memberId:", err);
                }
            }
        };

        fetchMemberId();
    }, [conversationId, userId]);



    const handleCreateChannel = (channelName) => {


        setShowAddChannel(true);
    };

    return (

        <View style={chatScreenStyles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <HeaderSingleChat
                    handleAddChannel={handleCreateChannel}
                    checkaddChannel={checkaddChannel}
                />
                <View style={chatScreenStyles.chatContainer}>
                    <ChatBox
                        messages={messages}
                        currentUserId={userId}
                        onMessageLongPress={handleMessageLongPress}
                        handlePressEmoji={handlePressEmoji}
                        isPinned={isPinned}
                        handleOpenVoteModal={handleOpenVoteModal}
                    />
                </View>
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

                />
                <EmojiPicker
                    onEmojiSelected={(emoji) => setInput((prev) => prev + emoji.emoji)}
                    open={emojiOpen}
                    onClose={() => setEmojiOpen(false)}
                />
                <CreateVoteModal
                    visible={showVoteModal}
                    channelId={currentChannelId}
                    conversationId={conversationId}
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
                />

                <VoiceRecordModal
                    isVisible={showRecordModal}
                    onClose={() => setRecordModal(false)}
                    conversationId={conversationId}
                    channelId={currentChannelId}
                    onSendRecord={(uri) => console.log('File ghi âm:', uri)}
                />

                <AddNewChannel
                    visible={showAddChannel}
                    onCancel={() => setShowAddChannel(false)}
                    onCreate={handleCreateChannel}
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
                            <TouchableOpacity style={styles.modalButton} onPress={handleRecallAction}>
                                <Text style={styles.modalButtonText}>Thu hồi</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.modalButton} onPress={handleDeleteAction}>
                                <Text style={styles.modalButtonText}>Xoá</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.modalButton} onPress={handleForwardAction}>
                                <Text style={styles.modalButtonText}>Chuyển tiếp</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => {
                                    if (selectedMessage && isMessagePinned(selectedMessage._id)) {
                                        handleUnpinMessage(selectedMessage);
                                    } else {
                                        handlePinMessages(selectedMessage);
                                    }
                                }}
                            >
                                <Text style={styles.modalButtonText}>
                                    {selectedMessage && isMessagePinned(selectedMessage?._id) ? "Gỡ ghim" : "Ghim"}
                                </Text>
                            </TouchableOpacity>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
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
                        </View>
                    </TouchableOpacity>
                </Modal>

                <Modal visible={reactDetailModalVisible} transparent animationType="slide" onRequestClose={() => setReactDetailModalVisible(false)}>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Người đã thả:</Text>

                            <FlatList
                                data={selectedReactors}
                                keyExtractor={(item) => item.userId}
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
                                        <View style={styles.reactorItem}>
                                            {item.avatar && (
                                                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                                            )}
                                            <Text style={styles.reactorName}>
                                                {item.name} đã thả {emoji}
                                            </Text>
                                        </View>
                                    );
                                }}
                            />

                            <TouchableOpacity onPress={() => setReactDetailModalVisible(false)} style={styles.closeButton}>
                                <Text style={styles.closeText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </KeyboardAvoidingView>

        </View >

    );
}

const chatScreenStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#D8EDFF", height: 10, },
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
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 20, marginBottom: 10 },
    reactBar: { flexDirection: 'row', gap: 10 },
    reactButton: { padding: 10, backgroundColor: '#eee', borderRadius: 8 },
    emoji: { fontSize: 24 },
    modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: 'white', padding: 20, borderRadius: 10 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    reactorItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
    avatar: { fontSize: 20, marginRight: 10 },
    closeButton: { marginTop: 15, alignSelf: 'center' },
    closeText: { color: 'blue' },
});
