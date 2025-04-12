import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, ImageBackground
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getUserInfo } from '../api/meSevice';


import bg from '../Images/bground.png';

import { useRoute } from '@react-navigation/native';



const HomeScreen = () => {



  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatar, setAvatar] = useState(true);
  const [avatarColor, setAvatarColor] = useState(true);

  const route = useRoute();
  const { token } = route.params;
  const { uID } = route.params;


  const fetchUser = async () => {
    try {
      const data = await getUserInfo(uID, token);
      setUserInfo(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo) {
      setAvatar(userInfo.avatar || null);
      setAvatarColor(userInfo.avatarColor || 'gray');

    }
  }, [userInfo]);

  console.log(avatarColor)
  const navigation = useNavigation();

  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchUser();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUser();
    });
    return unsubscribe;
  }, [navigation]);

  // Filter persons based on the search text (name or phone number match)
  // const filteredData = dataPerson.filter(person =>
  //   person.name.toLowerCase().includes(searchText.toLowerCase()) ||
  //   person.phoneNum.includes(searchText)
  // );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={bg} style={styles.gradient} resizeMode="cover">
        {/* Search Input Section */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.usernameInput}
            placeholder="Search"
            placeholderTextColor="#086DC080"
            value={searchText}
            onChangeText={(text) => setSearchText(text)}
          />
          <TouchableOpacity
            style={styles.searchButton}
          >
            <Image source={require('../icons/plus.png')} style={styles.searchButtonText} />
          </TouchableOpacity>
        </View>

        {/* Render search results if there is any input */}
        {searchText !== '' && (
          <View style={styles.searchResults}>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <View key={index} style={styles.personItem}>
                  <Image source={item.avt} style={styles.personAvatar} />
                  <View>
                    <Text style={styles.personName}>{item.name}</Text>
                    <Text style={styles.personPhone}>{item.phoneNum}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noResults}>No results found</Text>
            )}
          </View>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Image
            source={require('../Images/HomeBG.png')}
            style={{ width: 200, height: 200, alignSelf: 'center' }}
          />
          <Text style={{ fontSize: 30 }}>Good morning,</Text>
          <Text style={{ fontSize: 30, color: '#086DC0' }}>User Admin</Text>
          <Text style={{ fontSize: 15 }}>Let's start chatting with everyone!</Text>
        </View>

        {/* Bottom Options */}
        {/* Bottom Options */}
        <View style={styles.option}>
          <Image source={require('../icons/mess.png')} style={styles.icon} />
          <Image source={require('../icons/searchicon.png')} style={styles.icon} />
          <Image source={require('../icons/Home.png')} style={styles.icon} />
          <Image source={require('../icons/friends.png')} style={styles.icon} />
          <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen', { userInfo, token })}>
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={styles.icon}
              />
            ) : (
              <View
                style={[styles.icon, { backgroundColor: avatarColor, borderRadius: 15 }]} // thêm borderRadius để bo tròn
              />
            )}
          </TouchableOpacity>

        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchSection: {
    width: '100%',
    flexDirection: 'row',
    position: 'absolute',
    top: 40,
    alignItems: 'center',
  },
  usernameInput: {
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 30,
    width: '90%',
    height: 33,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#333',
    paddingLeft: 10,
    paddingTop: 5,
    paddingBottom: 5,
    marginRight: 10,
  },
  searchButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#086DC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    width: 14,
    height: 14
  },
  searchResults: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    maxHeight: 150,
    width: '90%'
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  personPhone: {
    fontSize: 14,
    color: '#555',
  },
  noResults: {
    textAlign: 'center',
    color: '#888',
  },
  mainContent: {
    alignItems: 'center',
    marginTop: 150,
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 25,
  },
  option: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    width: '90%',
    borderRadius: 20,
    paddingLeft: 25,
  },
});

export default HomeScreen;
