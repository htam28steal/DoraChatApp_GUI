export const codeRevokeRef = { current: null };

export const API_STATUS = {
  SUCCESS: "success",
  ERROR: "error",
  LOADING: "loading",
};

export const SOCKET_EVENTS = {
  //Join socket user id
  JOIN_USER: "join",
  //Chat
  SEND_MESSAGE: "send-message",
  RECEIVE_MESSAGE: "receive-message",
  MESSAGE_RECALLED: "message-recalled",
  MESSAGE_DELETED_FOR_ME: "message_deleted_for_me",
  // Friend system
  ACCEPT_FRIEND: "accept-friend",
  SEND_FRIEND_INVITE: "send-friend-invite",
  DELETED_FRIEND_INVITE: "deleted-friend-invite",
  DELETED_INVITE_WAS_SEND: "deleted-invite-was-send",
  DELETED_FRIEND: "deleted-friend",
  REVOKE_TOKEN: "revoke-token",

  // User presence
  JOIN: "join",
  DISCONNECT: "disconnect",

  // Conversations
  JOIN_CONVERSATIONS: "join-conversations",
  JOIN_CONVERSATION: "join-conversation",
  LEAVE_CONVERSATION: "leave-conversation",

  // Typing indicators
  TYPING: "typing",
  NOT_TYPING: "not-typing",

  // Online status
  GET_USER_ONLINE: "get-user-online",

  // Video call
  SUBSCRIBE_CALL_VIDEO: "subscribe-call-video",
  NEW_USER_CALL: "new-user-call",

  // Last view tracking
  CONVERSATION_LAST_VIEW: "conversation-last-view",
  USER_LAST_VIEW: "user-last-view",
};
