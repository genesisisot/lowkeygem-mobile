import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar } from '@capacitor/status-bar'
import { Keyboard } from '@capacitor/keyboard'
import { App } from '@capacitor/app'

/**
 * Initializes Capacitor native plugins on mount.
 * Safe no-op in browser – only activates inside iOS/Android WebView.
 */
export function useCapacitor() {
  const isNative = Capacitor.isNativePlatform()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!isNative) return

    StatusBar.setOverlaysWebView({ overlay: false })
    StatusBar.setBackgroundColor({ color: '#970747' })

    // Hide splash once the app has painted
    SplashScreen.hide()

    // Prevent body scroll on keyboard open (chat input)
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.style.overflow = 'hidden'
    })
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.overflow = ''
    })

    // Handle Android back button
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        App.exitApp()
      }
    })

    return () => {
      Keyboard.removeAllListeners()
      App.removeAllListeners()
    }
  }, [isNative])
}
