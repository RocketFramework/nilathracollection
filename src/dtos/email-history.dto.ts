import { TourSharedEmail, TourRfqEmail, TourRfpEmail } from '@/other/interfaces';

export type LogSharedEmailDTO = Omit<TourSharedEmail, 'id' | 'shared_at'>;

export type LogRfqEmailDTO = Omit<TourRfqEmail, 'id' | 'sent_at'>;

export type LogRfpEmailDTO = Omit<TourRfpEmail, 'id' | 'sent_at'>;
