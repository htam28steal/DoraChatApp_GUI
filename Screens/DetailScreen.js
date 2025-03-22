import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView,FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


const dataProfile = [
  {
    avatar:require('../Images/avt.png'),
    name :'John Nguyen'
  }
]
const dataPic = [
  {
    url:require('../Images/pic1.png')
  },
  {
    url:require('../Images/pic1.png')
  },
  {
    url:require('../Images/pic1.png')
  },
  {
    url:require('../Images/pic1.png')
  },
  {
    url:require('../Images/pic1.png')
  }

]
const renderDetail = ({ item }) => {
  return(
    <View style={{width:'100%'}}>
    <View style={{justifyContent:'center', alignItems:'center', width:'100%'}}>
      <Image source={item.avatar} style={styles.avatar} />
      <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
      <Text style ={{marginRight:5, fontWeight:'bold',fontSize:15}}>{item.name}</Text>
      <TouchableOpacity><Image source={require('../icons/edit.png')}/></TouchableOpacity>
      </View>
    </View>
  </View>
  )
}

const renderPicture = ({ item }) => {
  return(
      <Image source = {item.url} style={{marginRight:10, marginBottom:10}} />
    
  )
}

const Detail = () => {
  return(
    <View style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity style={{position:'absolute', left:10}}><Image source={require('../icons/back.png')}  style={{width:25,height:20}} /></TouchableOpacity>
      <Text style={{color:'#086DC0', fontWeight:'bold', fontSize:15}}>Details</Text>
      <View style={{flexDirection:'row', position:'absolute', right:10}}>
      <TouchableOpacity
      style={{backgroundColor:'#D8EDFF',
        width:30,
        height:30,
        justifyContent:'center',
        alignItems:'center',
        borderRadius:15,
        marginRight:5}}><Image source={require('../icons/addFriend.png')} style={{width:14,height:14}}/></TouchableOpacity>
      <TouchableOpacity 
      style={{backgroundColor:'#086DC0',
        width:30,
        height:30,
        justifyContent:'center',
        alignItems:'center',
        borderRadius:15}}>
         <Image source={require('../icons/Pin.png')} /></TouchableOpacity>
      </View>

      </View>
      <View>
         <FlatList
          data={dataProfile}
          horizontal={false}
          numColumns={2}
          renderItem={renderDetail}
          keyExtractor={(item)=>(item.id)}
       
       />
      </View>

      <View style={{marginTop:30}}>
        <View style={styles.options}>
        <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}} >
          <View style={{width:30, height:30, alignItems:'center', backgroundColor:'#D8EDFF',
          borderRadius:15, justifyContent:'center', marginRight:10
          }}><Image source={require('../icons/Notification.png')} style={{alignSelf:'center'}} /></View>
          <Text style={{color:'#086DC0', fontSize:15}}>Mute messages</Text>
        </View>
        <TouchableOpacity 
          style={{width:40, backgroundColor:'#D8EDFF', height:20, borderRadius:10, position:'relative'}}>
          <View 
            style={{
              width: 16,
              height: 16,
              backgroundColor: '#086DC0',
              borderRadius: 10,
              position: 'absolute',
              right: 1,
              top: '50%',
              transform: [{ translateY: -8 }]  // Dịch lên trên 8 đơn vị để căn giữa
            }
          }>
          </View>
        </TouchableOpacity>
        </View>

        <View style={styles.options}>
        <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}} >
          <View style={{width:30, height:30, alignItems:'center', backgroundColor:'#D8EDFF',
          borderRadius:15, justifyContent:'center', marginRight:10
          }}><Image source={require('../icons/Star.png')} style={{alignSelf:'center'}} /></View>
          <Text style={{color:'#086DC0', fontSize:15}}>Mark as bestfriend</Text>
        </View>
        <TouchableOpacity 
          style={{width:40, backgroundColor:'#D8EDFF', height:20, borderRadius:10, position:'relative'}}>
          <View 
            style={{
              width: 16,
              height: 16,
              backgroundColor: '#086DC0',
              borderRadius: 10,
              position: 'absolute',
              right: 1,
              top: '50%',
              transform: [{ translateY: -8 }]  // Dịch lên trên 8 đơn vị để căn giữa
            }
          }>
          </View>
        </TouchableOpacity>
        </View>

        <View style={styles.options}>
        <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}} >
          <View style={{width:30, height:30, alignItems:'center', backgroundColor:'#D8EDFF',
          borderRadius:15, justifyContent:'center', marginRight:10
          }}><Image source={require('../icons/Photos.png')} style={{alignSelf:'center'}} /></View>
          <Text style={{color:'#086DC0', fontSize:15}}>Photos/Videos, Files, Links</Text>
        </View>
        <TouchableOpacity 
          style={{width:30, backgroundColor:'#D8EDFF', height:30, borderRadius:10, justifyContent:'center',alignItems:'center'}}>
          <Image source={require('../icons/arrow.png')} />
        </TouchableOpacity>
        </View>

    </View>

    <View style={{alignItems:'center'}}>
       <FlatList
          data={dataPic}
          horizontal={false}
          numColumns={3}
          renderItem={renderPicture}
          keyExtractor={(item)=>(item.id)}
       
       />

    </View>

      <TouchableOpacity style={{bottom:20, position:'absolute', alignItems:'center', width:'100%'}}>
        <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}} >
          <View style={{width:30, height:30, alignItems:'center', backgroundColor:'#D8EDFF',
          borderRadius:15, justifyContent:'center', marginRight:10
          }}><Image source={require('../icons/Trash.png')} style={{alignSelf:'center'}} /></View>
          <Text style={{color:'#086DC0', fontSize:15}}>Delete chat history</Text>
        </View>
      </TouchableOpacity>
    </View>

  )
}
const styles = StyleSheet.create({
  container:{
    width:'100%',
    height:'100%',
    backgroundColor:'#fff'
  },
  header:{
    justifyContent:'center',
    flexDirection:'row',
    top:40

  },
  avatar:{
    height:120,
    width:120,
    marginTop:60, 
    marginBottom:10
   },
   options:{
     width:'90%',
     flexDirection:'row',
     justifyContent:'space-between',
     alignItems:'center',
     paddingLeft:20,
     marginBottom:15
   }
})

export default Detail;