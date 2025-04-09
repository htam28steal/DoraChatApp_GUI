import { CameraView } from "expo-camera";
import { AppState, Alert, Linking, Platform, SafeAreaView, StatusBar, StyleSheet } from "react-native";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function QRScreen() {
    const qrLock = useRef(false);
    const appState = useRef(AppState.currentState);
    const [hasScanned, setHasScanned] = useState(false);
    const [user, setUser] = useState(null);
    useEffect(() => {
        const getUser = async () => {
            try {
                const userStorage = await AsyncStorage.getItem('userData');
                if (userStorage) {
                    setUser(JSON.parse(userStorage));
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

    const handleQRLogin = async (data: string) => {
        if (!data.startsWith("qrlogin:") || qrLock.current || hasScanned) return;

        const sessionId = data.replace("qrlogin:", "");
        qrLock.current = true;
        setHasScanned(true);

        try {
            const response = await axios.post("http://192.168.1.3:3001/api/auth/qr/verify", {
                sessionId,
                userId: user._id,
            });

            if (response) {
                Alert.alert("✅ Thành công", "Đăng nhập thành công qua QR!");
            } else {
                throw new Error("No data returned");
            }
        } catch (err) {
            console.error(err);
            Alert.alert("❌ Lỗi", "Không thể xác thực QR. Hãy thử lại.");
        }
    };

    return (
        <SafeAreaView style={StyleSheet.absoluteFillObject}>

            {Platform.OS === "android" && <StatusBar hidden />}
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={({ data }) => handleQRLogin(data)}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />
        </SafeAreaView>
    );
}
