import axios from "./apiConfig";

const messageApi = {
  fetchConversations: () => {
    return axios.get("/api/messages/conversations");
  },

  fetchMessages: (conversationId) => {
    return axios.get(`/api/messages/${conversationId}`);
  },
  sendMessage: (body) => {
    return axios.post(`/api/messages/text`, body);
  },

  //   markAsRead: (conversationId) => {
  //     return axios.put(`/api/messages/${conversationId}/mark-as-read`);
  //   },
};

export default messageApi;
