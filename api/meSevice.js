import api from './apiConfig';

export const getUserInfo = async (userId, token) => {
    try {
        const response = await api.get(`/api/me/profile/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting user info:', error);
        throw error;
    }
};
export const updatePassword = async (userId, oldPassword, newPassword, token) => {
    try {
        const response = await api.put(`/api/me/password`, {
            id: userId,
            oldPassword: oldPassword,
            newPassword: newPassword,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating password:', error);
        throw error;
    }
};