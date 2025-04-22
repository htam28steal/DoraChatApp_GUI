import axios from "./apiConfig";

const conversationApi = {
  fetchConversations: () => {
    return axios.get("/api/conversations");
  },
  createConversation: (userIds) => {
    return axios.post(`/api/conversations/individuals/${userIds}`);
  },
  //   markAsRead: (conversationId) => {
  //     return axios.put(`/api/messages/${conversationId}/mark-as-read`);
  //   },
};

export default conversationApi;
