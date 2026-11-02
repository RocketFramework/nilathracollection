import type { TaskStatus, TaskPriority, TaskDueBasis } from '@/types/types';

export interface TaskCategoryDTO {
    id: string;
    name: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
}

export interface TaskTemplateDTO {
    id: string;
    title: string;
    description: string | null;
    stepKey: string;
    categoryId: string | null;
    categoryName: string | null;
    defaultPriority: TaskPriority;
    dueOffsetDays: number | null;
    dueOffsetBasis: TaskDueBasis;
    requiresReview: boolean;
    autoCreateOnStep: boolean;
    points: number;
    isActive: boolean;
}

export interface TaskTemplateInputDTO {
    id?: string;
    title: string;
    description?: string | null;
    stepKey: string;
    categoryId?: string | null;
    defaultPriority: TaskPriority;
    dueOffsetDays?: number | null;
    dueOffsetBasis: TaskDueBasis;
    requiresReview: boolean;
    autoCreateOnStep: boolean;
    points: number;
    isActive: boolean;
}

export interface TaskDTO {
    id: string;
    taskNo: number;
    tourId: string | null;
    tourCode: string | null;
    tourTitle: string | null;
    templateId: string | null;
    title: string;
    description: string | null;
    stepKey: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueAt: string | null;
    assignedTo: string;
    assignedToName: string;
    assignedBy: string;
    assignedByName: string;
    holdNote: string | null;
    resumeOn: string | null;
    reviewNote: string | null;
    requiresReview: boolean;
    points: number;
    completedAt: string | null;
    createdAt: string;
    isOverdue: boolean;
}

export interface CreateTaskDTO {
    tourId?: string | null;
    templateId?: string | null;
    title: string;
    description?: string | null;
    stepKey: string;
    priority: TaskPriority;
    assignedTo: string;
    dueAt?: string | null;
    dueOffsetDays?: number | null;
    dueOffsetBasis?: TaskDueBasis | null;
    requiresReview?: boolean;
    points?: number;
}

export interface TaskCommentDTO {
    id: string;
    taskId: string;
    authorId: string;
    authorName: string;
    body: string | null;
    attachmentUrl: string | null;
    createdAt: string;
}

export interface TaskEventDTO {
    id: string;
    eventType: string;
    fromValue: string | null;
    toValue: string | null;
    note: string | null;
    actorName: string;
    createdAt: string;
}

export interface TaskUserOptionDTO {
    id: string;
    name: string;
    role: string | null;
}

export interface TaskFiltersDTO {
    tourId?: string;
    assignedTo?: string;
    statuses?: TaskStatus[];
    stepKey?: string;
}

export interface LeaderboardEntryDTO {
    userId: string;
    userName: string;
    pointsWeek: number;
    pointsMonth: number;
    pointsTotal: number;
    tasksCompleted: number;
}

export interface TaskTourOptionDTO {
    id: string;
    label: string;
}
