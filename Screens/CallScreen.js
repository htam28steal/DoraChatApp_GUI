import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "../api/apiConfig";
import Toast from "react-native-toast-message";
import { createMeetingToken } from "../api/createMeetingToken";
import { Camera } from "expo-camera"; // ✅ Dùng expo-camera thay PermissionsAndroid

const CREATE_ROOM_URL = "/api/daily/create-room";
const LEAVE_ROOM_URL = "/api/daily/leave-room";

export default function DailyVideoCallScreen({ navigation, route }) {
  const [userName, setUserName] = useState("");
  const [roomUrl, setRoomUrl] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const webviewRef = useRef(null);

  const { conversationId, channelId } = route.params;

  // ✅ Hàm request quyền cho cả iOS & Android
  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();

    // console.log("Camera:", cameraStatus, "Microphone:", audioStatus);
    if (cameraStatus !== "granted" || audioStatus !== "granted") {
      Alert.alert(
        "Quyền bị từ chối",
        "App cần quyền Camera và Microphone để thực hiện cuộc gọi."
      );
    }
  };

  const leaveCall = useCallback(async () => {
    if (leaving) return; // chặn spam
    setLeaving(true);

    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        if(window.leaveCall) {
          window.leaveCall();
        }
        true;
      `);
    }

    try {
      const userToken = await AsyncStorage.getItem("userToken");
      await axios.post(
        LEAVE_ROOM_URL,
        {},
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );
      // console.log("✅ Đã rời call & clear dữ liệu trên server.");
    } catch (err) {
      // console.error("❌ Lỗi khi gọi API leave-room:", err);
      Toast.show({
        type: "error",
        text1: "Fail to leave call",
      });
    } finally {
      setLeaving(false);
      navigation.goBack();
    }
  }, [navigation, leaving]);

  useEffect(() => {
    const onBackPress = () => {
      leaveCall();
      return true;
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [leaveCall]);

  useEffect(() => {
    (async () => {
      try {
        // ✅ Gọi requestPermissions trước
        await requestPermissions();

        // Lấy user name
        const userJson = await AsyncStorage.getItem("userInfo");
        const user = userJson ? JSON.parse(userJson) : {};
        const name = user.name || "Guest";
        setUserName(name);

        const conversationRoomId = conversationId + channelId;
        const userToken = await AsyncStorage.getItem("userToken");

        const { data } = await axios.post(
          CREATE_ROOM_URL,
          { conversationId: conversationRoomId },
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        const { url } = data;
        const roomName = url.split("/").at(-1);

        // Tạo token join Daily
        const newToken = await createMeetingToken(roomName, name);

        // Set roomUrl & token
        setRoomUrl(url);
        setToken(newToken);
      } catch (err) {
        // console.error("❌ Lỗi khi tạo room:", err);
        Toast.show({
          type: "error",
          text1: "Fail to call",
        });
        setTimeout(() => navigation.navigate("ConversationScreen"), 1500);
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId, channelId, navigation]);

  if (loading || !roomUrl || !token) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#086DC0" size="large" />
        <Text style={{ marginTop: 10, color: "#086DC0" }}>Đang kết nối tới phòng họp…</Text>
      </View>
    );
  }

  const fullUrl = `${roomUrl}?t=${token}`;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={leaveCall} style={styles.backBtn}>
          <Text style={styles.arrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Call</Text>
      </View>

      <WebView
        ref={webviewRef}
        source={{ uri: fullUrl }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={["*"]}
        androidHardwareAccelerationDisabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "#F6FBFF",
    borderBottomWidth: 1,
    borderColor: "#eaeaea",
    marginTop: 30,
  },
  backBtn: { paddingRight: 18, paddingVertical: 8 },
  arrow: { fontSize: 24, color: "#086DC0" },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#086DC0" },
});
