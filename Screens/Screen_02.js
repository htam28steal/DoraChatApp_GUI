import React, { useState } from 'react';
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

export default function Screen_02({ navigation }) {
    const [text, setText] = useState('');
    return (
        <View style={styles.container}>
            <View style={styles.fbg}>
                <Image
                    source={require('../Images/bground.png')}
                    style={styles.bg}></Image>
            </View>

            <View style={styles.fcontent}>
                <View style={styles.fcontrol}>
                    <Image
                        source={require('../icons/searchicon.png')}
                        style={styles.icons}></Image>
                    <View style={styles.fTxtSearch}>
                        <TextInput
                            style={styles.txtSearch}
                            placeholder="Search"
                            placeholderTextColor="#aaa"
                            onChangeText={(value) => setText(value)}
                            value={text}
                        />
                    </View>
                </View>
                <TouchableOpacity style={styles.btnAdd}>
                    <View>
                        <Image
                            source={require('../icons/plus.png')}
                            style={styles.iconAdd}></Image>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.fFillter}>
                <TouchableOpacity style={styles.btnFillter}>
                    {' '}
                    <Text style={styles.txtFillter}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnFillter}>
                    {' '}
                    <Text style={styles.txtFillter}>Unread</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnFillter}>
                    {' '}
                    <Text style={styles.txtFillter}>Favourite</Text>
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
                <View style={styles.fMessage}>
                    <View style={styles.favatarGroup}>
                        <View style={styles.fRowOne}>
                            <View style={styles.favatarG}>
                                <Image
                                    source={require('../Images/nike.png')}
                                    style={styles.imgAG}></Image>
                            </View>
                            <View style={styles.favatarG}>
                                <Image
                                    source={require('../Images/nike.png')}
                                    style={styles.imgAG}></Image>
                            </View>
                        </View>
                        <View style={styles.fRowTwo}>
                            <View style={styles.favatarG}>
                                <Image
                                    source={require('../Images/nike.png')}
                                    style={styles.imgAG}></Image>
                            </View>
                        </View>
                    </View>
                    <View style={styles.fInfor}>
                        <Text style={styles.name}>Our group 01</Text>
                        <Text style={styles.email}>Iris: Who the F*** are u?</Text>
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
                <TouchableOpacity
                    style={styles.avatarFooter}
                    onPress={() => navigation.navigate('Screen_04')}>
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
        top: 10,
        justifyContent: 'space-between',
    },
    fcontrol: {
        width: 340,
        height: 40,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 30,
    },
    icons: {
        width: 18,
        height: 18,
    },
    btnAdd: {
        width: 40,
        height: 40,
        backgroundColor: '#4F9DDD',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    iconAdd: {
        width: 16,
        height: 16,
    },
    fFillter: {
        position: 'absolute',
        width: '70%',
        height: 30,
        top: 70,
        left: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    fListFriend: {
        position: 'absolute',
        width: '100%',
        height: '75%',
        padding: 5,
        top: 110,
        rowGap: 10,
    },
    fMessage: {
        width: '100%',
        height: 65,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomColor: 'white',
        borderBottomWidth: 1,
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
        fontWeight: '400',
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
        borderRadius: 20,
        borderRadius: 100,
    },
    imgAva: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
    },
    fImaFooter: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    fTxtSearch: {
        width: '85%',
        height: '100%',
        justifyContent: 'center',
    },
    txtSearch: {
        height: 50,
    },
    btnFillter: {
        width: 85,
        height: 30,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFEED4',
    },
    txtFillter: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F49300',
    },
    favatarGroup: {
        width: 65,
        height: 60,
        justifyContent: 'center',
    },
    fRowOne: {
        flexDirection: 'row',
        width: '100%',
        height: 25,
        justifyContent: 'space-around',
    },
    fRowTwo: {
        width: '100%',
        height: 25,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    favatarG: {
        width: 25,
        height: 25,
        borderRadius: 12.5,
    },
    imgAG: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
    },
});
