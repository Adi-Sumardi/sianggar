import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as revisionCommentService from '@/services/revisionCommentService';
import type { RevisionDocType } from '@/services/revisionCommentService';
import type { RevisionCommentDTO } from '@/types/api';

/**
 * Query current revision thread comments.
 */
export function useRevisionComments(
    docType: RevisionDocType,
    docId: number | null,
    options?: { enabled?: boolean; refetchInterval?: number },
) {
    return useQuery({
        queryKey: ['revision-comments', docType, docId],
        queryFn: () => revisionCommentService.getRevisionComments(docType, docId!),
        enabled: (options?.enabled ?? true) && docId !== null,
        refetchInterval: options?.refetchInterval,
    });
}

/**
 * Query all revision comment rounds (history).
 */
export function useRevisionCommentHistory(
    docType: RevisionDocType,
    docId: number | null,
    options?: { enabled?: boolean },
) {
    return useQuery({
        queryKey: ['revision-comments', docType, docId, 'history'],
        queryFn: () => revisionCommentService.getRevisionCommentHistory(docType, docId!),
        enabled: (options?.enabled ?? true) && docId !== null,
    });
}

/**
 * Mutation to add a revision comment.
 */
export function useAddRevisionComment(docType: RevisionDocType) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ docId, dto }: { docId: number; dto: RevisionCommentDTO }) =>
            revisionCommentService.addRevisionComment(docType, docId, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['revision-comments', docType, variables.docId],
            });
        },
    });
}
