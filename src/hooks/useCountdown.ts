import { useState, useEffect, useCallback } from 'react'

export interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
  isExpired: boolean
  formatted: string
  formattedShort: string
}

/**
 * Hook for countdown timer functionality
 * @param targetDate - ISO date string or Date object for the countdown target
 * @param onExpire - Optional callback when countdown expires
 */
export function useCountdown(
  targetDate: string | Date | null,
  onExpire?: () => void
): CountdownResult {
  const calculateTimeLeft = useCallback((): CountdownResult => {
    if (!targetDate) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
        formatted: 'Expired',
        formattedShort: '0:00'
      }
    }

    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
    const now = new Date()
    const difference = target.getTime() - now.getTime()

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
        formatted: 'Expired',
        formattedShort: '0:00'
      }
    }

    const totalSeconds = Math.floor(difference / 1000)
    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((difference / (1000 * 60)) % 60)
    const seconds = Math.floor((difference / 1000) % 60)

    // Format: "2d 14h 23m" or "14h 23m 45s" or "23m 45s"
    let formatted = ''
    if (days > 0) {
      formatted = `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      formatted = `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      formatted = `${minutes}m ${seconds}s`
    } else {
      formatted = `${seconds}s`
    }

    // Short format: "2d 14h" or "14:23:45" or "23:45"
    let formattedShort = ''
    if (days > 0) {
      formattedShort = `${days}d ${hours}h`
    } else if (hours > 0) {
      formattedShort = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      formattedShort = `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    return {
      days,
      hours,
      minutes,
      seconds,
      totalSeconds,
      isExpired: false,
      formatted,
      formattedShort
    }
  }, [targetDate])

  const [timeLeft, setTimeLeft] = useState<CountdownResult>(calculateTimeLeft)

  useEffect(() => {
    if (!targetDate) return

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)

      // Call onExpire callback when timer expires
      if (newTimeLeft.isExpired && onExpire) {
        onExpire()
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, calculateTimeLeft, onExpire])

  return timeLeft
}

/**
 * Get urgency level based on remaining time
 */
export function getUrgencyLevel(timeLeft: CountdownResult): 'normal' | 'warning' | 'critical' {
  if (timeLeft.isExpired) return 'critical'
  if (timeLeft.totalSeconds < 3600) return 'critical' // Less than 1 hour
  if (timeLeft.totalSeconds < 86400) return 'warning' // Less than 1 day
  return 'normal'
}

/**
 * Format a deadline date for display
 */
export function formatDeadline(date: string | Date | null): string {
  if (!date) return 'No deadline'

  const target = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const difference = target.getTime() - now.getTime()

  if (difference <= 0) return 'Expired'

  const days = Math.floor(difference / (1000 * 60 * 60 * 24))
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours}h remaining`
  } else if (hours > 0) {
    const minutes = Math.floor((difference / (1000 * 60)) % 60)
    return `${hours}h ${minutes}m remaining`
  } else {
    const minutes = Math.floor((difference / (1000 * 60)) % 60)
    const seconds = Math.floor((difference / 1000) % 60)
    return `${minutes}m ${seconds}s remaining`
  }
}
