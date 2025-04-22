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


    getListRequestFriends: async (userId, token) => {
        try {

            const res = await api.get(`/api/friends/invites`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    _id: userId,
                }
            });
            return res.data;
        } catch (error) {
            console.error('Error fetching friend requests:', error);
            throw error;
        }
    },
    acceptFriend: async (userId) => {
        try {
            const response = await api.post(`/api/friends/${userId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    deleteFriend: async (userId) => {
        try {
            const response = await api.delete(`/api/friends/${userId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    isFriend: async (userId1, userId2) => {
        try {
            const response = await api.get(`/api/friends/is-friend`, {
                params: { userId1, userId2 }
            });
            return response.data;
        } catch (error) {
            console.error("Lỗi khi kiểm tra bạn bè:", error);
            throw error;
        }
    },

    sendFriendInvite: async (friendId) => {
        try {
            const response = await api.post(`/api/friends/invites/me/${friendId}`);

            return response;
        } catch (error) {
            throw error;
        }
    },
    getListFriendInviteMe: async () => {
        try {
            const response = await api.get('/api/friends/invites/me');
            return response.data;
        } catch (err) {
            throw (err)
        }
    },
    deleteInviteWasSend: async (userId) => {
        try {
            const response = await api.delete(`/api/friends/invites/me/${userId}`);
            return response.data;
        } catch (err) {
            throw (err)
        }
    },
    deleteFriendInvite: (userId) => {
        return api.delete(`/api/friends/invites/${userId}`);
    }

};

export default FriendService;
