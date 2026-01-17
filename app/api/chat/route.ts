import { NextRequest, NextResponse } from 'next/server'
import { retrieveChunks } from '@/lib/ai/dify'
import { generateRAGResponse } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
    try {
        // 환경 변수 검증 (더 엄격한 검증)
        const geminiApiKey = process.env.GEMINI_API_KEY?.trim()
        if (!geminiApiKey || geminiApiKey.length === 0) {
            console.error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.')
            return NextResponse.json(
                { error: 'Gemini API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.' },
                { status: 500 }
            )
        }

        const difyApiKey = process.env.DIFY_API_KEY?.trim()
        const difyDatasetId = process.env.DIFY_DATASET_ID?.trim()
        
        if (!difyApiKey || difyApiKey.length === 0 || !difyDatasetId || difyDatasetId.length === 0) {
            console.error('Dify 환경 변수가 설정되지 않았습니다.')
            return NextResponse.json(
                { error: 'Dify API 키 또는 Dataset ID가 설정되지 않았습니다. .env.local 파일을 확인해주세요.' },
                { status: 500 }
            )
        }

        const { question } = await request.json()

        if (!question || typeof question !== 'string' || question.trim().length === 0) {
            return NextResponse.json(
                { error: '질문을 입력해주세요.' },
                { status: 400 }
            )
        }

        // 1. Dify API로 관련 문서 청크 검색
        const chunks = await retrieveChunks(question.trim(), 3)

        // 2. Gemini API로 RAG 기반 답변 생성
        const answer = await generateRAGResponse(question.trim(), chunks)

        // 3. 출처 정보 추출
        const sources = chunks.map(chunk => ({
            content: chunk.content,
            source: chunk.document_name || chunk.source || '알 수 없는 출처',
            chunkId: chunk.chunk_id,
            documentId: chunk.document_id,
            score: chunk.score,
        }))

        return NextResponse.json({
            answer,
            sources,
        })
    } catch (error) {
        console.error('챗봇 API 오류:', error)
        
        // 에러 타입에 따라 다른 메시지 반환
        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message || '답변 생성에 실패했습니다.' },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { error: '답변 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' },
            { status: 500 }
        )
    }
}
