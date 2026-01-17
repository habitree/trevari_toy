// OpenAI GPT API 클라이언트
// RAG 기반 답변 생성을 위한 GPT API 사용

import OpenAI from 'openai'
import type { DifyChunk } from './dify'

// OpenAI 클라이언트를 지연 초기화
let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
    if (!openai) {
        const apiKey = process.env.OPENAI_API_KEY
        
        if (!apiKey || apiKey.trim().length === 0) {
            throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았거나 유효하지 않습니다.')
        }
        
        openai = new OpenAI({
            apiKey: apiKey.trim(),
        })
    }
    
    return openai
}

/**
 * RAG 기반으로 질문에 대한 답변을 생성합니다.
 * Dify에서 검색한 문서 청크를 컨텍스트로 사용하여 GPT API로 답변을 생성합니다.
 * @param question 사용자의 질문
 * @param contextChunks Dify에서 검색한 관련 문서 청크
 * @returns 생성된 답변 (Markdown 형식)
 */
export async function generateRAGResponse(
    question: string,
    contextChunks: DifyChunk[]
): Promise<string> {
    try {
        const client = getOpenAI()
        
        const prompt = buildRAGPrompt(question, contextChunks)

        const completion = await client.chat.completions.create({
            model: 'gpt-4o-mini', // 또는 'gpt-4o', 'gpt-3.5-turbo' 등
            messages: [
                {
                    role: 'system',
                    content: '당신은 물 섭취와 건강에 대한 전문 지식을 가진 친근한 AI 어시스턴트입니다. 사용자의 질문에 정확하고 도움이 되는 답변을 제공합니다.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
        })

        const answer = completion.choices[0]?.message?.content
        
        if (!answer) {
            throw new Error('GPT API에서 답변을 받지 못했습니다.')
        }

        return answer
    } catch (error) {
        console.error('GPT API 호출 실패:', error)
        throw new Error('AI 답변 생성에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
}

/**
 * RAG 프롬프트를 생성합니다.
 * 검색된 문서 청크를 컨텍스트로 포함하여 답변을 생성하도록 지시합니다.
 */
function buildRAGPrompt(question: string, chunks: DifyChunk[]): string {
    // 문서 청크를 컨텍스트로 포맷팅
    const contextText = chunks
        .map((chunk, index) => {
            const source = chunk.document_name || chunk.source || `문서 ${index + 1}`
            return `[출처: ${source}]\n${chunk.content}`
        })
        .join('\n\n---\n\n')

    return `
아래 제공된 참고 자료를 기반으로 사용자의 질문에 정확하고 도움이 되는 답변을 제공해주세요.

# 참고 자료
${contextText || '(관련 자료 없음)'}

# 사용자 질문
${question}

# 답변 작성 지침
1. **정확성**: 제공된 참고 자료에 기반하여 답변하세요. 자료에 없는 내용은 추측하지 마세요.
2. **톤앤매너**: 따뜻하고 친근한 말투로 작성하세요. 전문적이지만 접근하기 쉽게 설명해주세요.
3. **출처 표기**: 답변 말미에 사용한 참고 자료의 출처를 명시해주세요. 예: "출처: [문서명]"
4. **구조**: 
   - 질문에 대한 직접적인 답변
   - 필요시 추가 설명이나 팁
   - 출처 정보
5. **Markdown 형식**: 제목, 목록, 강조 등을 Markdown 문법으로 작성해주세요.

위 참고 자료를 바탕으로 사용자의 질문에 답변해주세요.
`.trim()
}
