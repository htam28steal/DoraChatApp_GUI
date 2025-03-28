import React from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    Text,
    StatusBar,
    TextInput,
    TouchableOpacity,
    Image,
} from 'react-native';

export default function HomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <View style={styles.fbg}>
                <Image
                    source={require('../Images/bground.png')}
                    style={styles.bg}></Image>
            </View>

            <View style={styles.fcontent}>
                <View style={styles.fcontrol}>
                    <View style={styles.fFriendList}>
                        <Image
                            source={require('../icons/friend.png')}
                            style={styles.icons}></Image>
                        <Text style={styles.txtfriendlist}>Friend list</Text>
                    </View>

                    <View style={styles.fRequest}>
                        <Image
                            source={require('../icons/friendrequest.png')}
                            style={styles.icons}></Image>
                        <Text style={styles.txtRequest}>Friend request</Text>
                        <Text style={styles.txtRequest}>(1)</Text>
                    </View>

                    <View style={styles.fContact}>
                        <Image
                            source={require('../icons/contact.png')}
                            style={styles.icons}></Image>
                        <Text style={styles.txtRequest}>Contact</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.btnAdd}>
                    <View>
                        <Image
                            source={require('../icons/addFriend.png')}
                            style={styles.iconAdd}></Image>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.fListFriend}>
                <View style={styles.fMessage}>
                    <Image
                        source={require('../Images/nike.png')}
                        style={styles.avatar}></Image>
                    <View style={styles.fInfor}>
                        <Text style={styles.name}>John Nguyen</Text>
                        <Text style={styles.email}>johnNguyen@gmail.com</Text>

                        <View style={styles.fbtn}>
                            <TouchableOpacity style={styles.btnDetail}>
                                <Image
                                    source={require('../icons/detail.png')}
                                    style={styles.iconDetail}></Image>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.fFooter}>
                <TouchableOpacity style={styles.btnTags}>
                    <Image
                        source={require('../icons/mess.png')}
                        style={styles.iconfooter}></Image>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnTags}>
                    <Image
                        source={require('../icons/searchicon.png')}
                        style={styles.iconfooter}></Image>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnTags}>
                    <Image
                        source={require('../icons/Home.png')}
                        style={styles.iconfooter}></Image>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnTag}>
                    <Image
                        source={require('../icons/calen.png')}
                        style={styles.iconfooter}></Image>
                </TouchableOpacity>
                <TouchableOpacity style={styles.avatarFooter}>
                    <View style={styles.fImaFooter}>
                        <Image
                            source={require('../Images/nike.png')}
                            style={styles.imgAva}></Image>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
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
        borderWidth: 1,
    },
    fMessage: {
        width: '100%',
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    avatar: {
        width: 65,
        height: 60,
        borderRadius: 100,
    },
    fInfor: {
        width: '82%',
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
        position: 'absolute',
        width: 13,
        height: 30,
        justifyContent: 'center',
        right: 0,
        top: 5,
    },
    btnDetail: {
        display: 'flex',
        width: 13,
        height: '100%',
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
});
