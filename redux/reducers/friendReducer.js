// redux/reducers/friendReducer.js
import {
    SET_NEW_FRIEND,
    SET_MY_REQUEST_FRIEND,
    SET_NEW_REQUEST_FRIEND,
    SET_AMOUNT_NOTIFY,
    UPDATE_MY_REQUEST_FRIEND,
    UPDATE_REQUEST_FRIENDS,
    UPDATE_FRIEND,
    UPDATE_FRIEND_CHAT,
    SET_FRIEND_ONLINE_STATUS,
    SET_FRIEND_TYPING_STATUS,
    RECEIVE_MESSAGE
  } from '../actions';
  
  const initialState = {
    friends: [],
    requestFriends: [],
    myRequestFriends: [],
    amountNotify: 0,
    onlineStatus: {},
    typingStatus: {},
    messages: [],
  };
  
  export default function friendReducer(state = initialState, action) {
    switch (action.type) {
      case SET_NEW_FRIEND:
        return { ...state, friends: [...state.friends, action.payload] };
  
      case SET_MY_REQUEST_FRIEND:
        return {
          ...state,
          myRequestFriends: [...state.myRequestFriends, action.payload],
        };
  
      case SET_NEW_REQUEST_FRIEND:
        return {
          ...state,
          requestFriends: [...state.requestFriends, action.payload],
        };
  
      case SET_AMOUNT_NOTIFY:
        return {
          ...state,
          amountNotify: action.payload,
        };
  
      case UPDATE_MY_REQUEST_FRIEND:
        return {
          ...state,
          myRequestFriends: state.myRequestFriends.filter(
            (id) => id !== action.payload
          ),
        };
  
      case UPDATE_REQUEST_FRIENDS:
        return {
          ...state,
          requestFriends: state.requestFriends.filter(
            (id) => id !== action.payload
          ),
        };
  
      case UPDATE_FRIEND:
        return {
          ...state,
          friends: state.friends.filter((f) => f._id !== action.payload),
        };
  
      case UPDATE_FRIEND_CHAT:
        return {
          ...state,
          messages: state.messages.filter((msg) => msg.userId !== action.payload),
        };
  
      case SET_FRIEND_ONLINE_STATUS:
        return {
          ...state,
          onlineStatus: {
            ...state.onlineStatus,
            [action.payload.friendId]: action.payload.isOnline,
          },
        };
  
      case SET_FRIEND_TYPING_STATUS:
        return {
          ...state,
          typingStatus: {
            ...state.typingStatus,
            [action.payload.friendId]: action.payload.isTyping,
          },
        };
  
      case RECEIVE_MESSAGE:
        return {
          ...state,
          messages: [...state.messages, action.payload],
        };
  
      default:
        return state;
    }
  }
  