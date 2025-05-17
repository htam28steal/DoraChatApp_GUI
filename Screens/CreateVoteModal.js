import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Modal,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Switch,
    Alert
} from 'react-native';
import voteService from '../api/voteService';

const PollCreatorModal = ({ visible, onClose, onCreate, memberId, conversationId, channelId }) => {

    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [allowMultiple, setAllowMultiple] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const handleOptionChange = (text, index) => {
        const updated = [...options];
        updated[index] = text;
        setOptions(updated);
    };

    console.log(`Member là : `, memberId);

    const handleAddOption = () => {
        setOptions([...options, '']);
    };

    const handleRemoveOption = (index) => {
        const updated = [...options];
        updated.splice(index, 1);
        setOptions(updated);
    };

    const handleCreatePoll = async () => {
        const filteredOptions = options
            .map((text) => ({ name: text.trim() }))
            .filter(opt => opt.name !== '');

        if (!question.trim() || filteredOptions.length < 2) {
            alert('Vui lòng nhập câu hỏi và ít nhất 2 lựa chọn');
            return;
        }

        const payload = {
            content: question.trim(),
            options: filteredOptions,
            isMultipleChoice: allowMultiple,
            isAnonymous: isAnonymous,
            memberId,
            channelId,
            conversationId,
        };

        try {
            const result = await voteService.createVote(payload);

            setQuestion('');
            setOptions(['', '']);
            setAllowMultiple(false);
            setIsAnonymous(false);

            onCreate?.(result);

            onClose();

        } catch (error) {
            Alert.alert("Lỗi", "Không thể tạo bình chọn");
            console.error("Vote create error:", error);
        }
    };

    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.modalContainer}>
                <Text style={styles.title}>Tạo bình chọn</Text>

                <Text style={styles.label}>Câu hỏi</Text>
                <TextInput
                    style={styles.input}
                    value={question}
                    onChangeText={setQuestion}
                    placeholder="Nhập câu hỏi bình chọn..."
                />

                <Text style={styles.label}>Lựa chọn</Text>
                <ScrollView style={{ maxHeight: 200 }}>
                    {options.map((opt, idx) => (
                        <View key={idx} style={styles.optionRow}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder={`Lựa chọn ${idx + 1}`}
                                value={opt}
                                onChangeText={(text) => handleOptionChange(text, idx)}
                            />
                            {options.length > 2 && (
                                <TouchableOpacity
                                    onPress={() => handleRemoveOption(idx)}
                                    style={styles.deleteBtn}
                                >
                                    <Text style={{ color: 'red', fontWeight: 'bold' }}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </ScrollView>

                <TouchableOpacity onPress={handleAddOption} style={styles.addOptionBtn}>
                    <Text style={{ color: '#007AFF' }}>+ Thêm lựa chọn</Text>
                </TouchableOpacity>

                <View style={styles.switchContainer}>
                    <Text>Cho phép chọn nhiều phương án</Text>
                    <Switch
                        value={allowMultiple}
                        onValueChange={setAllowMultiple}
                    />
                </View>
                <View style={styles.switchContainer}>
                    <Text>Ẩn người bình chọn</Text>
                    <Switch
                        value={isAnonymous}
                        onValueChange={setIsAnonymous}
                    />
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: '#ccc' }]}>
                        <Text>Hủy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleCreatePoll} style={[styles.button, { backgroundColor: '#007AFF' }]}>
                        <Text style={{ color: 'white' }}>Tạo</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        paddingTop: 40,
        padding: 20,
        flex: 1,
        backgroundColor: '#fff',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 20,
        marginBottom: 20,
    },
    label: {
        marginTop: 10,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 10,
        marginVertical: 5,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteBtn: {
        marginLeft: 10,
        padding: 5,
    },
    addOptionBtn: {
        marginTop: 10,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 30,
        gap: 10,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
    },
});

export default PollCreatorModal;
