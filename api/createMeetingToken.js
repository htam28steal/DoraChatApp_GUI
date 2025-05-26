import axios from "axios";

export const createMeetingToken = async (roomName, userName) => {
    const API_KEY = "ec7618fb636aa5237b6829d57477b8d72a41c9d4d371a853d3ef42ebca553643	";

    const response = await axios.post(
        "https://api.daily.co/v1/meeting-tokens",
        {
            properties: {
                room_name: roomName,
                user_name: userName,
            },
        },
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
            },
        }
    );

    return response.data.token;
};
