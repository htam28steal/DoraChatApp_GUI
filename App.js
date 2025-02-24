import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Screen_01 from './Screens/Screen_01';
import Screen_02 from './Screens/Screen_02';
import Screen_03 from './Screens/Screen_03';
import Screen_04 from './Screens/Screen_04';
import Screen_05 from './Screens/Screen_05';
import Screen_06 from './Screens/Screen_06';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Screen_04">
        <Stack.Screen name="Screen_01" component={Screen_01} />
        <Stack.Screen name="Screen_02" component={Screen_02} />
        <Stack.Screen name="Screen_03" component={Screen_03} />
        <Stack.Screen name="Screen_04" component={Screen_04} />
        <Stack.Screen name="Screen_05" component={Screen_05} />
        <Stack.Screen name="Screen_06" component={Screen_06} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
