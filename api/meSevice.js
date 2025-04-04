import api from './apiConfig';

export const getUserInfo = async (userId) => {
    try {
        const response = await api.get(`/api/me/profile/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting user info:', error);
        throw error;
    }
};
export const updatePassword = async (userId, oldPassword, newPassword) => {
    try {
        const response = await api.post(`/api/me/update-password`, {
            id: userId,
            oldPassword: oldPassword,
            newPassword: newPassword,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating password:', error);
        throw error;
    }
};