import axios from "./apiConfig";


/**
 * Upload nhiều hình ảnh
 * @param {string} userId
 * @param {File[] | any[]} images - Mảng file ảnh (web: File, RN: { uri, name, type })
 */
export const uploadImages = async (userId, images) => {
    const formData = new FormData();
    formData.append('id', userId);

    images.forEach((image) => {
        formData.append('image', image);
    });
    try {
        const response = await axios.post('/api/uploads/images', formData);
        return response.data;
    } catch (err) {
        console.log(err)
    }

};
export const uploadFile = async (userId, file) => {
    const formData = new FormData();

    formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
    });
    try {
        const response = await axios.post('api/uploads/files', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (err) {
        console.log('Upload error:', err.response?.data || err.message);
        throw err;
    }
};