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

export default function ListRequestFirendScreen({ navigation }) {
    const [userId, setUserId] = useState(null);
    const [friends, setFriends] = useState([]);
    const [tokens, setToken] = useState(true);
    console.log(userId)
    console.log(friends)

    const handleAccept = async (friendId) => {
        console.log(friendId);
        try {

            await FriendService.acceptFriend(friendId);
            Alert.alert("Success", "Friend request accepted!");
            const updatedList = friends.filter(friend => friend._id !== friendId);
            setFriends(updatedList);
        } catch (error) {
            Alert.alert("Error", "Failed to accept friend request");
        }
    };


    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem("userId");
                const token = await AsyncStorage.getItem("userToken");
                setToken(token);
                if (storedUserId) {
                    setUserId(storedUserId);
                } else {
                    Alert.alert("Error", "User id not found.");
                }
            } catch (error) {
                Alert.alert("Error fetching user id", error.message);
            }
        };
        fetchUserId();
    }, []);

    useEffect(() => {
        if (userId && tokens) {
            const fetchFriendsRequest = async () => {
                try {
                    const friendsRequestData = await FriendService.getListRequestFriends(userId, tokens);
                    setFriends(friendsRequestData);
                } catch (err) {
                    console.log(err);
                }
            };
            fetchFriendsRequest();
        }
    }, [userId, tokens]);
    const handleRejectInvite = async (friendId) => {
        try {
            await FriendService.deleteFriendInvite(friendId);
            const updatedList = friends.filter(friend => friend._id !== friendId);
            setFriends(updatedList);


        } catch (error) {
            console.error("Lỗi khi từ chối lời mời:", error);
            Alert.alert("Lỗi", "Không thể từ chối lời mời. Vui lòng thử lại.");
        }
    };




    const renderFriend = ({ item }) => (


        <TouchableOpacity style={styles.fMessage}>
            <Image
                source={item.avatar ? { uri: item.avatar } : null}
                style={styles.avatar}
            />

            {!item.avatar && item.avatarColor ? (
                <View style={[styles.avatarCl, { backgroundColor: item.avatarColor }, { backgroundColor: item.avatarColor, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={styles.avatarText}>{item.name?.charAt(0)}</Text>
                </View>
            ) : null}
            <View style={styles.fInfor}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.username}</Text>

                <View style={styles.fbtn}>
                    <TouchableOpacity style={styles.btnAccept} onPress={() => {
                        console.log("Accept button pressed for ID:", item._id);
                        handleAccept(item._id);
                    }}
                    >
                        <Text style={styles.txtAccecpt}>Chấp nhận</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnTC} onPress={() => { handleRejectInvite(item._id) }}>
                        <Text style={styles.txtTC}>Từ chối</Text>
                    </TouchableOpacity>
                </View>
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
                    <TouchableOpacity style={styles.fFriendList} onPress={() => navigation.navigate("FriendList_Screen")}>
                        <Image
                            source={require('../icons/friend.png')}
                            style={styles.icons}
                        />
                        <Text style={styles.txtfriendlist}>Friend list</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.fRequest} >
                        <Image
                            source={require('../icons/friendrequest.png')}
                            style={styles.icons}
                        />
                        <Text style={styles.txtRequest}>Friend request</Text>
                        <Text style={styles.txtRequest}>(1)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.fContact} onPress={() => { navigation.navigate("ContactScreen") }}>
                        <Image
                            source={require('../icons/contact.png')}
                            style={styles.icons}
                        />
                        <Text style={styles.txtRequest}>Contact</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.btnAdd}>
                    <TouchableOpacity style={styles.btnAdd} onPress={() => navigation.navigate('FindUserScreen')}>
                        <Image
                            source={require('../icons/addFriend.png')}
                            style={styles.iconAdd}
                        />
                    </TouchableOpacity>
                </TouchableOpacity>
            </View>
            <View style={styles.fListFriend}>
                <FlatList
                    data={friends}
                    renderItem={renderFriend}
                    keyExtractor={(item) => item._id}
                    ListEmptyComponent={<Text>No friends found.</Text>} // Hiển thị khi mảng rỗng
                />
            </View>
            <View style={styles.fFooter}>
                <TouchableOpacity style={styles.btnTags}>
                    <Image
                        source={require('../icons/mess.png')}
                        style={styles.iconfooter}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnTags}>
                    <Image
                        source={require('../icons/searchicon.png')}
                        style={styles.iconfooter}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnTags}>
                    <Image
                        source={require('../icons/Home.png')}
                        style={styles.iconfooter}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnTag}>
                    <Image
                        source={require('../icons/calen.png')}
                        style={styles.iconfooter}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.avatarFooter}>
                    <View style={styles.fImaFooter}>
                        <Image
                            source={require('../Images/nike.png')}
                            style={styles.imgAva}
                        />
                    </View>
                </TouchableOpacity>
            </View>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
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
        width: '90%',
        height: 35,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    fFriendList: {
        width: 100,
        height: '100%',
        backgroundColor: '#086DC0',
        borderRadius: 16.5,
        justifyContent: 'space-around',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
    },
    icons: {
        width: 14,
        height: 14,
    },
    txtfriendlist: {
        fontSize: 13,
        color: 'white',
        fontWeight: 'bold',
    },
    fRequest: {
        width: 150,
        height: '100%',
        backgroundColor: 'white',
        borderRadius: 16.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: 5,
    },
    txtRequest: {
        fontSize: 13,
        color: '#086DC0',
        fontWeight: 'bold',
    },
    fContact: {
        width: 94,
        height: '100%',
        backgroundColor: 'white',
        borderRadius: 16.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: 5,
    },
    btnAdd: {
        width: 33,
        height: 33,
        backgroundColor: 'white',
        borderRadius: '50%',
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconAdd: {
        width: 16,
        height: 16,
    },
    fListFriend: {
        position: 'absolute',
        width: '100%',
        height: '80%',
        padding: 5,
    },
    fMessage: {
        width: '100%',
        height: 65,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
        borderBottomWidth: 1,
        borderColor: 'white'

    },
    avatar: {
        width: 65,
        height: 60,
        borderRadius: 100,
        marginRight: 0,
    },
    avatarCl: {
        position: 'absolute',
        width: 65,
        height: 60,
        borderRadius: 100,
        marginRight: 0,
        left: 0
    },
    fInfor: {
        width: '90%',
        height: '100%',
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    email: {
        fontSize: 13,
        fontWeight: 400,
    },
    fbtn: {
        display: 'flex',
        position: 'absolute',
        width: 150,
        height: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        right: 5,
    },
    btnAccept: {
        display: 'flex',
        width: 70,
        height: '100%',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CBB17',
    },
    txtAccecpt: {
        fontSize: 11,
        fontWeight: 500,
        color: 'white'
    },
    btnTC: {
        display: 'flex',
        width: 70,
        height: '100%',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'red'

    },
    txtTC: {
        fontSize: 11,
        fontWeight: 500,
        color: 'white'
    },
    fFooter: {
        position: 'absolute',
        width: 386,
        height: 54,
        bottom: 10,
        backgroundColor: 'white',
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    btnTag: {
        width: 66,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
        backgroundColor: '#086DC0',
    },
    btnTags: {
        width: 66,
        height: 45,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconfooter: {
        width: 25,
        height: 25,
    },
    avatarFooter: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '50%',
    },
    imgAva: {
        display: 'flex',
        width: '100%',
        height: '100%',
    },
    fImaFooter: {
        display: 'flex',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
    },

    avatarText: {
        fontSize: 25,
        fontWeight: 'bold',
        color: 'white',
    },
});
