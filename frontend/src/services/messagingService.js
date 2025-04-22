import authService from './authService';

const API_URL = 'http://127.0.0.1:8000';

class WebSocketService {
  constructor() {
    this.chatSocket = null;
    this.chatListSocket = null;
    this.callbacks = {
      message: () => {},
      typing: () => {},
      readReceipt: () => {},
      editMessage: () => {},
      reaction: () => {},
      removeReaction: () => {},
      userStatus: () => {},
      chatList: () => {},
    };
  }

  connectToChatList() {
    const token = authService.getToken();
    if (!token) return;

    // Pass token as a query parameter for authentication
    this.chatListSocket = new WebSocket(`ws://127.0.0.1:8000/ws/chat-list/?token=${token}`);
    
    this.chatListSocket.onopen = () => {
      console.log('Chat list socket connected');
    };
    
    this.chatListSocket.onclose = (event) => {
      console.log('Chat list socket disconnected', event.code, event.reason);
      // Attempt to reconnect after a delay if not intentionally closed
      if (event.code !== 1000) {
        setTimeout(() => this.connectToChatList(), 3000);
      }
    };

    this.chatListSocket.onerror = (error) => {
      console.error('Chat list socket error:', error);
    };

    this.chatListSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_list') {
          this.callbacks.chatList(data.conversations);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  connectToChat(conversationId) {
    const token = authService.getToken();
    if (!token || !conversationId) return;

    // Close previous connection if exists
    if (this.chatSocket) {
      this.chatSocket.close();
    }

    // Pass token as a query parameter for authentication
    this.chatSocket = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${conversationId}/?token=${token}`);
    
    this.chatSocket.onopen = () => {
      console.log(`Connected to conversation ${conversationId}`);
    };

    this.chatSocket.onclose = (event) => {
      console.log(`Disconnected from conversation ${conversationId}`, event.code, event.reason);
      // Attempt to reconnect after a delay if not intentionally closed
      if (event.code !== 1000) {
        setTimeout(() => this.connectToChat(conversationId), 3000);
      }
    };

    this.chatSocket.onerror = (error) => {
      console.error(`Chat socket error for conversation ${conversationId}:`, error);
    };

    this.chatSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        switch (data.type) {
          case 'message':
            this.callbacks.message(data);
            break;
          case 'typing':
            this.callbacks.typing(data);
            break;
          case 'read_receipt':
            this.callbacks.readReceipt(data);
            break;
          case 'edit_message':
            this.callbacks.editMessage(data);
            break;
          case 'reaction':
            this.callbacks.reaction(data);
            break;
          case 'remove_reaction':
            this.callbacks.removeReaction(data);
            break;
          case 'user_status':
            this.callbacks.userStatus(data);
            break;
          default:
            console.log('Unknown message type:', data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  sendMessage(content, replyTo = null) {
    if (!this.chatSocket || this.chatSocket.readyState !== WebSocket.OPEN) {
      console.error('Chat socket is not connected');
      return;
    }
    
    const message = {
      type: 'message',
      content: content,
    };
    
    if (replyTo) {
      message.reply_to = replyTo;
    }
    
    this.chatSocket.send(JSON.stringify(message));
  }

  sendTypingIndicator(isTyping) {
    if (!this.chatSocket || this.chatSocket.readyState !== WebSocket.OPEN) {
      console.error('Chat socket is not connected');
      return;
    }
    
    this.chatSocket.send(JSON.stringify({
      type: 'typing',
      is_typing: isTyping,
    }));
  }

  sendReadReceipt(messageId) {
    if (!this.chatSocket || this.chatSocket.readyState !== WebSocket.OPEN) {
      console.error('Chat socket is not connected');
      return;
    }
    
    this.chatSocket.send(JSON.stringify({
      type: 'read_receipt',
      message_id: messageId,
    }));
  }

  editMessage(messageId, content) {
    if (!this.chatSocket || this.chatSocket.readyState !== WebSocket.OPEN) {
      console.error('Chat socket is not connected');
      return;
    }
    
    this.chatSocket.send(JSON.stringify({
      type: 'edit_message',
      message_id: messageId,
      content: content,
    }));
  }

  addReaction(messageId, reaction) {
    if (!this.chatSocket || this.chatSocket.readyState !== WebSocket.OPEN) {
      console.error('Chat socket is not connected');
      return;
    }
    
    this.chatSocket.send(JSON.stringify({
      type: 'reaction',
      message_id: messageId,
      reaction: reaction,
    }));
  }

  removeReaction(messageId) {
    if (!this.chatSocket || this.chatSocket.readyState !== WebSocket.OPEN) {
      console.error('Chat socket is not connected');
      return;
    }
    
    this.chatSocket.send(JSON.stringify({
      type: 'remove_reaction',
      message_id: messageId,
    }));
  }

  disconnect() {
    if (this.chatSocket) {
      this.chatSocket.close(1000, 'Intentional disconnect'); // Clean close
      this.chatSocket = null;
    }
    
    if (this.chatListSocket) {
      this.chatListSocket.close(1000, 'Intentional disconnect'); // Clean close
      this.chatListSocket = null;
    }
  }

  onMessage(callback) {
    this.callbacks.message = callback;
  }

  onTyping(callback) {
    this.callbacks.typing = callback;
  }

  onReadReceipt(callback) {
    this.callbacks.readReceipt = callback;
  }

  onEditMessage(callback) {
    this.callbacks.editMessage = callback;
  }

  onReaction(callback) {
    this.callbacks.reaction = callback;
  }

  onRemoveReaction(callback) {
    this.callbacks.removeReaction = callback;
  }

  onUserStatus(callback) {
    this.callbacks.userStatus = callback;
  }

  onChatList(callback) {
    this.callbacks.chatList = callback;
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

const messagingService = {
  // WebSocket instance
  webSocket: webSocketService,
  
  // REST API methods for conversations
  getConversations: async () => {
    try {
      await authService.refreshTokenIfNeeded();
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${API_URL}/api/v1/conversations/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },
  
  getConversation: async (id) => {
    try {
      await authService.refreshTokenIfNeeded();
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${API_URL}/api/v1/conversations/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching conversation ${id}:`, error);
      throw error;
    }
  },
  
  createConversation: async (participantsIds, initialMessage = null) => {
    try {
      await authService.refreshTokenIfNeeded();
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const payload = {
        participants_ids: participantsIds
      };
      
      if (initialMessage) {
        payload.initial_message = initialMessage;
      }
      
      const response = await fetch(`${API_URL}/api/v1/conversations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },
  
  getDirectChat: async (userId) => {
    try {
      await authService.refreshTokenIfNeeded();
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${API_URL}/api/v1/conversations/get_or_create_direct_chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get direct chat');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting direct chat:', error);
      throw error;
    }
  },
  
  // REST API methods for messages
  getMessages: async (conversationId, page = 1) => {
    try {
      await authService.refreshTokenIfNeeded();
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${API_URL}/api/v1/conversations/${conversationId}/messages/?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      throw error;
    }
  },
  
  // Connect to WebSockets
  connectToWebSockets: (conversationId = null) => {
    // Always connect to chat list
    webSocketService.connectToChatList();
    
    if (conversationId) {
      webSocketService.connectToChat(conversationId);
    }
  },
  
  disconnectWebSockets: () => {
    webSocketService.disconnect();
  }
};

export default messagingService;