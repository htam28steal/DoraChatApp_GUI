// MediaScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import axios from '../api/apiConfig';
import { Video } from 'expo-av'; // or 'react-native-video'
import { Ionicons } from '@expo/vector-icons'; // for back icon, adjust if you're not using Expo

export default function MediaScreen({ navigation, route }) {
  const { conversationId } = route.params;
  const [allMessages, setAllMessages] = useState([]);
  const [filter, setFilter] = useState('MEDIA'); // MEDIA | FILES | LINKS

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        console.log('🔄 fetching all messages for', conversationId);
        const res = await axios.get(`/api/messages/${conversationId}`);
        console.log('📥 Raw messages fetched:', res.data);
        setAllMessages(res.data);
      } catch (err) {
        console.error('❌ Error fetching media:', err);
      }
    };
    fetchMedia();
  }, [conversationId]);

  // filter messages based on tab
  const filtered = allMessages.filter(msg => {
    if (filter === 'MEDIA') {
      return msg.type === 'IMAGE' || msg.type === 'VIDEO';
    }
    if (filter === 'FILES') {
      return msg.type === 'FILE';
    }
    if (filter === 'LINKS') {
      // assume links are TEXT messages where content is a URL
      return msg.type === 'TEXT' && /^https?:\/\//.test(msg.content);
    }
    return false;
  });

  console.log(`🎯 Filtered (${filter}) messages:`, filtered);

  const numColumns = 3;
  const size = Dimensions.get('window').width / numColumns - 12;

  const renderItem = ({ item }) => (
    <View style={[styles.item, { width: size, height: size }]}>
      {item.type === 'IMAGE' ? (
        <Image source={{ uri: item.content }} style={styles.media} />
      ) : item.type === 'VIDEO' ? (
        <Video
          source={{ uri: item.content }}
          style={styles.media}
          useNativeControls
          resizeMode="cover"
        />
      ) : item.type === 'FILE' ? (
        <View style={styles.filePlaceholder}>
          <Ionicons name="document-text-outline" size={32} />
          <Text numberOfLines={1} style={styles.fileName}>
            {item.fileName || 'file'}
          </Text>
        </View>
      ) : (
        <View style={styles.linkPlaceholder}>
          <Ionicons name="link-outline" size={32} />
          <Text numberOfLines={1} style={styles.linkText}>
            {item.content}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#086DC0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Media & Files</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['MEDIA','FILES','LINKS'].map(key => (
          <TouchableOpacity
            key={key}
            style={[
              styles.tab,
              filter === key && styles.tabActive
            ]}
            onPress={() => setFilter(key)}
          >
            <Text
              style={[
                styles.tabText,
                filter === key && styles.tabTextActive
              ]}
            >
              {key === 'MEDIA' ? 'Photos/Videos' : key === 'FILES' ? 'Files' : 'Links'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text>No {filter === 'MEDIA' ? 'photos or videos' : filter === 'FILES' ? 'files' : 'links'} found.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          numColumns={numColumns}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#086DC0' },

  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: '#fafafa'
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20
  },
  tabActive: {
    backgroundColor: '#086DC0'
  },
  tabText: {
    fontSize: 14,
    color: '#086DC0'
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600'
  },

  list: {
    padding: 6
  },
  item: {
    margin: 3,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center'
  },
  media: {
    width: '100%',
    height: '100%'
  },
  filePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4
  },
  fileName: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center'
  },
  linkPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4
  },
  linkText: {
    marginTop: 4,
    fontSize: 10,
    textAlign: 'center',
    color: '#007AFF'
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
