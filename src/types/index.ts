// ==================== USER ====================
export interface User {
    _id: string;
    firebaseUid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    isPro: boolean;
    isAdmin: boolean;
    proExpiresAt: string | null;
    pagesCreated: number;
    lastLogin: string;
    payments: Payment[];
    createdAt: string;
    updatedAt: string;
    actualPageCount?: number;
}

export interface Payment {
    paymentId: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    mercadoPagoId: string;
}

// ==================== PAGE ====================
export interface PageItem {
    _id: string;
    shortId: string;
    title: string;
    recipientName: string;
    pageType: 'free' | 'pro';
    theme: string;
    views: number;
    totalResponses: number;
    yesCount: number;
    noCount: number;
    backgroundImageUrl: string | null;
    isActive: boolean;
    createdAt: string;
    owner?: {
        _id: string;
        email: string;
        displayName: string;
    } | null;
}

export interface PageDetail {
    _id: string;
    shortId: string;
    title: string;
    recipientName: string;
    message: string;
    yesButtonText: string;
    noButtonText: string;
    noButtonEscapes: boolean;
    pageType: 'free' | 'pro';
    theme: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    titleFont: string;
    bodyFont: string;
    backgroundImageUrl: string | null;
    decorativeImageUrls: string[];
    selectedStickers: string[];
    animation: string;
    backgroundMusic: string;
    showWatermark: boolean;
    customHTML: string | null;
    customCSS: string | null;
    referenceImageUrl: string | null;
    views: number;
    uniqueViews: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    userId?: {
        _id: string;
        email: string;
        displayName: string;
        photoURL: string | null;
    };
    responses: PageResponse[];
    stats: {
        views: number;
        uniqueViews: number;
        totalResponses: number;
        yesCount: number;
        noCount: number;
        yesPercentage: string | number;
        noPercentage: string | number;
    };
}

export interface PageResponse {
    _id: string;
    answer: 'yes' | 'no';
    respondedAt: string;
    ipAddress?: string;
    location?: {
        country?: string;
        city?: string;
    };
    userAgent?: string;
}

// ==================== CONTACT ====================
export interface Contact {
    _id: string;
    userId?: {
        _id: string;
        email: string;
        displayName: string;
    } | null;
    name: string;
    email: string;
    type: 'comment' | 'custom_page' | 'support' | 'other';
    subject: string;
    message: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    adminNotes: string;
    respondedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// ==================== DASHBOARD ====================
export interface DashboardStats {
    totalUsers: number;
    totalPages: number;
    totalContacts: number;
    proUsers: number;
    pendingContacts: number;
    activePages: number;
    newUsersLast7Days: number;
    newPagesLast7Days: number;
}

// ==================== PAGINATION ====================
export interface Pagination {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    pagination?: Pagination;
}