import api from '@/lib/api';
import type { Email, EmailReply } from '@/types/models';
import type {
    ApiResponse,
    PaginatedResponse,
    EmailFilterParams,
    CreateEmailDTO,
    UpdateEmailDTO,
    CreateEmailReplyDTO,
} from '@/types/api';

// =============================================================================
// Email / Surat
// =============================================================================

export interface EmailRecipientOption {
    type: 'user' | 'role';
    user_id: number | null;
    role: string | null;
    label: string;
    description: string;
}

export interface EmailRecipientsResponse {
    users: EmailRecipientOption[];
    roles: EmailRecipientOption[];
}

export async function getEmails(
    params?: EmailFilterParams,
): Promise<PaginatedResponse<Email>> {
    const { data } = await api.get<PaginatedResponse<Email>>('/emails', { params });
    return data;
}

export async function getEmailRecipients(): Promise<EmailRecipientsResponse> {
    const { data } = await api.get<ApiResponse<EmailRecipientsResponse>>('/emails/recipients');
    return data.data;
}

export async function getEmail(id: number): Promise<Email> {
    const { data } = await api.get<ApiResponse<Email>>(`/emails/${id}`);
    return data.data;
}

export async function createEmail(dto: CreateEmailDTO): Promise<Email> {
    // Use FormData when files are present
    if (dto.files && dto.files.length > 0) {
        const formData = new FormData();
        formData.append('name_surat', dto.name_surat);
        formData.append('isi_surat', dto.isi_surat);
        formData.append('tgl_surat', dto.tgl_surat);

        if (dto.no_surat) formData.append('no_surat', dto.no_surat);
        if (dto.status) formData.append('status', dto.status);
        if (dto.ditujukan) formData.append('ditujukan', dto.ditujukan);

        if (dto.recipients) {
            dto.recipients.forEach((r, i) => {
                if (r.user_id) formData.append(`recipients[${i}][user_id]`, String(r.user_id));
                if (r.role) formData.append(`recipients[${i}][role]`, r.role);
            });
        }

        dto.files.forEach((file, i) => {
            formData.append(`files[${i}]`, file);
        });

        const { data } = await api.post<ApiResponse<Email>>('/emails', formData);
        return data.data;
    }

    const { files: _, ...payload } = dto;
    const { data } = await api.post<ApiResponse<Email>>('/emails', payload);
    return data.data;
}

export async function updateEmail(id: number, dto: UpdateEmailDTO): Promise<Email> {
    const { data } = await api.put<ApiResponse<Email>>(`/emails/${id}`, dto);
    return data.data;
}

export async function deleteEmail(id: number): Promise<void> {
    await api.delete(`/emails/${id}`);
}

/**
 * Send a draft email (change status to sent).
 */
export async function sendEmail(id: number): Promise<Email> {
    const { data } = await api.post<ApiResponse<Email>>(`/emails/${id}/send`);
    return data.data;
}

/**
 * Archive an email.
 */
export async function archiveEmail(id: number): Promise<Email> {
    const { data } = await api.post<ApiResponse<Email>>(`/emails/${id}/archive`);
    return data.data;
}

// =============================================================================
// Email Replies
// =============================================================================

export async function getEmailReplies(emailId: number): Promise<EmailReply[]> {
    const { data } = await api.get<ApiResponse<EmailReply[]>>(`/emails/${emailId}/replies`);
    return data.data;
}

export async function createEmailReply(dto: CreateEmailReplyDTO): Promise<EmailReply> {
    // Use FormData when files are present
    if (dto.files && dto.files.length > 0) {
        const formData = new FormData();
        formData.append('isi', dto.isi);

        dto.files.forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });

        const { data } = await api.post<ApiResponse<EmailReply>>(
            `/emails/${dto.email_id}/reply`,
            formData,
        );
        return data.data;
    }

    const { data } = await api.post<ApiResponse<EmailReply>>(
        `/emails/${dto.email_id}/reply`,
        { isi: dto.isi },
    );
    return data.data;
}

export async function deleteEmailReply(emailId: number, replyId: number): Promise<void> {
    await api.delete(`/emails/${emailId}/replies/${replyId}`);
}

// =============================================================================
// Email Attachments
// =============================================================================

export async function uploadEmailAttachment(emailId: number, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    await api.post(`/emails/${emailId}/attachments`, formData);
}

export async function deleteEmailAttachment(
    emailId: number,
    attachmentId: number,
): Promise<void> {
    await api.delete(`/emails/${emailId}/attachments/${attachmentId}`);
}

// =============================================================================
// Email Reminder Stats
// =============================================================================

export interface EmailReminderStats {
    unread_email_count: number;
    unread_reply_count: number;
}

export async function getEmailReminderStats(): Promise<EmailReminderStats> {
    const { data } = await api.get<ApiResponse<EmailReminderStats>>('/emails/reminder-stats');
    return data.data;
}
