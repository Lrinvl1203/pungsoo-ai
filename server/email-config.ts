export const getResendApiKey = () => (
    process.env.RESEND_API_KEY || process.env.RESEND_KEY || ''
).trim();

export const getAdminEmail = () => (
    process.env.ADMIN_EMAIL || ''
).trim().toLowerCase();
