import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ImageModal = ({ src, onClose }) => {
  const handleDownload = async () => {
    try {
      // Fetch the image with credentials if needed
      const response = await fetch(src, {
        credentials: "include", // Include cookies for authenticated requests
      });

      if (!response.ok) throw new Error("Failed to fetch image");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;

      // Extract filename from URL or use timestamp
      const filename =
        src.split("/").pop()?.split("?")[0] || `chat-image-${Date.now()}.jpg`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error("Download error:", error);
      // Fallback to regular download if fetch fails
      const fallbackLink = document.createElement("a");
      fallbackLink.href = src;
      fallbackLink.download = `chat-image-${Date.now()}.jpg`;
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-full max-h-full">
        <img
          src={src}
          alt="Full size preview"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Download
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [loadedMessages, setLoadedMessages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log("Current messages:", messages);
    console.log("Auth user ID:", authUser?._id);
    console.log("Selected user ID:", selectedUser?._id);
  }, [messages, authUser, selectedUser]);

  // Load messages when selected user changes
  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }

    const cleanup = subscribeToMessages();

    return () => {
      cleanup?.();
      unsubscribeFromMessages();
    };
  }, [
    selectedUser?._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  // Update local state when messages change
  useEffect(() => {
    if (messages && Array.isArray(messages)) {
      const sortedMessages = [...messages].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setLoadedMessages(sortedMessages);
    }
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loadedMessages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadedMessages.length > 0 ? (
          loadedMessages.map((message) => {
            const isMyMessage = message.senderId === authUser._id;
            const profilePic = isMyMessage
              ? authUser.profilePic || "/avatar.png"
              : selectedUser.profilePic || "/avatar.png";

            return (
              <div
                key={message._id || `temp-${message.tempId}`}
                className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}
              >
                <div className="chat-image avatar">
                  <div className="w-10 h-10 rounded-full border">
                    <img
                      src={profilePic}
                      alt="profile pic"
                      className="object-cover"
                      onError={(e) => {
                        e.target.src = "/avatar.png";
                      }}
                    />
                  </div>
                </div>
                <div className="chat-header mb-1">
                  <time className="text-xs opacity-50 ml-1">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
                <div
                  className={`chat-bubble ${
                    isMyMessage
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {message.image && (
                    <div
                      className="cursor-pointer"
                      onClick={() => setSelectedImage(message.image)}
                    >
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="sm:max-w-[200px] rounded-md mb-2 hover:opacity-90 transition-opacity"
                      />
                    </div>
                  )}
                  {message.text && <p>{message.text}</p>}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
      {selectedImage && (
        <ImageModal
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};

export default ChatContainer;
