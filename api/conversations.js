import axios from "./apiConfig";

const conversationApi = {
  fetchConversations: () => {
    return axios.get("/api/conversations");
  },
  createConversation: (userIds) => {
    return axios.post(`/api/conversations/individuals/${userIds}`);
  },
  addMembersToConversation: (conversationId, members) => {
    return axios.post(`/api/conversations/${conversationId}/members`, {
      userIds: members,
    });
  },
  deleteConversationBeforetime: (conversationId) => {
    return axios.delete(`/api/conversations/${conversationId}`);
  },
  removeMemberFromConversation: (conversationId, memberId) => {
    return axios.delete(
      `/api/conversations/${conversationId}/members/${memberId}`
    );
  },
  getConversationById: (conversationId) => {
    return axios.get(`/api/conversations/${conversationId}`);
  },
  createGroupConversation: (name, members) => {
    return axios.post("/api/conversations/groups", {
      name,
      members,
    });
  },
  updateGroupName: (conversationId, name) => {
    return axios.patch(`/api/conversations/${conversationId}/name`, { name });
  },
  transferAdmin: (leaderId, newLeaderId) => {
    return axios.patch(`/api/conversations/transfer-admin/${leaderId}`, {
      newAdminId: newLeaderId,
    });
  },
  leaveConversation: (conversationId) => {
    return axios.delete(`/api/conversations/members/leave/${conversationId}`);
  },
  disbandGroup: (conversationId) => {
    return axios.delete(`/api/conversations/disband/${conversationId}`);
  },
  addManagersToConversation: (conversationId, members) => {
    return axios.post(`/api/conversations/${conversationId}/managers`, {
      memberIds: members,
    });
  },
  //   markAsRead: (conversationId) => {
  //     return axios.put(`/api/messages/${conversationId}/mark-as-read`);
  //   },
};

export default conversationApi;

