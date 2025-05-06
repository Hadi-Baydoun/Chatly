import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [],
  searchedUsers: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSearchLoading: false,

  // Get users with existing conversations
  getConversationUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/auth/conversations");
      set({ conversations: res.data.conversations || [] });
    } catch (error) {
      console.error("Conversations error:", error);
      toast.error("Failed to load conversations");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Search users by email
  searchUsers: async (email) => {
    if (!email) return;
    set({ isSearchLoading: true });
    try {
      const res = await axiosInstance.get(`/auth/search?email=${email}`);
      set({ searchedUsers: res.data });
    } catch (error) {
      toast.error("User not found", error);
    } finally {
      set({ isSearchLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      // Create a temporary message to show instantly
      const tempMessage = {
        _id: Date.now().toString(), // Temporary ID
        senderId: useAuthStore.getState().authUser._id,
        receiverId: selectedUser._id,
        text: messageData.text || "",
        image: messageData.image || null,
        createdAt: new Date().toISOString(),
        temp: true, // Mark as temporary
      };

      // Optimistically update UI
      set({ messages: [...messages, tempMessage] });

      // Send to server
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      // Replace temp message with actual message from server
      set((state) => ({
        messages: state.messages.map((msg) => (msg.temp ? res.data : msg)),
      }));

      // Update last message in conversations if needed
      set((state) => ({
        conversations: state.conversations.map((user) =>
          user._id === selectedUser._id
            ? { ...user, lastMessage: res.data }
            : user
        ),
      }));
    } catch (error) {
      // Remove temporary message on error
      set((state) => ({
        messages: state.messages.filter((msg) => !msg.temp),
      }));
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    const authUser = useAuthStore.getState().authUser;
    if (!selectedUser || !authUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const messageHandler = (newMessage) => {
      // Only add if:
      // 1. Message is from selected user to me, OR
      // 2. Message is from me to selected user
      if (
        (newMessage.senderId === selectedUser._id &&
          newMessage.receiverId === authUser._id) ||
        (newMessage.senderId === authUser._id &&
          newMessage.receiverId === selectedUser._id)
      ) {
        set((state) => ({
          messages: [...state.messages.filter((msg) => !msg.temp), newMessage],
        }));
      }
    };

    socket.on("newMessage", messageHandler);

    return () => {
      socket.off("newMessage", messageHandler);
    };
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  // Clear search results
  clearSearch: () => set({ searchedUsers: [] }),
}));
