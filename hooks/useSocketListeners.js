// hooks/useSocketListeners.js
import { useEffect, useRef, useState, useTransition } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import {
  setNewFriend, setMyRequestFriend, setNewRequestFriend,
  setAmountNotify, updateMyRequestFriend, updateRequestFriends,
  updateFriend, updateFriendChat, setFriendOnlineStatus,
  setFriendTypingStatus
} from '../redux/actions.js';
import { SOCKET_EVENTS } from '../utils/constant.js';
import { init, socket, isConnected } from '../utils/socketClient.js';

const useSocketListeners = (userRef) => {
  const dispatch = useDispatch();
  const [socketInitialized, setSocketInitialized] = useState(false);
  const codeRevokeRef = useRef(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const checkUser = async () => {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        userRef.current = JSON.parse(userJson);
      }
    };
    checkUser();
    const interval = setInterval(checkUser, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isConnected()) {
      startTransition(() => {
        init();
        setSocketInitialized(true);
      });
    }

    return () => {
      if (socket) socket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket || !userRef.current?._id) return;

    socket.on("connect", () => {
      socket.emit(SOCKET_EVENTS.JOIN, userRef.current._id);
    });

    const handleAcceptFriend = (value) => {
      startTransition(() => {
        dispatch(setNewFriend(value));
        dispatch(setMyRequestFriend(value._id));
      });
    };

    const handleFriendInvite = (value) => {
      startTransition(() => {
        dispatch(setNewRequestFriend(value));
        dispatch(setAmountNotify((prev) => prev + 1));
      });
    };

    const handleDeleteFriendInvite = (_id) => {
      startTransition(() => dispatch(updateMyRequestFriend(_id)));
    };

    const handleDeleteInviteSend = (_id) => {
      startTransition(() => dispatch(updateRequestFriends(_id)));
    };

    const handleDeleteFriend = (_id) => {
      startTransition(() => {
        dispatch(updateFriend(_id));
        dispatch(updateFriendChat(_id));
      });
    };

    const handleRevokeToken = async ({ key }) => {
      if (codeRevokeRef.current !== key) {
        await AsyncStorage.multiRemove(['userToken', 'refreshToken', 'user']);
        Alert.alert("Thông báo", "Phiên đăng nhập đã hết hạn.");
        // Có thể chuyển hướng về màn Login nếu muốn
      }
    };

    const handleFriendOnlineStatus = (data) => {
      startTransition(() => {
        dispatch(setFriendOnlineStatus({ friendId: data.userId, isOnline: data.isOnline }));
      });
    };

    const handleFriendTyping = (data) => {
      startTransition(() => {
        dispatch(setFriendTypingStatus({ friendId: data.userId, isTyping: data.isTyping }));
        if (data.isTyping) {
          setTimeout(() => {
            dispatch(setFriendTypingStatus({ friendId: data.userId, isTyping: false }));
          }, 3000);
        }
      });
    };

    if (socketInitialized) {
      socket.emit(SOCKET_EVENTS.JOIN_USER, userRef.current._id);
    }

    socket.on(SOCKET_EVENTS.ACCEPT_FRIEND, handleAcceptFriend);
    socket.on(SOCKET_EVENTS.SEND_FRIEND_INVITE, handleFriendInvite);
    socket.on(SOCKET_EVENTS.DELETED_FRIEND_INVITE, handleDeleteFriendInvite);
    socket.on(SOCKET_EVENTS.DELETED_INVITE_WAS_SEND, handleDeleteInviteSend);
    socket.on(SOCKET_EVENTS.DELETED_FRIEND, handleDeleteFriend);
    socket.on(SOCKET_EVENTS.REVOKE_TOKEN, handleRevokeToken);
    socket.on(SOCKET_EVENTS.FRIEND_ONLINE_STATUS, handleFriendOnlineStatus);
    socket.on(SOCKET_EVENTS.FRIEND_TYPING, handleFriendTyping);

    return () => {
      socket.off(SOCKET_EVENTS.ACCEPT_FRIEND, handleAcceptFriend);
      socket.off(SOCKET_EVENTS.SEND_FRIEND_INVITE, handleFriendInvite);
      socket.off(SOCKET_EVENTS.DELETED_FRIEND_INVITE, handleDeleteFriendInvite);
      socket.off(SOCKET_EVENTS.DELETED_INVITE_WAS_SEND, handleDeleteInviteSend);
      socket.off(SOCKET_EVENTS.DELETED_FRIEND, handleDeleteFriend);
      socket.off(SOCKET_EVENTS.REVOKE_TOKEN, handleRevokeToken);
      socket.off(SOCKET_EVENTS.FRIEND_ONLINE_STATUS, handleFriendOnlineStatus);
      socket.off(SOCKET_EVENTS.FRIEND_TYPING, handleFriendTyping);
    };
  }, [socketInitialized, socket]);
};

export default useSocketListeners;
