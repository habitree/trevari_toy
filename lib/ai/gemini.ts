import { GoogleGenerativeAI } from '@google/generative-ai'
import type { DifyChunk } from './dify'

// 환경 변수 검증
if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY가 설정되지 않았습니다.')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateWaterIntakeReport(
    waterLogs: any[],
    conditionMemos: any[],
    periodStart: string,
    periodEnd: string
): Promise<string> {
    try {
        // ⚠️ 중요: gemini-3-flash-preview 모델 고정
        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview'
        })

        const prompt = buildPrompt(waterLogs, conditionMemos, periodStart, periodEnd)

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        return text
    } catch (error) {
        console.error('Gemini API 호출 실패:', error)
        throw new Error('AI 리포트 생성에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
}

function buildPrompt(
    waterLogs: any[],
    conditionMemos: any[],
    periodStart: string,
    periodEnd: string
): string {
    // 물 섭취 데이터 요약
    const totalLogs = waterLogs.length
    const highCount = waterLogs.filter(log => log.intensity === 'high').length
    const mediumCount = waterLogs.filter(log => log.intensity === 'medium').length
    const lowCount = waterLogs.filter(log => log.intensity === 'low').length

    // 요일별 패턴 분석
    const logsByDayOfWeek = waterLogs.reduce((acc, log) => {
        const date = new Date(log.recorded_at)
        // locale data might not be available in serverless env, using simple array
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
        acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    // 시간대별 패턴
    const logsByTimeOfDay = waterLogs.reduce((acc, log) => {
        const hour = new Date(log.recorded_at).getHours()
        const period = hour < 12 ? '오전' : hour < 18 ? '오후' : '저녁'
        acc[period] = (acc[period] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    // 컨디션 메모 요약
    const conditionSummary = conditionMemos.map(memo =>
        `- ${memo.memo_date}: ${memo.condition_type} ${memo.note ? `(${memo.note})` : ''}`
    ).join('\n')

    return `
당신은 물 섭취 습관을 분석하는 친근하고 공감적인 AI 코치입니다.

# 분석 데이터
- 기간: ${periodStart} ~ ${periodEnd}
- 총 기록 횟수: ${totalLogs}회
- 섭취 강도: 충분함(${highCount}), 보통(${mediumCount}), 적음(${lowCount})

# 시간대별 패턴
${Object.entries(logsByTimeOfDay).map(([time, count]) => `- ${time}: ${count}회`).join('\n')}

# 요일별 패턴
${Object.entries(logsByDayOfWeek).map(([day, count]) => `- ${day}요일: ${count}회`).join('\n')}

# 컨디션 및 메모
${conditionSummary || '(기록된 컨디션 메모 없음)'}

---

# 작성 지침
1. **톤앤매너**: 따뜻하고 격려하는 말투. 친구나 코치처럼 대화하듯이 작성.
2. **구조**:
   - 👋 **전반적인 흐름**: 이번 기간의 섭취 패턴 요약
   - 🔍 **발견된 패턴**: 시간대나 요일, 컨디션과의 연관성 분석 (예: "피곤한 날에는 물을 적게 드셨네요")
   - 💡 **작은 제안**: 부담스럽지 않은 실천 팁 하나만 제안
3. **주의사항**:
   - 절대 혼내거나 평가하지 마세요. (X: "물을 너무 안 마셨네요", O: "바쁘셔서 물 마실 시간을 놓치신 것 같아요")
   - 부정적인 단어 대신 긍정적인 가능성을 언급하세요.
   - 길이는 2~3문단 정도로 짧고 읽기 좋게 작성하세요.

위 데이터를 바탕으로 사용자를 위한 리포트를 작성해주세요.
`.trim()
}

/**
 * RAG 기반으로 질문에 대한 답변을 생성합니다.
 * Dify에서 검색한 문서 청크를 컨텍스트로 사용하여 Gemini API로 답변을 생성합니다.
 * @param question 사용자의 질문
 * @param contextChunks Dify에서 검색한 관련 문서 청크
 * @returns 생성된 답변 (Markdown 형식)
 */
export async function generateRAGResponse(
    question: string,
    contextChunks: DifyChunk[]
): Promise<string> {
    try {
        // ⚠️ 중요: gemini-3-flash-preview 모델 고정
        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview'
        })

        const prompt = buildRAGPrompt(question, contextChunks)

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        return text
    } catch (error) {
        console.error('Gemini API 호출 실패:', error)
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
당신은 물 섭취와 건강에 대한 전문 지식을 가진 친근한 AI 어시스턴트입니다.
사용자의 질문에 답변할 때, 아래 제공된 참고 자료를 기반으로 정확하고 도움이 되는 답변을 제공해주세요.

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
