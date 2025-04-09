import api from './apiConfig';
import { Platform } from 'react-native';

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
export const updateAvatarUser = async (userId, reqFile, token) => {
    try {
        const formData = new FormData();
        formData.append('id', userId);

        if (Platform.OS === 'web') {
            const file = reqFile.uri.includes('base64')
                ? dataURLtoFile(reqFile.uri, reqFile.fileName || `avatar-${Date.now()}.jpg`)
                : reqFile;

            formData.append('avatar', file);
        } else {
            formData.append('avatar', {
                uri: reqFile.uri,
                name: reqFile.fileName || `avatar-${Date.now()}.jpg`,
                type: reqFile.type || 'image/jpeg',
            });
        }

        console.log('FormData được gửi:', formData);

        const response = await api.put(`/api/me/avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        });

        return response.data;
    } catch (err) {
        console.error('Lỗi khi cập nhật avatar:', err);
        throw err;
    }
};

const dataURLtoFile = (dataURL, filename) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
};