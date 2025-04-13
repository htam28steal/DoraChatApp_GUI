// redux/actions.js

// Action Types
export const SET_NEW_FRIEND = 'SET_NEW_FRIEND';
export const SET_MY_REQUEST_FRIEND = 'SET_MY_REQUEST_FRIEND';
export const SET_NEW_REQUEST_FRIEND = 'SET_NEW_REQUEST_FRIEND';
export const SET_AMOUNT_NOTIFY = 'SET_AMOUNT_NOTIFY';
export const UPDATE_MY_REQUEST_FRIEND = 'UPDATE_MY_REQUEST_FRIEND';
export const UPDATE_REQUEST_FRIENDS = 'UPDATE_REQUEST_FRIENDS';
export const UPDATE_FRIEND = 'UPDATE_FRIEND';
export const UPDATE_FRIEND_CHAT = 'UPDATE_FRIEND_CHAT';
export const SET_FRIEND_ONLINE_STATUS = 'SET_FRIEND_ONLINE_STATUS';
export const SET_FRIEND_TYPING_STATUS = 'SET_FRIEND_TYPING_STATUS';
export const RECEIVE_MESSAGE = 'RECEIVE_MESSAGE'; // thêm mới
export const REVOKE_USER_TOKEN = 'REVOKE_USER_TOKEN'; // thêm mới nếu cần

// Action Creators
export const setNewFriend = (friend) => ({
  type: SET_NEW_FRIEND,
  payload: friend,
});

export const setMyRequestFriend = (friendId) => ({
  type: SET_MY_REQUEST_FRIEND,
  payload: friendId,
});

export const setNewRequestFriend = (request) => ({
  type: SET_NEW_REQUEST_FRIEND,
  payload: request,
});

export const setAmountNotify = (amount) => ({
  type: SET_AMOUNT_NOTIFY,
  payload: amount,
});

export const updateMyRequestFriend = (id) => ({
  type: UPDATE_MY_REQUEST_FRIEND,
  payload: id,
});

export const updateRequestFriends = (id) => ({
  type: UPDATE_REQUEST_FRIENDS,
  payload: id,
});

export const updateFriend = (id) => ({
  type: UPDATE_FRIEND,
  payload: id,
});

export const updateFriendChat = (id) => ({
  type: UPDATE_FRIEND_CHAT,
  payload: id,
});

export const setFriendOnlineStatus = ({ friendId, isOnline }) => ({
  type: SET_FRIEND_ONLINE_STATUS,
  payload: { friendId, isOnline },
});

export const setFriendTypingStatus = ({ friendId, isTyping }) => ({
  type: SET_FRIEND_TYPING_STATUS,
  payload: { friendId, isTyping },
});

// NEW: nhận tin nhắn
export const receiveMessage = (message) => ({
  type: RECEIVE_MESSAGE,
  payload: message,
});

// NEW: thu hồi token
export const revokeUserToken = () => ({
  type: REVOKE_USER_TOKEN,
});
