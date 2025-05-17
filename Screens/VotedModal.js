import React, { useState, useEffect } from 'react';
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

const VoteModal = ({ visible, onClose, message, onSubmit, memberId }) => {

    const [selectedOptions, setSelectedOptions] = useState([]);
    const [msg, setMsg] = useState(null);
    const [user, setUser] = useState(null);
    const [dynamicOptions, setDynamicOptions] = useState([]);
    const [newOptionText, setNewOptionText] = useState('');
    const [member, setMember] = useState(memberId);

    useEffect(() => {
        if (memberId) {
            setMember(memberId);
        } else {
            // Fallback: Tự lấy memberId nếu props không có
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

    console.log(`Member is: `, member);
    console.log(`User Vote là : `, user);
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

    const toggleOption = (optionId) => {
        if (msg?.isMultipleChoice) {
            if (selectedOptions.includes(optionId)) {
                setSelectedOptions(selectedOptions.filter(id => id !== optionId));
            } else {
                setSelectedOptions([...selectedOptions, optionId]);
            }
        } else {
            setSelectedOptions([optionId]);
        }
    };


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
                        voteId: msg._id,    // Thêm voteId
                        optionId: optionId, // Thêm optionId
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
                        onPress={async () => {
                            const trimmed = newOptionText.trim();
                            if (!trimmed || !msg || !user) return;

                            try {
                                const res = await voteService.addVoteOption(msg._id, msg.memberId._id, trimmed);

                                setDynamicOptions(prev => [...prev, res]);
                                setNewOptionText('');
                            } catch (err) {
                                console.error('Lỗi khi thêm phương án:', err);
                                Alert.alert('Lỗi', 'Không thể thêm phương án mới.');
                            }
                        }}

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
                    {dynamicOptions.map((opt) => (
                        <View key={opt._id} style={{ position: 'relative' }}>
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
                                <>
                                    {opt.members.slice(0, 2).map((member, index) => (
                                        <View
                                            key={index}
                                            style={{
                                                width: 25,
                                                height: 25,
                                                borderRadius: 50,
                                                borderWidth: 1,
                                                position: 'absolute',
                                                right: 15 + index * 15,
                                                top: 8,
                                                overflow: 'hidden',
                                                backgroundColor: '#fff',
                                                zIndex: 2 - index,
                                            }}
                                        >
                                            <Image
                                                source={{ uri: member.avatar || 'https://i.pravatar.cc/300' }}
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        </View>
                                    ))}
                                </>
                            )}
                        </View>
                    ))}

                </ScrollView>

                <View style={styles.buttonRow}>
                    <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: '#ccc' }]}>
                        <Text>Đóng</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleSubmit} style={[styles.button, { backgroundColor: '#2F80ED' }]}>
                        <Text style={{ color: 'white' }}>Bình chọn</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

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
