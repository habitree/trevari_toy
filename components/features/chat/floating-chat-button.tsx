'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { WaterAssistant } from './water-assistant'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FloatingChatButton() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className={cn(
                    'fixed bottom-20 right-6 z-50 h-14 w-14 rounded-full shadow-lg',
                    'bg-primary hover:bg-primary/90',
                    'md:bottom-6',
                    'transition-all duration-200 hover:scale-110'
                )}
                size="icon"
                aria-label="물먹는도우미 열기"
            >
                <MessageCircle className="h-6 w-6" />
            </Button>

            <WaterAssistant open={open} onOpenChange={setOpen} />
        </>
    )
}
