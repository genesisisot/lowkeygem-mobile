import { api } from '../lib/api'
import { realtime, type RealtimeChannel } from '../lib/realtime'
import type { Notification, NotificationInsert } from '../types/database'

export type { RealtimeChannel }

export const notificationsService = {
  async getByUser(userId: string, limit = 50) {
    return api.get<Notification[]>(`/api/notifications?limit=${limit}`)
  },

  async getUnread(_userId: string) {
    return api.get<Notification[]>('/api/notifications/unread')
  },

  async getUnreadCount(_userId: string) {
    const { data, error } = await api.get<{ count: number }>('/api/notifications/unread-count')
    return { count: data?.count || 0, error }
  },

  async create(notification: NotificationInsert) {
    return api.post<Notification>('/api/notifications', notification)
  },

  async createMatchNotification(userId: string, matcherName: string, jobOrProfileTitle: string) {
    return this.create({
      user_id: userId,
      type: 'match',
      title: 'New Match!',
      message: `You matched with ${matcherName} for "${jobOrProfileTitle}"`,
      data: { matcherName, title: jobOrProfileTitle },
    })
  },

  async createMessageNotification(userId: string, senderName: string, preview: string) {
    return this.create({
      user_id: userId,
      type: 'message',
      title: 'New Message',
      message: `${senderName}: ${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}`,
      data: { senderName, preview },
    })
  },

  async createPaymentNotification(userId: string, amount: number, description: string) {
    return this.create({
      user_id: userId,
      type: 'payment',
      title: 'Payment Update',
      message: `${description} - ₦${amount.toLocaleString()}`,
      data: { amount, description },
    })
  },

  async createInterestNotification(
    userId: string,
    swipedByName: string,
    targetTitle: string,
    swipeType: 'job' | 'freelancer'
  ) {
    const message =
      swipeType === 'job'
        ? `${swipedByName} showed interest in your "${targetTitle}" job posting`
        : `${swipedByName} showed interest in you. Check your jobs to match!`
    return this.create({
      user_id: userId,
      type: 'interest',
      title: '💜 Someone Interested!',
      message,
      data: { swipedByName, targetTitle, swipeType },
    })
  },

  async markAsRead(notificationId: string) {
    const { error } = await api.post(`/api/notifications/${notificationId}/read`)
    return { error }
  },

  async markAllAsRead(_userId: string) {
    const { error } = await api.post('/api/notifications/read-all')
    return { error }
  },

  async delete(notificationId: string) {
    const { error } = await api.del(`/api/notifications/${notificationId}`)
    return { error }
  },

  async deleteAll(_userId: string) {
    const { error } = await api.del('/api/notifications')
    return { error }
  },

  // Live notifications over WebSocket.
  subscribeToNotifications(_userId: string, callback: (notification: Notification) => void): RealtimeChannel {
    return realtime.notifications((msg) => {
      if (msg.event === 'notification') callback(msg.notification as Notification)
    })
  },

  unsubscribe(channel: RealtimeChannel) {
    realtime.close(channel)
  },

  reconnect(
    oldChannel: RealtimeChannel | null,
    userId: string,
    callback: (notification: Notification) => void
  ): RealtimeChannel {
    if (oldChannel) this.unsubscribe(oldChannel)
    return this.subscribeToNotifications(userId, callback)
  },
}
