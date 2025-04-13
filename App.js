
import React, { useRef } from 'react';
import { Provider } from 'react-redux';
import store from './redux/store'; // Đường dẫn store chính xác

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
import ResetPasswordStep1 from './Screens/ResetPasswordStep1';
import ResetPasswordStep2 from './Screens/ResetPasswordStep2';
import useSocketListeners from './hooks/useSocketListeners';

const Stack = createStackNavigator();

// Component con để sử dụng các hook Redux (ví dụ useDispatch)
function AppContainer() {
  // Tạo userRef để lưu thông tin user được lấy từ AsyncStorage
  const userRef = useRef();

  // Gọi useSocketListeners để đăng ký các sự kiện socket
  useSocketListeners(userRef);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ChatScreen" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="FriendList_Screen" component={FriendList_Screen} />
        <Stack.Screen name="AllFriendAndGroup" component={AllFriendAndGroup} />
        <Stack.Screen name="Screen_03" component={Screen_03} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="AddFriendScreen" component={AddFriendScreen} />
        <Stack.Screen name="YourFriendScreen" component={YourFriendScreen} />
        <Stack.Screen name="LoginScreen" component={Login} />
        <Stack.Screen name="SignupScreen" component={Signup} />
        <Stack.Screen name="OtpScreen" component={Otp} />
        <Stack.Screen name="WelcomeScreen" component={Welcome} />
        <Stack.Screen name="HomeScreen" component={Home} />
        <Stack.Screen name="DetailScreen" component={Detail} />
        <Stack.Screen name="GroupDetailScreen" component={GroupDetail} />
        <Stack.Screen name="ChatScreen" component={Chat} />
        <Stack.Screen name="ResetPasswordStep1Screen" component={ResetPasswordStep1} />
        <Stack.Screen name="ResetPasswordStep2Screen" component={ResetPasswordStep2} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContainer />
    </Provider>
  );
}
