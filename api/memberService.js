import api from "./apiConfig";

const memberApi = {
    isMember: (conversationId, userId) => {
        return axios.get("api/members/is-member", {
            params: {
                conversationId,
                userId,
            },
        });
    },

    getMembers: (conversationId) => {
        return axios.get(`api/members/${conversationId}`);
    },

    getByConversationIdAndUserId: (conversationId, userId) => {
        return axios.get(`api/members/${conversationId}/${userId}`);
    },

    getByMemberId: (memberId) => {
        return axios.get(`api/members/member/${memberId}`);
    },

    updateName: (conversationId, memberId, name) => {
        return axios.patch(`api/members/${conversationId}/${memberId}`, { name });
    },
}

export default memberService;
