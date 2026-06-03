import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

export function hapticsLight() {
  if (!Capacitor.isNativePlatform()) return
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
}

export function hapticsMedium() {
  if (!Capacitor.isNativePlatform()) return
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {})
}

export function hapticsSuccess() {
  if (!Capacitor.isNativePlatform()) return
  Haptics.notification({ type: NotificationType.Success }).catch(() => {})
}
