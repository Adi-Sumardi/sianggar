import api from '@/lib/api';
import type { RevisionComment, RevisionThreadData, RevisionThreadAllRoundsData } from '@/types/models';
import type { RevisionCommentDTO } from '@/types/api';

export type RevisionDocType = 'pengajuan' | 'lpj' | 'perubahan-anggaran' | 'rapbs';

/**
 * Get revision comments for the current round.
 */
export async function getRevisionComments(
    docType: RevisionDocType,
    docId: number,
): Promise<RevisionThreadData> {
    const { data } = await api.get<{ data: RevisionThreadData }>(
        `/revision-comments/${docType}/${docId}`,
    );
    return data.data;
}

/**
 * Get all revision comment rounds (history).
 */
export async function getRevisionCommentHistory(
    docType: RevisionDocType,
    docId: number,
): Promise<RevisionThreadAllRoundsData> {
    const { data } = await api.get<{ data: RevisionThreadAllRoundsData }>(
        `/revision-comments/${docType}/${docId}`,
        { params: { round: 'all' } },
    );
    return data.data;
}

/**
 * Add a comment to the current revision thread.
 */
export async function addRevisionComment(
    docType: RevisionDocType,
    docId: number,
    dto: RevisionCommentDTO,
): Promise<RevisionComment> {
    const { data } = await api.post<{ data: RevisionComment }>(
        `/revision-comments/${docType}/${docId}`,
        dto,
    );
    return data.data;
}
