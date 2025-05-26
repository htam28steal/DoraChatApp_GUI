import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, BackHandler, Platform } from "react-native";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "../api/apiConfig";
import Toast from 'react-native-toast-message'
import { createMeetingToken } from "../api/createMeetingToken";
import { PermissionsAndroid } from "react-native";
const CREATE_ROOM_URL = "/api/daily/create-room";

export default function DailyVideoCallScreen({ navigation, route }) {
  const [userName, setUserName] = useState("");
  const [roomUrl, setRoomUrl] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const webviewRef = useRef(null);

  const { conversationId, channelId } = route.params;

  const leaveCall = useCallback(() => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        if(window.leaveCall) {
          window.leaveCall();
        }
        true;
      `);
    }
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    const onBackPress = () => {
      leaveCall();
      return true;
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [leaveCall]);

  async function requestPermissions() {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        console.log("Permissions granted:", granted);
      } catch (err) {
        console.warn(err);
      }
    }
  }

  useEffect(() => {
    (async () => {
      try {
        // Lấy tên user từ AsyncStorage
        const userJson = await AsyncStorage.getItem("userInfo");
        const user = userJson ? JSON.parse(userJson) : {};
        const name = user.name || "Guest";
        setUserName(name);
        const conversationRoomId = conversationId + channelId;
        try {
          const token = await AsyncStorage.getItem("userToken");
          const { data } = await axios.post(
            `/api/daily/create-room`,
            { conversationId: conversationRoomId },
          );


          const resp = await axios.post(CREATE_ROOM_URL, { conversationId: conversationRoomId });
          const { url } = resp.data;

          const roomName = url.split("/").at(-1);

          const newToken = await createMeetingToken(roomName, name);

          setRoomUrl(url);
          setToken(newToken);
        } catch (err) {
          navigation.navigate('ConversationScreen');
          Toast.show({
            type: 'error',
            text1: 'Fail to call'
          });
        }

      } catch (e) {
        console.error("Daily room error:", e);
        Alert.alert("Error", e.message || "Could not join call");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId, channelId, navigation]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#086DC0" size="large" />
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
        onPermissionRequest={({ nativeEvent }) => {
          nativeEvent.grant(nativeEvent.resources);
        }}
        originWhitelist={['*']}
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
