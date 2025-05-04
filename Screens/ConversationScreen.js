import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from '../api/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ConversationScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId);
        const res = await axios.get('/api/conversations', {
          params: { userId: storedUserId },
        });
        const onlyFalse = Array.isArray(res.data)
          ? res.data.filter(c => c.type === false)
          : [];
        setConversations(onlyFalse);
        setFiltered(onlyFalse);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not load conversations.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // simple client‐side search filter
  useEffect(() => {
    if (!query) {
      setFiltered(conversations);
    } else {
      const q = query.toLowerCase();
      setFiltered(conversations.filter(c =>
        c.members.some(m =>
          (m.name || '').toLowerCase().includes(q)
        )
      ));
    }
  }, [query, conversations]);

  const renderItem = ({ item }) => {
    // pick the other participant
    const other = item.members.find(m => m.userId !== userId) || {};
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('ChatScreen', {
            conversation: item,
            userId,
          })
        }
      >
        <Image
          source={
            other.avatar
              ? { uri: other.avatar }
              : require('../Images/avt.png')
          }
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={styles.name}>
            {other.name || 'Unnamed'}
          </Text>
          <Text style={styles.snippet} numberOfLines={1}>
            {item.lastMessageId?.content || 'No messages yet.'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* full-screen background */}
      <Image
        source={require('../Images/bground.png')}
        style={styles.bg}
      />

      {/* header with search + add */}
      <View style={styles.header}>
        <Image
          source={require('../icons/searchicon.png')}
          style={styles.icon}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor="#aaa"
          style={styles.searchInput}
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('NewConversation')}
        >
          <Image
            source={require('../icons/plus.png')}
            style={styles.addIcon}
          />
        </TouchableOpacity>
      </View>

      {/* optionally, filter tabs could go here */}
      {/* <View style={styles.filterRow}>…</View> */}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#086DC0"
          style={{ marginTop: 150 }}
        />
      ) : filtered.length === 0 ? (
        <Text style={styles.placeholderText}>
          No conversations found.
        </Text>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filtered}
          keyExtractor={item => item._id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D8EDFF',
  },
  bg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    height: 45,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 2,
  },
  icon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  addBtn: {
    marginLeft: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F9DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    width: 16,
    height: 16,
  },
  list: {
    paddingTop: 70,      // make room for header
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    // subtle shadow
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#086DC0',
  },
  snippet: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: 150,
    fontSize: 16,
    color: '#555',
  },
});
