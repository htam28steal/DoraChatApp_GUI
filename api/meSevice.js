import axios from "../api/apiConfig";
import { Platform } from 'react-native';

// GET user profile
export const getUserById = async (token) => {
  const res = await axios.get('/api/me/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

// UPDATE password
export const updatePassword = async (userId, oldPassword, newPassword, token) => {
  try {
    const response = await axios.put(`/api/me/password`, {
      id: userId,
      oldPassword,
      newPassword,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

// UPDATE avatar
export const updateAvatarUser = async (userId, reqFile, token) => {
  return await uploadUserImage('/api/me/avatar', 'avatar', userId, reqFile, token);
};

// UPDATE cover image
export const updateCoverUser = async (userId, reqFile, token) => {
    try {
        const formData = new FormData();
        formData.append('id', userId);

        if (Platform.OS === 'web') {
            const file = reqFile.uri.includes('base64')
                ? dataURLtoFile(reqFile.uri, reqFile.fileName || `cover-${Date.now()}.jpg`)
                : reqFile;

            formData.append('cover', file);
        } else {
            formData.append('cover', {
                uri: reqFile.uri,
                name: reqFile.fileName || `cover-${Date.now()}.jpg`,
                type: reqFile.type || 'image/jpeg',
            });
        }

        console.log('FormData sent for cover image:', formData);

        const response = await axios.put(`/api/me/cover`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            timeout: 10000,
        });

        return response.data;
    } catch (err) {
        console.error('Error updating cover image:', err);
        throw err;
    }
};

// Shared image upload helper
const uploadUserImage = async (endpoint, field, userId, reqFile, token) => {
  try {
    const formData = new FormData();
    formData.append('id', userId);

    if (Platform.OS === 'web') {
      const file = reqFile.uri.includes('base64')
        ? dataURLtoFile(reqFile.uri, reqFile.fileName || `${field}-${Date.now()}.jpg`)
        : reqFile;

      formData.append(field, file);
    } else {
      formData.append(field, {
        uri: reqFile.uri,
        name: reqFile.fileName || `${field}-${Date.now()}.jpg`,
        type: reqFile.type || 'image/jpeg',
      });
    }

    console.log(`Uploading ${field} with FormData:`, formData);

    const response = await axios.put(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      timeout: 10000,
    });

    return response.data;
  } catch (err) {
    console.error(`Error updating ${field}:`, err);
    throw err;
  }
};

// Helper for converting base64 to File for web
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
