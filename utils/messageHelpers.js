/**
 * Replace a message in both messages and allMessages arrays,
 * based on a temporary _id (used in optimistic updates).
 */
export function replaceOptimisticMessage(tempId, realMessage, messages, allMessages) {
  const replaceInArray = (arr) =>
    arr.map((msg) => (msg._id === tempId ? realMessage : msg));

  return {
    messages: replaceInArray(messages),
    allMessages: replaceInArray(allMessages),
  };
}
