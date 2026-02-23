import { useState, useCallback, useRef } from 'react'

const MAX_HISTORY = 50

/**
 * Generic undo/redo state manager.
 * Tracks a history stack and provides undo, redo, and push operations.
 */
export function useUndoRedo<T>(initial: T) {
    const [state, setState] = useState<T>(initial)
    const historyRef = useRef<T[]>([initial])
    const indexRef = useRef(0)

    const push = useCallback((next: T) => {
        // Trim any future states
        const history = historyRef.current.slice(0, indexRef.current + 1)
        history.push(next)

        // Cap history size
        if (history.length > MAX_HISTORY) {
            history.shift()
        } else {
            indexRef.current += 1
        }

        historyRef.current = history
        setState(next)
    }, [])

    const undo = useCallback(() => {
        if (indexRef.current <= 0) return
        indexRef.current -= 1
        const prev = historyRef.current[indexRef.current]
        setState(prev)
        return prev
    }, [])

    const redo = useCallback(() => {
        if (indexRef.current >= historyRef.current.length - 1) return
        indexRef.current += 1
        const next = historyRef.current[indexRef.current]
        setState(next)
        return next
    }, [])

    const canUndo = indexRef.current > 0
    const canRedo = indexRef.current < historyRef.current.length - 1

    // Reset history (e.g. after loading from DB)
    const reset = useCallback((value: T) => {
        historyRef.current = [value]
        indexRef.current = 0
        setState(value)
    }, [])

    return { state, push, undo, redo, canUndo, canRedo, reset }
}
