import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';

const AddChannelModal = ({ visible, onCancel, onCreate }) => {
    const [channelName, setChannelName] = useState('');

    const handleCreate = () => {
        if (!channelName.trim()) {
            Alert.alert('Error', 'Channel name cannot be empty');
            return;
        }
        onCreate(channelName);
        setChannelName('');
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onCancel} 
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Add New Channel</Text>

                    <Text style={styles.label}>Channel Name:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter channel name"
                        placeholderTextColor="#999"
                        value={channelName}
                        onChangeText={setChannelName}
                        autoFocus={true}
                    />

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onCancel}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.createButton,
                                !channelName.trim() && styles.disabledButton
                            ]}
                            onPress={handleCreate}
                            disabled={!channelName.trim()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.buttonText}>Create Channel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    button: {
        padding: 12,
        borderRadius: 8,
        minWidth: '48%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: 'red',
    },
    createButton: {
        backgroundColor: '#1f67db',
    },
    disabledButton: {
        backgroundColor: '#1f67db',
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default AddChannelModal;