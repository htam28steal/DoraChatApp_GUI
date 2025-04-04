import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import FriendList_Screen from './Screens/FriendList_Screen';
import AllFriendAndGroup from './Screens/AllFriendAndGroup';
import Screen_03 from './Screens/Screen_03';
import ProfileScreen from './Screens/ProfileScreen';
import AddFriendScreen from './Screens/AddFriendScreen';
import YourFriendScreen from './Screens/YourFriendScreen';
import Login from './Screens/LoginScreen';
import Signup from './Screens/SignupScreen';
import Otp from './Screens/OtpScreen';
import Welcome from './Screens/WelcomeScreen';
import Home from './Screens/HomeScreen';
import Detail from './Screens/DetailScreen';
import GroupDetail from './Screens/GroupDetailScreen';
import Chat from './Screens/ChatScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="WelcomeScreen">
        <Stack.Screen name="FriendList_Screen" component={FriendList_Screen} options={{ headerShown: false }} />
        <Stack.Screen name="AllFriendAndGroup" component={AllFriendAndGroup} options={{ headerShown: false }} />
        <Stack.Screen name="Screen_03" component={Screen_03} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddFriendScreen" component={AddFriendScreen} options={{ headerShown: false }} />
        <Stack.Screen name="YourFriendScreen" component={YourFriendScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="LoginScreen"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignupScreen"
          component={Signup}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OtpScreen"
          component={Otp}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WelcomeScreen"
          component={Welcome}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeScreen"
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DetailScreen"
          component={Detail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroupDetailScreen"
          component={GroupDetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChatScreen"
          component={Chat}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
