import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ScrollView,
} from 'react-native';

const VoteModal = ({ visible, onClose, question, options = [], onSubmit }) => {
    const [selectedOption, setSelectedOption] = useState(null);

    const handleSubmit = () => {
        if (selectedOption) {
            onSubmit(selectedOption);
        } else {
            alert('Vui lòng chọn một phương án.');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>

            <View style={styles.modalContainer}>
                <Text style={styles.title}>Bình chọn</Text>

                <Text style={styles.question}>{question}</Text>

                <ScrollView style={styles.optionsList}>
                    {options.map((opt) => (
                        <TouchableOpacity
                            key={opt._id}
                            style={[
                                styles.optionItem,
                                selectedOption === opt._id && styles.optionSelected,
                            ]}
                            onPress={() => setSelectedOption(opt._id)}
                        >
                            <Text style={styles.optionText}>{opt.name}</Text>
                        </TouchableOpacity>
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
