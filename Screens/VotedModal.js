import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    TextInput
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import voteService from '../api/voteService';
import userService from '../api/userService';
import { socket } from "../utils/socketClient";
import { SOCKET_EVENTS } from "../utils/constant";

const VoteModal = ({ visible, onClose, message, onSubmit, memberId, conversation }) => {

    const [selectedOptions, setSelectedOptions] = useState([]);
    const [msg, setMsg] = useState(null);
    const [user, setUser] = useState(null);
    const [dynamicOptions, setDynamicOptions] = useState([]);
    const [newOptionText, setNewOptionText] = useState('');
    const [member, setMember] = useState(memberId);
    const [isRemoved, setIsRemoved] = useState(false);
    const [voted, setVoted] = useState(true)

    const [showUpdateButton, setShowUpdateButton] = useState(false);


    useEffect(() => {
        if (visible) {
            setSelectedOptions([]);
            setNewOptionText('');
            setShowUpdateButton(false);
            setVoted(false);

            if (message) {
                setMsg(message);
                setDynamicOptions(message.options || []);
            }
        }
    }, [visible, message]);

    useEffect(() => {
        if (memberId) {
            setMember(memberId);
        } else {
            const fetchMemberId = async () => {
                try {
                    const storedUserId = await AsyncStorage.getItem("userId");
                    if (storedUserId) {
                        setMember(storedUserId);
                    }
                } catch (error) {
                    console.error("Lỗi khi lấy memberId từ AsyncStorage:", error);
                }
            };
            fetchMemberId();
        }
    }, [memberId]);

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem("userId");
                setSelectedOptions([]);
                setMsg(message);
                setDynamicOptions(message?.options || []);

                if (storedUserId) {
                    setUser(await userService.getUserById(storedUserId));
                } else {
                    Alert.alert("Lỗi", "Không tìm thấy userId.");
                }
            } catch (error) {
                Alert.alert("Lỗi khi lấy userId", error.message);
            }
        };
        fetchUserId();
    }, [message]);



    const checkSelectedOptionsStatus = useCallback(() => {
        if (selectedOptions.length === 0) return false;

        let hasVotedOption = false;
        let hasNotVotedOption = false;

        for (const optionId of selectedOptions) {
            const option = dynamicOptions.find(opt => opt._id === optionId);
            if (!option) continue;

            const isVoted = option.members?.some(m => m.memberId === member);

            if (isVoted) {
                hasVotedOption = true;
            } else {
                hasNotVotedOption = true;
            }
        }

        return hasVotedOption && hasNotVotedOption;
    }, [selectedOptions, dynamicOptions, member]);

    useEffect(() => {
        const updateStatus = () => {
            const hasMixedSelection = checkSelectedOptionsStatus();
            setShowUpdateButton(hasMixedSelection);

            if (!hasMixedSelection) {
                const hasVoted = dynamicOptions.some(opt =>
                    selectedOptions.includes(opt._id) &&
                    opt.members?.some(m => m.memberId === member)
                );
                setVoted(hasVoted);
            }
        };

        updateStatus();
    }, [selectedOptions, dynamicOptions, member, checkSelectedOptionsStatus]);

    const handleUpdateVote = async () => {
        if (selectedOptions.length === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một phương án.');
            return;
        }

        if (!member) {
            Alert.alert('Lỗi', 'Không xác định được người dùng');
            return;
        }

        try {
            const updatedOptions = [...dynamicOptions];

            const changes = selectedOptions.map(optionId => {
                const option = updatedOptions.find(opt => opt._id === optionId);
                const isVoted = option?.members?.some(m => m.memberId === member);

                return {
                    optionId,
                    shouldVote: !isVoted
                };
            });

            const optimisticUpdate = {
                ...msg,
                options: updatedOptions.map(opt => {
                    const change = changes.find(c => c.optionId === opt._id);
                    if (!change) return opt;

                    if (change.shouldVote) {
                        return {
                            ...opt,
                            members: [
                                ...(opt.members || []),
                                {
                                    _id: member,
                                    name: user.name,
                                    avatar: user.avatar,
                                    avatarColor: user.avatarColor
                                }
                            ]
                        };
                    } else {
                        return {
                            ...opt,
                            members: opt.members?.filter(m => m.memberId !== member) || []
                        };
                    }
                })
            };

            onSubmit(optimisticUpdate);

            await Promise.all(
                changes.map(({ optionId, shouldVote }) =>
                    shouldVote
                        ? voteService.selectOption({
                            voteId: msg._id,
                            optionId: optionId,
                            memberId: member,
                            memberInfo: {
                                name: user.name,
                                avatar: user.avatar,
                                avatarColor: user.avatarColor
                            }
                        })
                        : voteService.deselectOption(member, optionId, msg._id)
                )
            );

            Alert.alert("Thành công", "Cập nhật bình chọn thành công!");
            onClose();
        } catch (error) {
            console.error('Lỗi khi cập nhật bình chọn:', error);
            Alert.alert("Lỗi", error.response?.data?.message || "Cập nhật bình chọn thất bại");
            onSubmit(msg);
        }
    };



    const toggleOption = (optionId) => {
        if (msg?.isMultipleChoice) {
            if (selectedOptions.includes(optionId)) {
                setSelectedOptions(prev => prev.filter(id => id !== optionId));
            } else {
                setSelectedOptions(prev => [...prev, optionId]);
            }
        } else {
            setSelectedOptions([optionId]);
        }
    };

    useEffect(() => {
        const hasVoted = dynamicOptions.some(opt =>
            selectedOptions.includes(opt._id) &&
            opt.members?.some(m => m.memberId === member)
        );
        setVoted(hasVoted);
    }, [selectedOptions, dynamicOptions, member]);

    const handleSubmit = async () => {
        if (selectedOptions.length === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một phương án.');
            return;
        }

        if (!member) {
            Alert.alert('Lỗi', 'Không xác định được người dùng');
            return;
        }

        try {
            const optimisticUpdate = {
                ...msg,
                options: msg.options.map(opt => {
                    if (selectedOptions.includes(opt._id)) {
                        const isAlreadyVoted = opt.members?.some(m => m._id === member);
                        if (!isAlreadyVoted) {
                            return {
                                ...opt,
                                members: [
                                    ...(opt.members || []),
                                    {
                                        _id: member,
                                        name: user.name,
                                        avatar: user.avatar,
                                        avatarColor: user.avatarColor
                                    }
                                ]
                            };
                        }
                    }
                    return opt;
                })
            };
            onSubmit(optimisticUpdate);


            const results = await Promise.all(
                selectedOptions.map(optionId =>
                    voteService.selectOption({
                        voteId: msg._id,
                        optionId: optionId,
                        memberId: member,
                        memberInfo: {
                            name: user.name,
                            avatar: user.avatar,
                            avatarColor: user.avatarColor
                        }
                    })
                )
            );

            const serverUpdatedVote = results[0]?.data || results[0];
            if (serverUpdatedVote) {
                onSubmit(serverUpdatedVote);
                Alert.alert("Thành công", "Bình chọn thành công!");
                onClose();
            }
        } catch (error) {
            console.error('Lỗi khi bình chọn:', error);
            Alert.alert("Lỗi", error.response?.data?.message || "Bình chọn thất bại");
            onSubmit(msg);
        }
    };

    const handleDeselect = async () => {
        if (selectedOptions.length === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn phương án muốn bỏ bình chọn.');
            return;
        }

        if (!member) {
            Alert.alert('Lỗi', 'Không xác định được người dùng');
            return;
        }

        try {
            const optimisticUpdate = {
                ...msg,
                options: msg.options.map(opt => ({
                    ...opt,
                    members: selectedOptions.includes(opt._id)
                        ? opt.members?.filter(m => m.memberId !== member) || []
                        : opt.members
                }))
            };
            onSubmit(optimisticUpdate);

            for (const optionId of selectedOptions) {
                try {
                    await voteService.deselectOption(member, optionId, msg._id);
                } catch (err) {
                    console.error(`Lỗi khi bỏ chọn option ${optionId}:`, err);
                }
            }

            Alert.alert("Thành công", "Đã bỏ bình chọn!");
            onClose();
        } catch (error) {
            console.error('Lỗi chung khi bỏ bình chọn:', error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi bỏ bình chọn");
            onSubmit(msg);
        }
    };


    const handleAddOption = async () => {
        const trimmed = newOptionText.trim();
        if (!trimmed || !msg || !user) return;

        const isDuplicate = dynamicOptions.some(
            opt => opt.name.toLowerCase() === trimmed.toLowerCase()
        );

        if (isDuplicate) {
            Alert.alert('Lỗi', 'Phương án này đã tồn tại trong bình chọn');
            return;
        }

        try {
            const res = await voteService.addVoteOption(msg._id, msg.memberId._id, trimmed);
            setDynamicOptions(prev => [...prev, res]);
            setNewOptionText('');
        } catch (err) {
            console.error('Lỗi khi thêm phương án:', err);
            Alert.alert('Lỗi', 'Không thể thêm phương án mới.');
        }
    };


    useEffect(() => {
        const handleVoteOptionSelectS = (selectoption) => {


            if (isRemoved) return;

            setDynamicOptions(selectoption.options || []);
            onSubmit(selectoption);
        };
        const handleLeaveConversation = (data) => {

            if (data.conversationId === conversation._id) {
                setIsRemoved(true);
            }
        };

        socket.on(SOCKET_EVENTS.VOTE_OPTION_SELECTED, handleVoteOptionSelectS);
        socket.on(SOCKET_EVENTS.MEMBER_REMOVED, handleLeaveConversation);

        return () => {
            socket.off(SOCKET_EVENTS.VOTE_OPTION_SELECTED, handleVoteOptionSelectS);
            socket.off(SOCKET_EVENTS.MEMBER_REMOVED, handleLeaveConversation);
        };
    }, [socket, conversation, onSubmit, isRemoved]);


    useEffect(() => {
        const handleDeSelect = (selectoption) => {

            if (isRemoved) return;

            setDynamicOptions(selectoption.options || []);
            onSubmit(selectoption);
        };
        const handleLeaveConversation = (data) => {
            if (data.conversationId === conversation._id) {
                setIsRemoved(true);
            }
        };

        socket.on(SOCKET_EVENTS.VOTE_OPTION_DESELECTED, handleDeSelect);
        socket.on(SOCKET_EVENTS.MEMBER_REMOVED, handleLeaveConversation);

        return () => {
            socket.off(SOCKET_EVENTS.VOTE_OPTION_DESELECTED, handleDeSelect);
            socket.off(SOCKET_EVENTS.MEMBER_REMOVED, handleLeaveConversation);
        };
    }, [socket, onSubmit, isRemoved, conversation]);



    useEffect(() => {
        const hasVoted = dynamicOptions.some(opt =>
            opt.members?.some(m => m.memberId === member)
        );
        setVoted(hasVoted);
    }, [dynamicOptions, member]);

    const { content, options = [] } = message || {};

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalContainer}>
                <Text style={styles.title}>Bình chọn</Text>

                <Text style={styles.question}>{content}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <TextInput
                        placeholder="Nhập phương án mới"
                        value={newOptionText}
                        onChangeText={setNewOptionText}
                        style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: '#ccc',
                            borderRadius: 8,
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                        }}
                    />
                    <TouchableOpacity
                        onPress={handleAddOption}

                        style={{
                            marginLeft: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            backgroundColor: '#2F80ED',
                            borderRadius: 6,
                        }}
                    >
                        <Text style={{ color: 'white' }}>Thêm</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.optionsList}>
                    {dynamicOptions.map((opt, index) => (
                        <View key={`${opt._id}-${index}`} style={{ position: 'relative' }}>
                            <TouchableOpacity
                                style={[
                                    styles.optionItem,
                                    selectedOptions.includes(opt._id) && styles.optionSelected,
                                ]}
                                onPress={() => toggleOption(opt._id)}
                            >
                                <Text style={styles.optionText}>{opt.name}</Text>
                            </TouchableOpacity>

                            {opt.members?.length > 0 && (
                                <View style={{ flexDirection: 'row', position: 'absolute', right: 10, top: 8 }}>
                                    {msg?.isAnonymous ? (
                                        <View style={{
                                            width: 25,
                                            height: 25,
                                            borderRadius: 15,
                                            backgroundColor: '#e0e0e0',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderWidth: 1,
                                            borderColor: '#fff',
                                        }}>
                                            <Text style={{ fontSize: 10 }}>{opt.members.length}</Text>
                                        </View>
                                    ) : (
                                        <>
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
                                        </>
                                    )}
                                </View>
                            )}
                        </View>
                    ))}
                </ScrollView>


                <View style={styles.buttonRow}>
                    <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: '#ccc' }]}>
                        <Text>Đóng</Text>
                    </TouchableOpacity>

                    {showUpdateButton ? (
                        <TouchableOpacity
                            onPress={handleUpdateVote}
                            style={[styles.button, { backgroundColor: '#4CAF50' }]}
                        >
                            <Text style={{ color: 'white' }}>Cập nhật</Text>
                        </TouchableOpacity>
                    ) : voted ? (
                        <TouchableOpacity
                            onPress={handleDeselect}
                            style={[styles.button, { backgroundColor: '#ff4444' }]}
                        >
                            <Text style={{ color: 'white' }}>Bỏ bình chọn</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={handleSubmit}
                            style={[styles.button, { backgroundColor: '#2F80ED' }]}
                        >
                            <Text style={{ color: 'white' }}>Bình chọn</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal >

    );
};

const styles = StyleSheet.create({

    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        height: '100%'
    },
    title: {
        fontWeight: 'bold',
        fontSize: 20,
        marginBottom: 10,
    },
    question: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    optionsList: {
        maxHeight: 300,
    },
    optionItem: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 8,
    },
    optionSelected: {
        borderColor: '#2F80ED',
        backgroundColor: '#EAF1FF',
    },
    optionText: {
        fontSize: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
        gap: 10,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
    },
});

export default VoteModal;