'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface WaterAnimationProps {
    isVisible: boolean
    onComplete?: () => void
}

export function WaterAnimation({ isVisible, onComplete }: WaterAnimationProps) {
    const [show, setShow] = useState(false)

    useEffect(() => {
        if (isVisible) {
            setShow(true)
            // 애니메이션 총 시간(약 2초) 후 종료
            const timer = setTimeout(() => {
                setShow(false)
                onComplete?.()
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [isVisible, onComplete])

    if (!show) return null

    // Next.js SSR 이슈 방지를 위해 document가 있을 때만 Portal 사용
    if (typeof document === 'undefined') return null

    return createPortal(
        <div
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
            style={{ animation: 'bg-fade-blue 2s ease-in-out forwards' }}
        >
            {/* 떨어지는 물방울 */}
            <div
                className="absolute w-8 h-8 bg-white rounded-tr-[50%] rounded-br-[50%] rounded-bl-[50%] rounded-tl-0 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                style={{
                    left: '50%',
                    animation: 'water-drop-fall 2s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards'
                }}
            />

            {/* 퍼지는 효과 */}
            <div
                className="absolute bg-blue-400 rounded-full opacity-0"
                style={{
                    left: '50%',
                    animation: 'water-spread 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
                }}
            />
        </div>,
        document.body
    )
}
