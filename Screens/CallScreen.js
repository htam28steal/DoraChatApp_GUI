import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "../api/apiConfig";

const CREATE_ROOM_URL = "/api/daily/create-room";
export default function DailyVideoCallScreen({ navigation, route }) {
  const [userName, setUserName] = useState("");
  const [roomUrl, setRoomUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const webviewRef = useRef(null);

  const { conversationId } = route.params;

    // 1) Helper to leave the call & navigate back
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

  // 2) Handle Android hardware back
useEffect(() => {
   const onBackPress = () => {
     leaveCall();
     return true;
   };
   const subscription = BackHandler.addEventListener(
     "hardwareBackPress",
     onBackPress
   );
   return () => subscription.remove();
 }, [leaveCall]);

  useEffect(() => {
    (async () => {
      try {
        const userJson = await AsyncStorage.getItem("userInfo");
        const user = userJson ? JSON.parse(userJson) : {};
        const name = user.name || "Guest";
        setUserName(name);

        const resp = await axios.post(CREATE_ROOM_URL, { conversationId });
        const { url } = resp.data;
        const fullUrl = url + (url.includes("?") ? "&" : "?") + "userName=" + encodeURIComponent(name);

        setRoomUrl(fullUrl);
                console.log(url);
      } catch (e) {
        console.error("Daily room error:", e);
        Alert.alert("Error", e.message || "Could not join call");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#086DC0" size="large" />
      </View>
    );
  }

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
        source={{ uri: roomUrl }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onPermissionRequest={({ nativeEvent }) => {
          nativeEvent.grant(nativeEvent.resources);
        }}
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
    marginTop:30
  },
  backBtn: { paddingRight: 18, paddingVertical: 8},
  arrow: { fontSize: 24, color: "#086DC0" },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#086DC0" },
});
