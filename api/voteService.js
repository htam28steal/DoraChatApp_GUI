import api from "./apiConfig";

const voteService = {
    selectOption: async ({ voteId, optionId, memberId, memberInfo }) => {
        try {
            const response = await api.post(
                `/api/votes/option/select/${voteId}/${optionId}`,
                {
                    memberId,
                    memberInfo: {
                        name: memberInfo.name,
                        avatar: memberInfo.avatar,
                        avatarColor: memberInfo.avatarColor
                    }
                }
            );
            return response.data;
        } catch (err) {
            console.error("Lỗi khi gửi bình chọn:", err);
            throw err;
        }
    },
    createVote: async (voteData) => {
        try {
            const response = await api.post('/api/votes/', voteData);
            return response.data;
        } catch (error) {
            console.error('Error creating vote:', error);
            throw error;
        }
    },
    addVoteOption: async (voteId, memberId, optionName) => {
        try {
            const res = await api.post(`/api/votes/option/${voteId}`, {
                memberId,
                option: {
                    name: optionName,
                },
            });
            return res.data.options[res.data.options.length - 1];
        } catch (error) {
            console.error("Lỗi khi thêm phương án vào bình chọn:", error);
            throw error;
        }
    },

};

export default voteService;
