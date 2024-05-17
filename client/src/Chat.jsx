import { useEffect, useState, useContext, useRef } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext.jsx";
import {uniqBy} from "lodash";
import axios from "axios";
import Contact from "./Contact";


export default function Chat(){
    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [offlinePeople, setOfflinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessageText, setNewMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const {username, id,setId, setUsername} = useContext(UserContext);
    const divUnderMessages = useRef();
    useEffect(() =>{
      connectToWs();
    },[selectedUserId]);   //blank in square brace
   // const wsRef = useRef(null);
    function connectToWs()
     {
      const ws = new WebSocket('ws://localhost:4000');
 //     wsRef.current = ws;
      setWs(ws);
      ws.addEventListener('message',handleMessage );
//Added for improvements...
      ws.addEventListener('close', () =>{
         setTimeout(() => {
            console.log('Disconnected. Trying to reconnect.');
           connectToWs();
        }, 1000);
      });
     }
       
   
    function showOnlinePeople(peopleArray)
      {
         const people = {};
         peopleArray.forEach(({userId, username}) =>{
           people[userId] = username;
         });
         setOnlinePeople(people);
      }
    function handleMessage(ev){
        const messageData = JSON.parse(ev.data);
        console.log({ev, messageData}); 
        if('online' in messageData)
         {
            showOnlinePeople(messageData.online);
         }
      else if('text' in messageData){
        if(messageData.sender === selectedUserId)
         {
         setMessages(prev => ([...prev, {...messageData}]));
        }
      }
    }

function logout(){
   axios.post('/logout').then(() =>{
    setWs(null);
      setId(null);
      setUsername(null);
   });
}
function sendMessage(ev, file = null)
      {
        if(ev)
        ev.preventDefault();
        ws.send(JSON.stringify({
            recipient:selectedUserId,
            text:newMessageText,
            file,
        }));
      
        if(file)
         {
          axios.get('/messages/'+selectedUserId).then(res =>
            {
               setMessages(res.data);
            });
         }
        else{
          setNewMessageText('');
          setMessages(prev => ([...prev, {
            text: newMessageText,
            sender:id,
            recipient: selectedUserId,
            _id:Date.now(),
            }]));
        }
  }   


function sendFile(ev)
 {
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = () => {
      sendMessage(null, {
        name:ev.target.files[0].name,
        data: reader.result,
      });
    }
 }
  useEffect(() =>  {
     const div = divUnderMessages.current;
     if(div){
      div.scrollIntoView({behavior:'smooth', block:'end'});
     }
  }, [messages]);


useEffect(() =>{
  axios.get('/people').then(res =>{
    const offlinePeopleArr = res.data.filter(p => p._id !== id).
    filter(p => !Object.keys(onlinePeople).includes(p._id));
    const offlinePeople = {};
    offlinePeopleArr.forEach(p => {
      offlinePeople[p._id] = p;
    });

   setOfflinePeople(offlinePeople);
  });
}, [onlinePeople]);


  useEffect(() =>{
    if(selectedUserId)
     {
        axios.get('/messages/'+selectedUserId).then(res =>{
          setMessages(res.data);
        })
     }
  }, [setSelectedUserId]);
  
    const onlinePeopleExclOurUser = {...onlinePeople};
    delete onlinePeopleExclOurUser[id]

  const messagesWithoutDupes = uniqBy(messages, '_id');

return(
     <div className="flex h-screen">
      
        <div className="bg-white w-1/3 pl-4 pt-4 flex flex-col">
        <div className="flex-grow"> 
        <Logo/>
   {/* For online People */}
            {Object.keys(onlinePeopleExclOurUser).map(userId =>(
                <Contact 
                  key ={userId}
                  id={userId}
                  online={true}
                  username={onlinePeopleExclOurUser[userId]} 
                   onClick = { () =>{setSelectedUserId(userId);console.log({userId})}}
                   //setSelectedUserId(userId)}
                  selected = {userId === selectedUserId} />
            ))} 
            {/* For offline People */}
             {Object.keys(offlinePeople).map(userId =>(
                <Contact 
                  key={userId}
                  id={userId}
                  online={false}
                  username={offlinePeople[userId].username} 
                  onClick = { () => setSelectedUserId(userId)}
                  selected = {userId === selectedUserId} />
            ))} 
         </div>
         
         <div className="p-2 text-center flex items-center justify-center">
          <span className="mr-2 text-sm text-gray-600 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
            {username}
          </span>
          <button 
          onClick={logout}
          className="text-sm bg-blue-600 p-1 px-2 text-gray-200 border rounded-sm ">LogOut</button>
         </div>

        </div>
        <div className="flex flex-col bg-blue-50 w-2/3 p-2">
            <div className="flex-grow">
                {!selectedUserId && (
                  <div className="flex h-full flex-grow items-center justify-center">
                    <div className="text-gray-400">
                       &larr; Selected a person
                    </div>
               </div>
                )}
{!!selectedUserId && (
  <div className="relative h-full ">
  <div  className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
     {messagesWithoutDupes.map(message =>(
      <div key={message._id} className={(message.sender === id ? 
      'text-right' : 'text-left')}>
      <div className={"text-left inline-block p-2 my-2 rounded-md text-sm " + (message.sender === id ? 'bg-blue-500 text-white':'bg-white text-gray-500')}> 
        {message.text}
         {message.file && (
          <div className="">              
             <a target="_blank" className="flex items-center gap-1 border-b " href={axios.defaults.baseURL + '/uploads/' + message.file}>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                      </svg>
               {message.file}
             </a>
              </div>
         )}
         </div>
        </div>
     ))}
     <div ref={divUnderMessages}></div>
  </div>
  </div>
)}

            </div>
           {!!setSelectedUserId && (
           <form className="flex gap-2" 
            onSubmit={sendMessage}>
                <input type="text"
                value={newMessageText}
                onChange={ev =>setNewMessageText(ev.target.value)} 
                placeholder="Type your message here..." 
                className="bg-white flex-grow border rounded-sm p-2" />
                <label type="button" className="bg-gray-200 p-2 text-gray-600 rounded-sm border border-blue-300">
                  <input type="file" className="hidden" onChange={sendFile}/>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                      </svg>
  
                </label>
                <button type="submit" className="bg-blue-500 p-2 text-white rounded-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
            </form>)}         
        </div>
     </div>
   );
}