//  Variables
var myUser; //  peer object
var connection; //  connection to other user
var mediaConnection;
var otherUserId;

//  Ready function
$(document).ready(function(){
  myUser = new Peer({key: 'ee56xhnb894ibe29'});
  myUser.on('open', peerjsOpenHandler);
  myUser.on('close', peerjsCloseHandler);
  myUser.on('error', peerjsErrorHandler);
  myUser.on('connection', peerjsConnectionHandler);
  myUser.on('call', peerjsCallHandler);
  $('.webrtc-widget').draggable();
  $('.webrtc-widget').click(function() {
    $(this).addClass('active');
    $('.webrtc-widget').draggable('disable');
  })

  $('.close-btn').click(function(e) {
    console.log('click')
    e.stopPropagation();
    $('.webrtc-widget').removeClass('active');
    $('.webrtc-widget').draggable('enable');
  });

  $('.peer-id-copy').click(function() {
    window.clipboardData.setData('Text', $('#my-peer-id').html());
  });

  $('#chat-msg').keyup(function (e) {
    if (e.keyCode == 13) {
      send();
    }
  });
});



//  Peerjs handlers
function peerjsOpenHandler(){
  console.log("User started, id: "+myUser.id);
  $('#my-peer-id').text(myUser.id);
}
function peerjsCloseHandler(){
  console.log("User close");
}
function peerjsErrorHandler(err){
  console.log("User error, id: ", err);
}

//  Connected by other user
function peerjsConnectionHandler(conn){
  connection = conn;
  prepareConnection(connection);
}

//  Connected call by other user
function peerjsCallHandler(conn){
  mediaConnection = conn;
  prepareMediaConnection(mediaConnection);
  navigator.getMedia (
   // constraints
   {
      video: true,
      audio: true
   },

   // successCallback
   function(localMediaStream) {
      conn.answer(localMediaStream);
   },

   // errorCallback
   function(err) {
    console.log("The following error occured: " + err);
   }
  );
}

//  Connect to other user
function connect(id){
  otherUserId = id;
  connection = myUser.connect(otherUserId);
  prepareConnection(connection);

  navigator.getMedia ({
      video: true,
      audio: true
    }, function(localMediaStream) {
      // success callback
      mediaConnection = myUser.call(otherUserId, localMediaStream);
      prepareMediaConnection(mediaConnection);
      $('.webrtc-chat-container').removeClass('matchmake');
      $('.webrtc-chat-container').addClass('chatting');
      console.log("Connected successfully");
    }, function(err) {
      // errorCallback
      console.log("The following error occured: " + err);
    }
  );
}

//  Connection handlers
function openHandler(){
  console.log("Connection open with:", connection);
  addStarted();
}

function closeHandler(){
  console.log("Connection close with:", otherUserId);
}

function errorHandler(err){
  console.log("Connection error with:", otherUserId, err);
}

function closeMediaHandler(){
  console.log("Media Connection close with:", otherUserId);
}

function errorMediaHandler(err){
  console.log("Media Connection error with:", otherUserId, err);
}

function prepareConnection(connection){
  connection.on('open', openHandler);
  connection.on('data', dataHandler);
  connection.on('close', closeHandler);
  connection.on('error', errorHandler);
}

function prepareMediaConnection(mediaConnection){
  mediaConnection.on('stream', streamHandler);
  mediaConnection.on('close', closeMediaHandler);
  mediaConnection.on('error', errorMediaHandler);
}

function dataHandler(data){
  if (data.type == 'chat') {
    addChat(data);
  }
}

function streamHandler(stream){console.log(stream);
  addStream(stream);
}

//  UI
function start(){
  connect($('#other-peer-id').val());
}

function send(){
  sendChat($('#chat-msg').val());
}

function addStarted(){
  var element = document.createElement('div');
  element.innerHTML = 'Started chat with: <span class="sender">' + connection.peer + '</span>';
  $('#chats').append(element);
  $('#other-peer-id').val(connection.peer);
  $('.webrtc-chat-container').removeClass('matchmake');
  $('.webrtc-chat-container').addClass('chatting');
}

function addChat(msg){
  var element = document.createElement('div');
  element.innerHTML = '<span class="sender">' + msg.peerId + ':</span> ' + msg.message;
  $('#chats').append(element);
  $('#chats').animate({ scrollTop: 99999}, "slow");
}

function sendChat(message){
  var msg = {};
  msg.type = 'chat';
  msg.message = message;
  msg.peerId = myUser.id;
  connection.send(msg);
  addChat(msg);
  $('#chat-msg').val('');
}

function download(arrayBuffer, type, name){
  var blob = new Blob([arrayBuffer], {type: type});
  var download = document.createElement('a');
  download.href = URL.createObjectURL(blob);
  download.download = name;
  $('#limbo').append(download);
  download.click();
  $(download).remove();
}

function addStream(stream){
  $(".video-box")[0].src = URL.createObjectURL(stream);
}

// Webcam cross browser
navigator.getMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);