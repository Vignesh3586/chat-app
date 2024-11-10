
document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
  
    // Event listeners for the login page
    if (path === "/"|| path==="/login-page.html") {
      initializeLoginPageEvents();
    }
    
    if(path==="/create-room.html"){
      initializeCreateRoomEvents();
    }
    
    if(path==="/chat-box.html"){
      initializeChatBoxEvents()
    }
  }
 )
  
 

  
  // Function to initialize event listeners on the login page
  function initializeLoginPageEvents() {
    const userName = document.querySelector('#username');
    const joinRoom = document.querySelector('#login-btn');
    const createRoom = document.querySelector('#create-room-btn');
    let selectedOption = ""; // To store selected room

 // Initialize Socket.IO for login events

    const fetchRooms = async () => {
      try {
        const response = await fetch('/rooms');
        const rooms=await response.json();

        const selectRooms = document.querySelector(".roomname");
        selectRooms.innerHTML = ""; // Clear existing options

        if (rooms.length>0) {
          const select = document.createElement('select');
          select.classList.add('select-room');
          

          rooms.forEach((room) => {
            const option = document.createElement('option');
            option.value = room.id;
            option.innerText = room.roomName;
            select.appendChild(option);
          });

          select.addEventListener('change', () => {
            selectedOption = select.value;
          });

          selectRooms.appendChild(select);
        } else {
          selectRooms.innerText = "No Rooms Available";
        }
      } catch (err) {
        console.error(`Error:${err}`);
      }
    };

    fetchRooms();

    joinRoom.addEventListener('click', () => {
     const roomId= selectedOption;
     const userNameOfRoom = userName.value.trim();


      if (roomId &&  userNameOfRoom) {
        const roomData={
          roomid:roomId,
          userName:userNameOfRoom,
          option:"joinRoom"
        }
     
        localStorage.setItem("roomData",JSON.stringify(roomData))
        window.location.href = "chat-box.html";
      } else {
        alert("Please select a room and enter your username.");
      }
    });

    createRoom.addEventListener('click', () => {
        window.location.href = "create-room.html";
        initializeCreateRoomEvents()
    });
  }
  

  
  
  // Function to initialize event listeners on the create-room page
  function initializeCreateRoomEvents() {
    const saveBtn = document.querySelector('.save-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    
    saveBtn.addEventListener("click", () => {
      const createRoomName = document.querySelector('#createroomname').value.trim();
      const userName=document.querySelector("#username-room").value.trim()

      if (createRoomName && userName) {
        const roomData={
          roomName:createRoomName,
          userName:userName,
          option:"createRoom",
        }
        localStorage.setItem("roomData",JSON.stringify(roomData))
        window.location.href = "chat-box.html";
      } else {
        alert("Room name cannot be empty.");
      }
    });
  
    cancelBtn.addEventListener("click", () => {
      window.location.href = "login-page.html";
    });
  }

 // Function to initialize event listeners on the chat-box page
 function initializeChatBoxEvents() {
    const socket=io()
    const data=JSON.parse(localStorage.getItem('roomData'))
    if(data.option=="joinRoom"){
    socket.emit('joinRoom', { roomid:data.roomid,username:data.userName});
    }
    if(data.option=='createRoom'){
    socket.emit('createRoom', {room:data.roomName,username:data.userName});
    }

  const chatBox = document.querySelector('.chat-box');
  const chatForm = document.querySelector('#chat-form');
  const leaveBtn = document.querySelector("#leave-btn");
  const navBarBtn=document.querySelector('.nav-bar-btn')
  const navigationBar=document.querySelector('.nav-bar')
  const backToChat=document.querySelector('.back-btn')
  const listRoomName=document.querySelector('#list-room-name')
  const listUserNames=document.querySelector('#list-user-name')
   
  // Event listener for submitting messages
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = (e.target.elements[0].value).trim();
    if (!message) return false;
    if(socket){
      socket.emit("chatMessage", message);
    }
    e.target.elements[0].value= "";
    e.target.elements[0].focus();
  });

  navBarBtn.addEventListener("click",()=>{
    navigationBar.classList.add('with-nav')
    navigationBar.classList.remove('with-out-nav')
  })
  backToChat.addEventListener('click',()=>{
    navigationBar.classList.remove('with-nav')
    navigationBar.classList.add('with-out-nav') 
})

  // Event listener for leaving the room
  leaveBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to leave the room?")) {
      window.location.href = "login-page.html";
    }
  });
   
  const outputRoomName=(room)=>{
    listRoomName.innerText=room
  }
  const outputUsers=(users)=>{
    const existingUl = listUserNames.querySelector('ul');
    if (existingUl) {
      listUserNames.removeChild(existingUl);
    }  
    if(users.length>0){
      const ul=document.createElement('ul')
      ul.classList.add('list-users-ul')
      users.forEach(user=>{
        const li=document.createElement('li')
        li.classList.add('list-users-li')
        li.innerText=user.username
        ul.appendChild(li)
      })
      listUserNames.appendChild(ul)
    }else{
      listUserNames.innerText="No Users"
    }

  }
  
  if(socket){
    socket.on('roomUsers', ({ room, users }) => {
      outputRoomName(room);
      outputUsers(users);
    });

  }

  function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="description">${message.username}<span>${message.time}</span></p><p class="text">${message.text}</p>`;
    document.querySelector('.chat-box').appendChild(div);
  }
  // Socket listener for receiving messages
  if(socket){
    socket.on("message", (message) => {
      outputMessage(message);
      chatBox.scrollTop = chatBox.scrollHeight;
    });
  }

}
  

  