import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const UserContext = createContext({});

export function UserContextProvider({children}){
    const [username, setUsername] = useState(null);
    const [id, setId] = useState(null);
    useEffect(() =>{
        axios.get('/profile',{baseURL:'http://localhost:4000'}).then(response =>{
            setId(response.data.userId);
            setUsername(response.data.username);
        }).catch(err=>{
           console.log(err);
        });
    }, []);
    return(
        <UserContext.Provider value={{username, setUsername, id, setId}}>
            {children}
        </UserContext.Provider>
    );
}
// , {withCredentials:true} in line 10