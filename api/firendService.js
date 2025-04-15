import api from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FriendService = {
    getListFriends: async (name = '') => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const response = await api.get('/api/friends', {
                params: { name },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching friend list:', error.response?.data || error.message);
            throw error;
        }
    },
};

export default FriendService;
