import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as emailService from '@/services/emailService';
import type {
    EmailFilterParams,
    CreateEmailDTO,
    UpdateEmailDTO,
    CreateEmailReplyDTO,
} from '@/types/api';

// =============================================================================
// Email CRUD hooks
// =============================================================================

export function useEmails(params?: EmailFilterParams) {
    return useQuery({
        queryKey: ['emails', params],
        queryFn: () => emailService.getEmails(params),
    });
}

export function useEmail(id: number | null) {
    return useQuery({
        queryKey: ['emails', id],
        queryFn: () => emailService.getEmail(id!),
        enabled: id !== null,
    });
}

export function useEmailRecipients() {
    return useQuery({
        queryKey: ['email-recipients'],
        queryFn: () => emailService.getEmailRecipients(),
    });
}

export function useCreateEmail() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateEmailDTO) => emailService.createEmail(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
        },
    });
}

export function useUpdateEmail() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateEmailDTO }) =>
            emailService.updateEmail(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            queryClient.invalidateQueries({ queryKey: ['emails', variables.id] });
        },
    });
}

export function useDeleteEmail() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => emailService.deleteEmail(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
        },
    });
}

export function useSendEmail() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => emailService.sendEmail(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            queryClient.invalidateQueries({ queryKey: ['emails', id] });
        },
    });
}

export function useArchiveEmail() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => emailService.archiveEmail(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            queryClient.invalidateQueries({ queryKey: ['emails', id] });
        },
    });
}

// =============================================================================
// Email Reply hooks
// =============================================================================

export function useEmailReplies(emailId: number | null) {
    return useQuery({
        queryKey: ['emails', emailId, 'replies'],
        queryFn: () => emailService.getEmailReplies(emailId!),
        enabled: emailId !== null,
    });
}

export function useCreateEmailReply() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateEmailReplyDTO) => emailService.createEmailReply(dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['emails', variables.email_id, 'replies'],
            });
            queryClient.invalidateQueries({
                queryKey: ['emails', variables.email_id],
            });
        },
    });
}

export function useDeleteEmailReply() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            emailId,
            replyId,
        }: {
            emailId: number;
            replyId: number;
        }) => emailService.deleteEmailReply(emailId, replyId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['emails', variables.emailId, 'replies'],
            });
        },
    });
}

// =============================================================================
// Email Attachment hooks
// =============================================================================

export function useUploadEmailAttachment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ emailId, file }: { emailId: number; file: File }) =>
            emailService.uploadEmailAttachment(emailId, file),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['emails', variables.emailId],
            });
        },
    });
}

export function useDeleteEmailAttachment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            emailId,
            attachmentId,
        }: {
            emailId: number;
            attachmentId: number;
        }) => emailService.deleteEmailAttachment(emailId, attachmentId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['emails', variables.emailId],
            });
        },
    });
}

// =============================================================================
// Email Reminder Stats hooks
// =============================================================================

export function useEmailReminderStats() {
    return useQuery({
        queryKey: ['email-reminder-stats'],
        queryFn: () => emailService.getEmailReminderStats(),
    });
}
