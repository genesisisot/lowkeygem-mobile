import { api } from '../lib/api'
import { realtime, type RealtimeChannel } from '../lib/realtime'
import type { Message, MessageWithSender, MessageType } from '../types/database'

export type { RealtimeChannel }

export const messagesService = {
  // Get messages for a match. Server filters by the requesting user's hidden flag
  // and identity (userId/userType kept for signature compatibility).
  async getByMatch(matchId: string, _userId: string, _userType: 'client' | 'freelancer', _signal?: AbortSignal) {
    return api.get<MessageWithSender[]>(`/api/matches/${matchId}/messages`)
  },

  async send(matchId: string, _senderId: string, content: string, type: MessageType = 'message') {
    return api.post<MessageWithSender>(`/api/matches/${matchId}/messages`, {
      content,
      message_type: type,
    })
  },

  async sendWithAttachment(
    matchId: string,
    _senderId: string,
    content: string,
    attachmentUrl: string,
    attachmentType: string
  ) {
    return api.post<MessageWithSender>(`/api/matches/${matchId}/messages`, {
      content,
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
    })
  },

  async sendSystemMessage(matchId: string, type: MessageType, content: string) {
    return api.post<Message>(`/api/matches/${matchId}/messages`, { content, message_type: type })
  },

  async markAsRead(matchId: string, _userId: string) {
    const { error } = await api.post(`/api/matches/${matchId}/messages/read`)
    return { error }
  },

  async getUnreadCountForUser(_userId: string) {
    const { data, error } = await api.get<{ count: number }>(`/api/messages/unread-count`)
    return { count: data?.count || 0, error }
  },

  async getLastMessage(matchId: string) {
    const { data, error } = await api.get<MessageWithSender[]>(`/api/matches/${matchId}/messages`)
    return { data: data && data.length ? data[data.length - 1] : null, error }
  },

  // Live messages over WebSocket.
  subscribeToMatch(matchId: string, callback: (message: MessageWithSender) => void): RealtimeChannel {
    return realtime.chat(matchId, (msg) => {
      if (msg.event === 'message') callback(msg.message as MessageWithSender)
    })
  },

  unsubscribe(channel: RealtimeChannel) {
    realtime.close(channel)
  },

  reconnectToMatch(
    oldChannel: RealtimeChannel | null,
    matchId: string,
    callback: (message: MessageWithSender) => void
  ): RealtimeChannel {
    if (oldChannel) this.unsubscribe(oldChannel)
    return this.subscribeToMatch(matchId, callback)
  },

  // New-message stream for global indicators: ride the user's notification channel.
  subscribeToUserMessages(_userId: string, callback: (message: Message) => void): RealtimeChannel {
    return realtime.notifications((msg) => {
      if (msg.event === 'notification' && msg.notification?.type === 'message') {
        callback({ match_id: msg.notification.data?.match_id } as Message)
      }
    })
  },

  async delete(messageId: string, _senderId: string) {
    const { error } = await api.del(`/api/messages/${messageId}`)
    return { error }
  },

  async hideMessagesForUser(matchId: string, _userType: 'client' | 'freelancer') {
    const { error } = await api.post(`/api/matches/${matchId}/messages/hide`)
    return { error }
  },

  async unhideMessagesForUser(matchId: string, _userType: 'client' | 'freelancer') {
    const { error } = await api.post(`/api/matches/${matchId}/messages/unhide`)
    return { error }
  },
}
