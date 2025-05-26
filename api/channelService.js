import api from "./apiConfig";

const channelService = {
    addChannel: async (name, conversationId, memberId) => {
        try {
            const res = await api.post(`/api/channels`, {
                conversationId: conversationId,
                memberId: memberId,
                name: name
            });
            return res.data;
        } catch (err) {
            console.log(`ERROR: `, err)
        }

    }
}
export default channelService;