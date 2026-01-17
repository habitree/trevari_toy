// Dify API 클라이언트
// 지식베이스에서 관련 문서 청크를 검색하는 기능

export interface DifyChunk {
    content: string
    score?: number
    source?: string
    chunk_id?: string
    dataset_id?: string
    dataset_name?: string
    document_id?: string
    document_name?: string
}

export interface DifyRetrieveResponse {
    chunks: DifyChunk[]
    query: string
}

const DIFY_API_BASE = 'https://api.dify.ai/v1'

/**
 * Dify API를 사용하여 지식베이스에서 관련 문서 청크를 검색합니다.
 * @param query 검색할 질문
 * @param topK 반환할 최대 청크 수 (기본값: 3)
 * @returns 관련 문서 청크 배열
 */
export async function retrieveChunks(
    query: string,
    topK: number = 3
): Promise<DifyChunk[]> {
    try {
        const datasetId = process.env.DIFY_DATASET_ID
        const apiKey = process.env.DIFY_API_KEY

        if (!datasetId || !apiKey) {
            throw new Error('Dify API 키 또는 Dataset ID가 설정되지 않았습니다.')
        }

        const response = await fetch(
            `${DIFY_API_BASE}/datasets/${datasetId}/retrieve`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    top_k: topK,
                }),
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Dify API 오류:', response.status, errorText)
            throw new Error(`Dify API 호출 실패: ${response.status} ${errorText}`)
        }

        const data: DifyRetrieveResponse = await response.json()
        return data.chunks || []
    } catch (error) {
        console.error('Dify API 호출 중 오류 발생:', error)
        throw error
    }
}
