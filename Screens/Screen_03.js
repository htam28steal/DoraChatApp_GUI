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

const Screen_03 = () => {
    const [text, setText] = useState('');

    return (
        <View style={styles.container}>
            <View style={styles.fbg}>
                <Image
                    source={require('../Images/bground.png')}
                    style={styles.bg}></Image>
            </View>
            <View style={styles.fLogo}>
                <Image
                    source={require('../Images/logoDoRa.png')}
                    style={styles.imgLogo}></Image>

                <Text style={styles.txtLogo}>Everywhere you want to be</Text>
            </View>

            <View style={styles.fInfor}>
                <Text style={styles.txtTitle}>Thông Tin Cá Nhân</Text>

                <View style={styles.fDetailInfor}>
                    <View style={styles.fRow}>
                        <View style={styles.fHalfRow}>
                            <View style={styles.fPro}>
                                <Text style={styles.txtPro}>First Name</Text>
                                <Text style={styles.txtWar}>(*)</Text>
                            </View>
                            <View style={styles.fTxtInput}>
                                <TextInput
                                    style={styles.txtInput}
                                    placeholder="First Name"
                                    placeholderTextColor="#ABD9FF"></TextInput>
                            </View>
                        </View>
                        <View style={styles.fHalfRow}>
                            <View style={styles.fPro}>
                                <Text style={styles.txtPro}>Last Name</Text>
                                <Text style={styles.txtWar}>(*)</Text>
                            </View>
                            <View style={styles.fTxtInput}>
                                <TextInput
                                    style={styles.txtInput}
                                    placeholder="Last Name"
                                    placeholderTextColor="#ABD9FF"></TextInput>
                            </View>
                        </View>
                    </View>

                    <View style={styles.fRow}>
                        <View style={styles.fPro}>
                            <Text style={styles.txtPro}>User Name</Text>
                            <Text style={styles.txtWar}>(*)</Text>
                        </View>

                        <View style={styles.fTxtInput}>
                            <TextInput
                                style={styles.txtInput}
                                placeholder="User Name"
                                placeholderTextColor="#ABD9FF"></TextInput>
                        </View>
                    </View>

                    <View style={styles.fRow}>
                        <View style={styles.fHalfRow}>
                            <View style={styles.fPro}>
                                <Text style={styles.txtPro}>Age</Text>
                                <Text style={styles.txtWar}>(*)</Text>
                            </View>
                            <View style={styles.fTxtInput}>
                                <TextInput
                                    style={styles.txtInput}
                                    placeholder="Age"
                                    placeholderTextColor="#ABD9FF"></TextInput>
                            </View>
                        </View>
                        <View style={styles.fHalfRow}>
                            <View style={styles.fPro}>
                                <Text style={styles.txtPro}>Gender</Text>
                                <Text style={styles.txtWar}>(*)</Text>
                            </View>
                            <View style={styles.fTxtInput}>
                                <TextInput
                                    style={styles.txtInput}
                                    placeholder="Gender"
                                    placeholderTextColor="#ABD9FF"></TextInput>
                            </View>
                        </View>
                    </View>

                    <View style={styles.fRow}>
                        <View style={styles.fPro}>
                            <Text style={styles.txtPro}>Password</Text>
                            <Text style={styles.txtWar}>(*)</Text>
                        </View>

                        <View style={styles.fTxtInput}>
                            <TextInput
                                style={styles.txtInput}
                                placeholder="Password"
                                placeholderTextColor="#ABD9FF"></TextInput>
                        </View>
                    </View>
                    <View style={styles.fRow}>
                        <View style={styles.fPro}>
                            <Text style={styles.txtPro}>Confirm Password</Text>
                            <Text style={styles.txtWar}>(*)</Text>
                        </View>

                        <View style={styles.fTxtInput}>
                            <TextInput
                                style={styles.txtInput}
                                placeholder="Confirm Password"
                                placeholderTextColor="#ABD9FF"></TextInput>
                        </View>
                    </View>

                    <View style={styles.fRowBtn}>
                        <TouchableOpacity style={styles.btnNext}>
                            <Image
                                source={require('../icons/next.png')}
                                style={styles.icon}></Image>
                            <Text style={styles.txtNext}>NEXT</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

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
    fLogo: {
        position: 'absolute',
        top: 200,
        width: 240,
        height: 85,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    imgLogo: {
        width: '100%',
        height: 60,
    },
    txtLogo: {
        color: '#FFBD59',
        fontSize: 14,
        fontWeight: 'bold',
    },
    fInfor: {
        position: 'absolute',
        width: '100%',
        height: 470,
        bottom: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        alignItems: 'center',
    },
    txtTitle: {
        color: '#086DC0',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
    },
    fDetailInfor: {
        width: 365,
        height: 345,
        marginTop: 20,
        gap: 5,
    },
    fRow: {
        width: '100%',
        height: 60,
        justifyContent: 'space-between',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    fHalfRow: {
        width: '49%',
        height: '100%',
        justifyContent: 'space-between',
    },
    fPro: {
        width: '100%',
        height: 15,
        flexDirection: 'row',
        marginLeft: 10,
    },
    txtPro: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    txtWar: {
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 10,
        color: 'red',
    },
    fTxtInput: {
        display: 'flex',
        width: '100%',
        height: 35,
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 30,
        marginTop: 10,
    },
    txtInput: {
        width: '100%',
        fontSize: 13,
        height: 50,
        marginLeft: 5,
    },
    btnNext: {
        alignSelf: 'center',
        width: 102,
        height: 36,
        backgroundColor: '#086DC0',
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fRowBtn: {
        width: '100%',
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        width: 18,
        height: 18,
    },
    txtNext: {
        fontSize: 15,
        fontWeight: 600,
        color: 'white',
        marginLeft: 5,
    },
});

export default Screen_03;
