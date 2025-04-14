import axios from "./apiConfig";

const conversationApi = {
  fetchConversations: () => {
    return axios.get("/api/conversations");
  },
  //   markAsRead: (conversationId) => {
  //     return axios.put(`/api/messages/${conversationId}/mark-as-read`);
  //   },
};

export default conversationApi;
