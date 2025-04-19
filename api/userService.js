import api from "./apiConfig";

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

};

export default UserService;