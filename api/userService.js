import api from "./apiConfig";
import axios from './apiConfig'; // or wherever you import axios from


const UserService = {

    getUserByPhoneNumber: async (phoneNumber) => {
        try {
            const response = await api.get(`/api/users/search/phone-number/${phoneNumber}`);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy user theo số điện thoại:', error);
            throw error;
        }
    },
    getUserById: async (userId) => {
        try {
            const response = await api.get(`/api/users/search/id/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy user :', error);
            throw error;
        }
    },
    

    getUserByEmail: async (email) => {
        const url = `api/users/search/username/${email}`;
        return axios.get(url);
    },

};

export default UserService;