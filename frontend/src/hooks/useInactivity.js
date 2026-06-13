import { useEffect, useRef, useCallback } from 'react'
export default function useInactivity({ timeout = 30, onWarning, onLogout }) {
    // timeout en minutos
    const warningTimer = useRef(null)
    const logoutTimer = useRef(null)

    const resetTimers = useCallback(() => {
        clearTimeout(warningTimer.current)
        clearTimeout(logoutTimer.current)

        // Avisar 2 minutos antes del cierre
        warningTimer.current = setTimeout(() => {
            onWarning?.()
        }, (timeout - 2) * 60 * 1000)

        // Cerrar sesión al llegar al timeout
        logoutTimer.current = setTimeout(() => {
            onLogout?.()
        }, timeout * 60 * 1000)
    }, [timeout, onWarning, onLogout])

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

        events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }))
        resetTimers()

        return () => {
            events.forEach(e => window.removeEventListener(e, resetTimers))
            clearTimeout(warningTimer.current)
            clearTimeout(logoutTimer.current)
        }
    }, [resetTimers])
}