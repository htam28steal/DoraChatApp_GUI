import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Screen_01 from './Screens/Screen_01';
import Screen_02 from './Screens/Screen_02';
import Screen_03 from './Screens/Screen_03';
import Screen_04 from './Screens/Screen_04';
import Screen_05 from './Screens/Screen_05';
import Screen_06 from './Screens/Screen_06';
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
      <Stack.Navigator initialRouteName="GroupDetailScreen">
        <Stack.Screen name="Screen_01" component={Screen_01} options={{ headerShown: false }} />
        <Stack.Screen name="Screen_02" component={Screen_02} options={{ headerShown: false }} />
        <Stack.Screen name="Screen_03" component={Screen_03} options={{ headerShown: false }} />
        <Stack.Screen name="Screen_04" component={Screen_04} options={{ headerShown: false }} />
        <Stack.Screen name="Screen_05" component={Screen_05} options={{ headerShown: false }} />
        <Stack.Screen name="Screen_06" component={Screen_06} options={{ headerShown: false }} />
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
