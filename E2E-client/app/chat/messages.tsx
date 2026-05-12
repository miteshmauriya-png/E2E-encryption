import React, { useState, useEffect } from 'react';
import axios from 'axios';

export interface Device {
  deviceId: string;
  deviceName: string;
  publicKey: string;
  lastActive: string;        // ISO date string
  _id?: string;
}

export interface User {
  _id: string;
  userName: string;
  email: string;
  devices: Device[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export default function SlackLikeUI() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User>();
  const [selectedChatRoomId, setSelectedChatRoomId] = useState(null);
  console.log("🚀 ~ SlackLikeUI ~ selectedChatRoomId:", selectedChatRoomId);
  const [message, setMessage] = useState('');
  const [messageListByUser, setMessageListByUser] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loggedinUser, setLoggedInUser] = useState<User | undefined>();
  console.log("🚀 ~ SlackLikeUI ~ loggedinUser:", loggedinUser)




  const decryptMessage = async (
    encryptedMessageBase64: string,
    privateKey: CryptoKey
  ): Promise<string|undefined> => {
    try {
      // Convert Base64 to ArrayBuffer
      const encryptedBuffer = base64ToArrayBuffer(encryptedMessageBase64);
      console.log("🚀 ~ decryptMessage ~ encryptedBuffer:", encryptedBuffer)
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
        },
        privateKey,
        encryptedBuffer
      );

      // Convert decrypted buffer back to string
      const decoder = new TextDecoder();
      const decryptedText = decoder.decode(decryptedBuffer);

      console.log("🚀 ~ decryptMessage ~ decryptedText:", decryptedText)
      return decryptedText;
    } catch (error) {
      console.error("Decryption failed:", error);
    }
  };

const fetchMessages = async () => {
  const rawPrivateKey = localStorage.getItem("privateKey");
  if (!rawPrivateKey || !selectedChatRoomId) {
    console.warn("Missing private key or chatRoomId");
    return;
  }

  let privateKey: CryptoKey;

  try {
    // Import Private Key
    const binaryKey = base64ToArrayBuffer(rawPrivateKey);
    privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"]
    );
  } catch (err) {
    console.error("Failed to import private key:", err);
    return;
  }

  try {
    setLoading(true);

    const res = await axios.post(
      'http://localhost:5000/api/messages/get-by-room',
      { chatRoom: selectedChatRoomId },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }
    );

    // Handle both possible response structures
    const messagesArray = res.data.messages || res.data.message || res.data || [];

    const decryptedMessages = await Promise.all(
      messagesArray.map(async (item: any) => {
        try {
          const decryptedContent = await decryptMessage(item.content, privateKey);

          return {
            ...item,
            decryptedContent,           // Add decrypted version
            originalContent: item.content // Keep original if needed
          };
        } catch (decryptErr) {
          console.error("Decryption failed for message:", item._id, decryptErr);
          return {
            ...item,
            decryptedContent: "[Unable to decrypt message]",
            originalContent: item.content
          };
        }
      })
    );

    setMessageListByUser(decryptedMessages);

  } catch (err) {
    console.error("Failed to fetch messages:", err);
    setMessageListByUser([]);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchMessages();
  }, [selectedChatRoomId]);


  useEffect(() => {
const fetchUsers = async () => {
  try {
    setLoading(true);

    const res = await axios.get('http://localhost:5000/api/auth/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    console.debug("🚀 ~ fetchUsers ~ loggedinUser:", loggedinUser);
    console.debug("🚀 ~ fetchUsers ~ res.data:", res.data);

    // Parse loggedinUser safely (in case it's stored as string)
    let currentUserId: string | null = null;

    if (typeof loggedinUser === 'string') {
      try {
        const parsed = JSON.parse(loggedinUser);
        currentUserId = parsed?._id;
      } catch (e) {
        currentUserId = loggedinUser; // fallback
      }
    } else {
      currentUserId = loggedinUser?._id;
    }

    const usersToSetnotMe = res.data?.filter((item: User) => {
      if (!item?._id || !currentUserId) return true;
      return item._id.toString() !== currentUserId.toString();
    }) || [];

    setUsers(usersToSetnotMe);

  } catch (err) {
    console.error("Failed to fetch users:", err);
    setUsers([]);
  } finally {
    setLoading(false);
  }
};
    fetchUsers();
    fetchMessages();
    const user = localStorage.getItem("user");
    console.log("🚀 ~ SlackLikeUI ~ user:", user)
    if (user!==undefined) {
      setLoggedInUser(JSON.parse(user));
    }

  }, []);



  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    setLoading(true);

    try {
      const payload = {
        type: 'private',
        Participants: [user._id, loggedinUser?._id],           // Other user's ID
      };

      const res = await axios.post(
        'http://localhost:5000/api/messages/get-or-create',
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );
      console.log("🚀 ~ handleSelectUser ~ res:", res.data.room);

      setSelectedChatRoomId(res.data.room?._id);
      console.log("ChatRoom:", res.data);
fetchMessages()
    } catch (error) {
      console.error("Failed to get/create chat room:", error);
    } finally {
      setLoading(false);
    }

  };


  function base64ToArrayBuffer(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };


  const importPublicKey = async (publicKeyBase64: string) => {
    try {


      const publicKeyArrayBuffer = base64ToArrayBuffer(publicKeyBase64);
      return await window.crypto.subtle.importKey(
        "spki",
        publicKeyArrayBuffer,
        { name: "RSA-OAEP", hash: "SHA-256", },
        true,
        ["encrypt"]
      );
    } catch (error) {
      console.error("Failed to import public key:", error);
    }
  };


  const handleSubmitMessage = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    let message = e.target.value;
    let receiversPublicKey;
    let encryptedMessage: ArrayBuffer | undefined = undefined;
    let encryptedMessageBase64: string = "";
    if (!message || !selectedUser || !selectedChatRoomId) {
      return;
    }

    let enc = new TextEncoder();
    let encodedMessage = enc.encode(message);

    if (selectedUser) {
      receiversPublicKey = await importPublicKey(selectedUser.devices[0].publicKey);
    }


    console.log("🚀 ~ handleSubmitMessage ~ receiversPublicKey:", receiversPublicKey);

    console.log("🚀 ~ handleSubmitMessage ~ encodedMessage:", encodedMessage);
    if (receiversPublicKey) {
      encryptedMessage = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        receiversPublicKey,
        encodedMessage,
      );
    }
    setLoading(true);
    if (encryptedMessage) {
      encryptedMessageBase64 = arrayBufferToBase64(encryptedMessage);
      console.log("🚀 ~ handleSubmitMessage ~ encryptedMessage:", encryptedMessageBase64);
    }
    if (encryptedMessageBase64 === "") {
      return;
    }
    try {
      const payload = {
        chatRoom: selectedChatRoomId,
        sender: selectedUser._id,
        content: encryptedMessageBase64,
        messageType: 'text',
      };

      const res = await axios.post(
        'http://localhost:5000/api/messages',
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Message sent successfully:', res.data);

      // Clear input
      setMessage('');


    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {

      fetchMessages();
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">

      {/* Sidebar - Carbon Style */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
<div className="px-5 py-4 border-b border-gray-200 bg-white flex items-center gap-3">
  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-200">
    <img 
      src="https://i.pravatar.cc/150?u=loggedinuser" 
      alt="Profile" 
      className="w-full h-full object-cover"
    />
  </div>

  <div className="flex-1 min-w-0">
    <h2 className="text-lg font-semibold text-gray-900 truncate">
      {loggedinUser?.userName}
    </h2>
    <p className="text-sm text-gray-500 truncate">
      {loggedinUser?.email}
    </p>
  </div>

  <div className="text-green-500">
    ●
  </div>
</div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-gray-100 border border-gray-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600 px-4 py-2.5 text-sm outline-none"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No users found</div>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                onClick={() => handleSelectUser(user)}
                className={`mx-2 my-1 px-4 py-3 flex items-center gap-3 rounded hover:bg-gray-100 cursor-pointer transition-colors
                  ${selectedUser?._id === user._id ? 'bg-blue-50 border border-blue-200' : ''}`}
              >
                <div className="w-10 h-10 bg-gray-800 text-white rounded flex items-center justify-center font-medium flex-shrink-0">
                  {user.userName?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{user.userName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-200 bg-white px-6 flex items-center">
          {selectedUser ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-800 text-white rounded flex items-center justify-center font-medium">
                {selectedUser.userName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedUser.userName}</p>
                <p className="text-xs text-green-600">● Online</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Select a user to start messaging</p>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f4f4f4] space-y-6">
          {selectedUser ? (
            messageListByUser?.map((msg) => (
              <div key={msg?._id} className="flex gap-4">
                <div className="w-8 h-8 bg-gray-700 text-white text-sm rounded flex items-center justify-center flex-shrink-0 mt-1">
                  {msg?.sender?.userName[0] }
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900">{msg?.sender?.userName}</span>
                    <span className="text-xs text-gray-500">{msg?.createdAt}</span>
                  </div>
                  <div className="mt-1 text-[15px]  w-full leading-relaxed text-gray-800 bg-white border border-gray-200 rounded px-4 py-3 inline-block">
                    {msg?.decryptedContent}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select a conversation from the sidebar
            </div>
          )}
        </div>

        {/* Message Input - Carbon Style */}
        {selectedUser && (
          <div className="border-t border-gray-200 bg-white p-4">
            <form onSubmit={handleSubmitMessage}>
              <div className="bg-gray-100 border border-gray-300 focus-within:border-blue-600 rounded transition-all">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Message ${selectedUser.userName}...`}
                  className="w-full bg-transparent px-5 py-4 outline-none resize-y min-h-[52px] max-h-52 text-[15px]"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitMessage(e);
                    }
                  }}
                />
                <div className="flex justify-end px-4 py-3 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded text-sm font-medium transition-colors"

                  >
                    Send
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}