import React, { useState, useEffect } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    Text,
    StatusBar,
    TextInput,
    TouchableOpacity,
    Image,
    Alert
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import FriendService from "../api/friendService";
import UserService from '../api/userService';

export default function ListRequestFirendScreen({ navigation }) {
    const [userId, setUserId] = useState(null);
    const [txtSearch, setTxtSearch] = useState('');
    const [listSearch, setListSearch] = useState([]);
    const [stateFriend, setStateFriend] = useState(null);
    const [sentInvites, setSentInvites] = useState([]);

    useEffect(() => {
        const loadUserId = async () => {
            const id = await AsyncStorage.getItem("userId");
            setUserId(id);
        };
        loadUserId();
    }, []);



    const handleSearch = async (phoneNumber) => {
        try {
            const result = await UserService.getUserByPhoneNumber(phoneNumber);

            if (result) {
                setListSearch([result]);

                const check = await FriendService.isFriend(userId, result._id);
                setStateFriend(check);

                const response = await FriendService.getListFriendInviteMe();



                // Kiểm tra người được tìm có trong danh sách đã gửi lời mời chưa
                console.log('_Id result', result._id);
                // console.log('_Id inviteList', inviteList[0]._id)
                const isPending = response.some(invite => invite._id === result._id);

                setSentInvites(isPending ? "pending" : null);
                if (isPending) {
                    setSentInvites("pending");
                } else {
                    setSentInvites(null);
                }

            } else {
                setListSearch([]);
                setStateFriend(null);
                setSentInvites(null);
                Alert.alert("Không tìm thấy người dùng");
            }
        } catch (err) {
            console.error("Search error:", err);
            setListSearch([]);
            setStateFriend(null);
            setSentInvites(null);
            Alert.alert("Lỗi xảy ra khi tìm kiếm");
        }
    };
    const handleThuHoi = async (userId) => {
        try {
            await FriendService.deleteInviteWasSend(userId);
            setSentInvites(false);
            setStateFriend(false);
        } catch (error) {
            console.error('Lỗi khi thu hồi lời mời:', error);
            Alert.alert('Lỗi', 'Không thể thu hồi lời mời. Vui lòng thử lại.');
        }
    };



    const handleAddFriend = async (friendId) => {
        try {
            const response = await FriendService.sendFriendInvite(friendId);
            if (response.status === 201) {
                setSentInvites("pending");

                Alert.alert("Đã gửi lời mời kết bạn");
            }
        } catch (error) {
            console.error("Error sending friend request:", error);
            Alert.alert("Không thể gửi lời mời kết bạn");
        }
    };

    const renderFriend = ({ item }) => (
        <TouchableOpacity style={styles.fMessage}>
            {item.avatar ? (
                <Image
                    source={{ uri: item.avatar }}
                    style={styles.avatar}
                />
            ) : (
                <View style={[
                    styles.avatarCl,
                    { backgroundColor: item.avatarColor || '#086DC0', justifyContent: 'center', alignItems: 'center' }
                ]}>
                    <Text style={styles.avatarText}>{item.name?.charAt(0)}</Text>
                </View>
            )}

            <View style={styles.fInfor}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.username}</Text>

                {stateFriend === false && (
                    <View style={styles.fbtn}>
                        <TouchableOpacity
                            style={styles.btnAccept}
                            onPress={() => handleAddFriend(item._id)}
                        >
                            <Image source={require('../icons/addf.png')} style={styles.iconaddF} />
                            <Text style={styles.txtAccecpt}>Kết bạn</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {stateFriend === true && (
                    <View style={styles.fbtn}>
                        <TouchableOpacity style={[styles.btnAccept, { backgroundColor: '#999' }]}>
                            <Text style={styles.txtAccecpt}>Đã kết bạn</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {sentInvites === "pending" && (
                    <View style={styles.fbtn}>
                        <TouchableOpacity style={[styles.btnAccept, { backgroundColor: '#FFA500' }]} onPress={() => handleThuHoi(item._id)}>
                            <Text style={styles.txtAccecpt}>Đã gửi lời mời</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.fbg}>
                <Image
                    source={require('../Images/bground.png')}
                    style={styles.bg}
                />
            </View>
            <View style={styles.fcontent}>
                <View style={styles.fcontrol}>
                    <View style={styles.iconGoBack}>
                        <TouchableOpacity
                            style={styles.imgIconBack}
                            onPress={() => navigation.goBack()}
                        >
                            <Image style={styles.imgIconBack} source={require('../icons/back.png')} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.fSearch}>
                        <TextInput
                            style={styles.txtSearch}
                            value={txtSearch}
                            onChangeText={setTxtSearch}
                            placeholder="Tìm kiếm bạn bè..."
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={() => handleSearch(txtSearch)}
                    >
                        <Text>Tìm</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.fListFriend}>
                <FlatList
                    data={listSearch}
                    renderItem={renderFriend}
                    keyExtractor={(item) => item._id}
                    ListEmptyComponent={
                        <Text style={styles.emptyListText}>
                            {txtSearch ? "Không tìm thấy người dùng." : "Nhập số điện thoại để tìm kiếm."}
                        </Text>
                    }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 30,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fbg: {
        width: '100%',
        height: '100%',
    },
    bg: {
        width: '100%',
        height: '100%',
    },
    fcontent: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        padding: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    fcontrol: {
        width: '100%',
        height: 35,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    searchButton: {
        padding: 5,
        marginLeft: 5,
        backgroundColor: '#086DC0',
        borderRadius: 5,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fListFriend: {
        position: 'absolute',
        width: '100%',
        height: '80%',
        padding: 5,
        top: 50,
    },
    emptyListText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
    fMessage: {
        width: '100%',
        height: 60,
        flexDirection: 'row',
        borderWidth: 1,
        marginTop: 5,
        borderRadius: 8,
        borderColor: '#ccc',
        backgroundColor: 'white',
    },
    avatar: {
        width: 65,
        height: 60,
        borderRadius: 30,
        marginRight: 10,
    },
    avatarCl: {
        width: 65,
        height: 60,
        borderRadius: 30,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fInfor: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        padding: 5,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    email: {
        fontSize: 13,
        fontWeight: '400',
    },
    fbtn: {
        position: 'absolute',
        right: 10,
        height: 30,
    },
    btnAccept: {
        width: 100,
        height: '100%',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CBB17',
        flexDirection: 'row',
        padding: 5,
    },
    txtAccecpt: {
        fontSize: 11,
        fontWeight: '500',
        color: 'white'
    },
    iconGoBack: {
        width: 30,
        height: 30,
    },
    imgIconBack: {
        width: '100%',
        height: '100%'
    },
    fSearch: {
        flex: 1,
        height: 30,
        marginLeft: 10,
        borderRadius: 30,
        backgroundColor: 'white',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    iconaddF: {
        width: 15,
        height: 15,
        marginRight: 5,
    },
    avatarText: {
        fontSize: 25,
        fontWeight: 'bold',
        color: 'white',
    },
});