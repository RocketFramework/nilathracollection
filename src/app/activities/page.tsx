import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Curated Sri Lanka Activities & Experiences | Nilathra Collection',
    description: 'Explore bespoke Sri Lanka activities, wildlife safaris, water sports, trekking, and cultural tours. Select your experiences and request a custom booking online.',
};

export default function ActivitiesPage() {
    redirect('/custom-plan');
}
