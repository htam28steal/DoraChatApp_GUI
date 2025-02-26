import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import bg from '../assets/bg.png';

const WelcomeScreen = () => {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    navigation.navigate("HomeScreen"); // Navigate to HomeScreen
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={bg} style={styles.gradient} resizeMode="cover">
        {/* Logo & Slogan */}
        <View style={styles.banner}>
          <Image source={require('../Images/logoDoRa.png')} style={styles.logo} />
          <Text style={styles.statement}>Everywhere you want to be</Text>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Image source={require('../assets/Cat.png')} style={styles.catImage} />
          <View>
            <Text style={styles.welcomeTitle}>
              WELCOME TO <Text style={{color:'#086DC0'}}>D<Text style={{color:'#FFBD59'}}>O</Text>RA</Text>
            </Text>
            <Text style={styles.subtitle}>Let's start a conversation with everyone</Text>
          </View>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity 
          style={styles.getStartedBtn} 
          onPress={handleGetStarted}
        >
          <Image source={require('../assets/rocket.png')} style={styles.rocketIcon} />
          <Text style={styles.getStartedText}>Get started</Text>
        </TouchableOpacity>
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
  banner: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statement: {
    color: "#FFBD59",
    fontSize: 12,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 0,
    fontWeight: 'bold',
  },
  logo: {
    width: 300,
    height: 60,
    marginBottom: 15,
  },
  welcomeSection: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  catImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  welcomeTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
  },
  getStartedBtn: {
    flexDirection: 'row',
    width: 140,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#086DC0',
    borderRadius: 30,
    marginTop: 20,
  },
  rocketIcon: {
    marginRight: 5,
    width: 20,
    height: 20,
  },
  getStartedText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;
