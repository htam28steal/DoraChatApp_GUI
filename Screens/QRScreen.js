import { CameraView } from "expo-camera";
import { AppState, Alert, Linking, Platform, SafeAreaView, StatusBar, StyleSheet } from "react-native";
import { useEffect, useRef, useState } from "react";
import axios from '../api/apiConfig';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useNavigation } from '@react-navigation/native';


export default function QRScreen() {
     const navigation = useNavigation();
    const qrLock = useRef(false);
    const appState = useRef(AppState.currentState);
    const [hasScanned, setHasScanned] = useState(false);
    const [user, setUser] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

useEffect(() => {
  AsyncStorage.getItem('userId').then(setCurrentUserId);
}, []);

  useEffect(() => {
    const getUser = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            const userToken = await AsyncStorage.getItem('userToken');

            if (userId && userToken) {
                setUser({ _id: userId, token: userToken });
            }
        } catch (err) {
            console.error("Error loading user data:", err);
        }
    };

    getUser();
}, []);


    useEffect(() => {


        const subscription = AppState.addEventListener("change", (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === "active"
            ) {
                qrLock.current = false;
                setHasScanned(false);
            }
            appState.current = nextAppState;
        });

        return () => subscription.remove();
    }, []);

const handleQRScan = async (data) => {
    if (qrLock.current || hasScanned) return;
    qrLock.current = true;
    setHasScanned(true);

    // 1. Try to match login QR
    const loginMatch = data.match(/^qrlogin:([0-9a-fA-F-]+)$/);
    if (loginMatch) {
        // --- QR LOGIN LOGIC HERE ---
        const sessionId = loginMatch[1];
        try {
            await axios.post("/api/auth/qr/verify", {
                sessionId,
                userId: user._id,
            });
            Alert.alert("✅ Thành công", "Đăng nhập thành công qua QR!");
        } catch (err) {
            Alert.alert("❌ Lỗi", "Không thể xác thực QR. Hãy thử lại.");
        }
        return;
    }

    // 2. Try to match user JSON QR
    let userInfo = null;
    try {
        userInfo = JSON.parse(data);
    } catch (e) { userInfo = null; }

    if (userInfo && userInfo.userId) {
        qrLock.current = false;
        setHasScanned(false);

        // Check if userId is yourself
        if (userInfo.userId === currentUserId) {
            navigation.navigate('ProfileScreen');
        } else {
            navigation.navigate('YourFriendScreen', { userId: userInfo.userId });
        }
        return;
    }

    // Not recognized
    Alert.alert("QR Không hợp lệ", "QR này không đúng định dạng.");
    setHasScanned(false);
};



    return (
        <SafeAreaView style={StyleSheet.absoluteFillObject}>

            {Platform.OS === "android" && <StatusBar hidden />}
<CameraView
    style={StyleSheet.absoluteFillObject}
    facing="back"
    onBarcodeScanned={user ? ({ data }) => handleQRScan(data) : undefined}
    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
/>

        </SafeAreaView>
    );
}