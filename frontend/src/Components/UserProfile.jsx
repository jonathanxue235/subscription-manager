import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function UserProfilePage() {
    const [userId, setUserId] = useState("");
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async() => {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_data')
                .select('*')
                .single();

            if (error) {
                console.error("Error fetching user data: ", error);
                setUserData(null);
            } else {
                console.log("Data fetched for user: ", data.username);
                setUserData(data);
            } 
            setLoading(false);
        }
        
        fetchUser();
    }, []);
    
    return(
        <>
            <div>
                {loading ? (
                    <p>Loading</p>
                ) : (
                    <p>This is for user: {userData?.username}</p>
                )} 
            </div>
        </>
    );
}

export default UserProfilePage;