export interface ScheduleItem {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    location: string;
    enabled: boolean;
}

export interface WeeklyScheduleColumn {
    id: string;
    title: string;
    content: string;
}

export interface BibliographyItem {
    authors: string;
    details: string;
}

export interface StudyPlanMetadata {
    code: string;
    name: string;
    workloadHours?: number;
    syllabus?: string;
    prerequisites?: string[];
    phase?: number;
    bibliography?: {
        basic: (string | BibliographyItem)[];
        complementary: (string | BibliographyItem)[];
    };
}
