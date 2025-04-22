import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import axios from '../api/apiConfig';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId);
  
        const response = await axios.get('/api/conversations', {
          params: { userId: storedUserId },
        });
  
        setConversations(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        Alert.alert(
          "Error fetching conversations",
          error.response?.data?.message || error.message
        );
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);
  

  // Render each conversation item.
  const renderConversationItem = ({ item }) => {
    // Find the other member (not the current user)
    const [otherMember] = item.members.filter(member => member.userId !== userId);
  
    return (
      <TouchableOpacity
      style={styles.conversationItem}
      onPress={() =>
        navigation.navigate('ChatScreen', {
          conversation: item,
          userId: userId, // Make sure userId is defined here.
        })
      }
    >
        <Image
          source={
            otherMember?.avatar
              ? { uri: otherMember.avatar }
              : require('../Images/avt.png')
          }
          style={styles.avatar}
        />
        <View style={styles.conversationInfo}>
          <Text style={styles.name}>
            {otherMember?.name || "Unnamed Conversation"}
          </Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessageId?.content || "No messages yet."}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // If still loading, you can optionally render a loading message.
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.placeholderText}>Loading conversations...</Text>
      </View>
    );
  }

  // If no conversations are available, show a placeholder.
  if (conversations.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.placeholderText}>No conversations available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id.toString()}
        renderItem={renderConversationItem}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D8EDFF', // blue background
  },
  flatListContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    marginVertical: 5,
    borderRadius: 8,
    paddingHorizontal: 10,

  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#086DC0',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  placeholderText: {
    fontSize: 16,
    color: '#086DC0',
  },
});
