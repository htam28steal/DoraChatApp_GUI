import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, ImageBackground } from 'react-native';

import bg from '../Images/bground.png';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: 'Hello! How can I help you today?',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'John Nguyen',
          avatar: require('../Images/avt.png'),
        },
      },
    ]);
  }, []);

  const onSend = useCallback((messages = []) => {
    setMessages((prevMessages) => GiftedChat.append(prevMessages, messages));
  }, []);

  const dataProfile = {
    avatar: require('../Images/avt.png'),
    name: 'John Nguyen',
  };

  // Custom Message Bubble
  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: '#D8EDFF',
        },
        left: {
          backgroundColor: '#FFFFFF',
        },
      }}
      textStyle={{
        right: { color: '#000' },
        left: { color: '#000' },
      }}
    />
  );

  // Custom Input Toolbar
  const renderInputToolbar = (props) => (
    <InputToolbar {...props} containerStyle={styles.inputToolbar} />
  );

  // Custom Composer
  const renderComposer = (props) => (
    <View style={styles.inputContainer}>
      <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Attachment pressed')}>
        <Image source={require('../icons/attachment.png')} style={styles.icon} />
      </TouchableOpacity>

      <Composer {...props} textInputStyle={styles.input} placeholder="Message" />

      <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Emoji pressed')}>
        <Image source={require('../icons/emoji.png')} style={styles.icon} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Gallery pressed')}>
        <Image source={require('../icons/gallery.png')} style={styles.icon} />
      </TouchableOpacity>
    </View>
  );

  const renderSend = (props) => (
    <Send {...props}>
      <View style={styles.sendButtonContainer}>
        <View style={styles.sendButton}>
          <Text style={{ color: '#007AFF', fontWeight: 'bold', alignSelf: 'center' }}>Send</Text>
        </View>
      </View>
    </Send>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={bg} style={styles.gradient} resizeMode="cover">
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => console.log('Return pressed')} style={{ marginRight: 10 }}>
              <Image source={require('../icons/back.png')} />
            </TouchableOpacity>
            <Image source={dataProfile.avatar} style={styles.avatar} />
            <Text style={styles.profileName}>{dataProfile.name}</Text>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Call pressed')}>
              <Image source={require('../assets/Call.png')} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Video Call pressed')}>
              <Image source={require('../assets/VideoCall.png')} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Info pressed')}>
              <Image source={require('../assets/Info.png')} />
            </TouchableOpacity>
          </View>
        </View>

        {/* GiftedChat */}
        {/* <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{ _id: 1 }}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderSend={renderSend}
          messagesContainerStyle={{ paddingTop: 60 }}
        /> */}
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  iconButton: {
    padding: 5,
    marginHorizontal: 4,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    flex: 1,
    padding: 5,
    marginRight: 10,
  },
  sendButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    paddingRight: 10,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D8EDFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});

export default ChatScreen;
