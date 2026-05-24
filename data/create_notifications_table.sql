CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_description TEXT NOT NULL,
    action_waiting TEXT,
    action_duration INTEGER,
    action_page TEXT,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read'))
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = action_owner_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = action_owner_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = action_owner_id);

-- Create a policy for service role to manage everything if needed
CREATE POLICY "Service role has full access" ON public.notifications
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');
