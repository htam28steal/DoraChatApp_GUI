import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Audio } from 'expo-av';

import api from '../api/apiConfig';
import * as FileSystem from 'expo-file-system';
const VoiceRecordModal = ({ isVisible, onClose, onSendRecord, conversationId, channelId }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordTime, setRecordTime] = useState(0);
    const [recording, setRecording] = useState(null);
    const [recordedUri, setRecordedUri] = useState(null);
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    let interval = null;

    // Hủy interval khi component unmount
    useEffect(() => {
        return () => {
            if (interval) clearInterval(interval);
            if (sound) sound.unloadAsync();
            if (recording) recording.stopAndUnloadAsync();
        };
    }, []);

    const formatTime = seconds => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Bắt đầu ghi âm
    const startRecording = async () => {
        try {
            // Xin quyền truy cập micro
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                alert('Cần cấp quyền truy cập micro để ghi âm');
                return;
            }

            // Cấu hình audio
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Bắt đầu ghi âm
            const { recording } = await Audio.Recording.createAsync(
                Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
            );

            setRecording(recording);
            setIsRecording(true);
            setRecordTime(0);

            // Bắt đầu đếm thời gian
            interval = setInterval(() => {
                setRecordTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Lỗi khi bắt đầu ghi âm:', err);
            setIsRecording(false);
        }
    };

    // Dừng ghi âm
    const stopRecording = async () => {
        try {
            if (interval) clearInterval(interval);

            if (recording) {
                await recording.stopAndUnloadAsync();
                const uri = recording.getURI();
                setRecordedUri(uri);
                setRecording(null);
                console.log('Bản ghi âm đã lưu tại:', uri);
            }

            setIsRecording(false);
        } catch (err) {
            console.error('Lỗi khi dừng ghi âm:', err);
        }
    };

    // Phát lại bản ghi
    const playRecording = async () => {
        if (!recordedUri) return;

        try {
            // Dừng phát nếu đang phát
            if (sound) {
                await sound.unloadAsync();
            }

            setIsPlaying(true);
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: recordedUri },
                { shouldPlay: true }
            );

            setSound(newSound);

            newSound.setOnPlaybackStatusUpdate(status => {
                if (status.didJustFinish) {
                    setIsPlaying(false);
                }
            });

            await newSound.playAsync();
        } catch (err) {
            console.error('Lỗi khi phát bản ghi:', err);
            setIsPlaying(false);
        }
    };

    // Dừng phát
    const stopPlayback = async () => {
        if (sound) {
            await sound.stopAsync();
            setIsPlaying(false);
        }
    };

    // Xóa bản ghi
    const deleteRecording = () => {
        if (sound) {
            sound.unloadAsync();
            setSound(null);
        }
        setRecordedUri(null);
        setRecordTime(0);
        onClose(); // Tắt modal sau khi xóa
    };
    // Gửi bản ghi
    const sendRecording = async () => {
        if (!recordedUri) return;

        try {
            const fileInfo = await FileSystem.getInfoAsync(recordedUri);
            if (!fileInfo.exists) {
                alert('File ghi âm không tồn tại');
                return;
            }

            const formData = new FormData();
            formData.append('conversationId', conversationId);
            formData.append('channelId', channelId);

            const fileName = `recording_${Date.now()}.m4a`;

            formData.append('file', {
                uri: recordedUri,
                name: fileName,
                type: 'audio/x-m4a', // Sử dụng type chính xác cho m4a
            });

            const response = await api.post('/api/messages/file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Upload thành công:', response.data);

            setRecordedUri(null);
            setRecordTime(0);
            if (onSendRecord) onSendRecord(recordedUri);
            onClose();

        } catch (err) {
            console.error('Chi tiết lỗi:', {
                error: err,
                request: err.request,
                response: err.response?.data
            });
            alert(`Lỗi khi gửi: ${err.message}`);
        }
    };

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.timeText}>{formatTime(recordTime)}</Text>

                    <Text style={styles.hintText}>
                        {isRecording
                            ? 'Đang ghi âm...'
                            : recordTime > 0
                                ? 'Ghi âm hoàn tất'
                                : 'Nhấn nút để bắt đầu ghi âm'}
                    </Text>

                    {isRecording ? (
                        <TouchableOpacity
                            style={[styles.button, styles.stopButton]}
                            onPress={stopRecording}
                        >
                            <Text style={styles.buttonText}>Dừng</Text>
                        </TouchableOpacity>
                    ) : recordTime > 0 ? (
                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.listenButton]}
                                onPress={isPlaying ? stopPlayback : playRecording}
                            >
                                <Text style={styles.buttonText}>
                                    {isPlaying ? 'Dừng phát' : 'Nghe lại'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={deleteRecording}
                            >
                                <Text style={styles.buttonText}>Xóa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.sendButton]}
                                onPress={sendRecording}
                            >
                                <Text style={styles.buttonText}>Gửi</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.button, styles.recordButton]}
                            onPress={startRecording}
                        >
                            <Text style={styles.buttonText}>Ghi âm</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 22,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        alignItems: 'center',
        height: 250,
        width: '100%',
    },
    timeText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    hintText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    button: {
        padding: 15,
        borderRadius: 30,
        marginHorizontal: 10,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordButton: {
        backgroundColor: '#FF3B30',
    },
    stopButton: {
        backgroundColor: '#FF9500',
    },
    sendButton: {
        backgroundColor: '#34C759',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    actionButton: {
        padding: 15,
        borderRadius: 30,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    listenButton: {
        backgroundColor: '#3498db',
    },
    deleteButton: {
        backgroundColor: '#e74c3c',
    },
});

export default VoiceRecordModal;