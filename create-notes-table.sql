-- Create notes table for private streak notes
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    streak_id UUID NOT NULL REFERENCES public.streaks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_streak_id ON public.notes(streak_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notes
-- Users can view notes for streaks they have access to
CREATE POLICY "Users can view notes for accessible streaks" ON public.notes
    FOR SELECT USING (
        -- Owner can view their own notes
        auth.uid() = user_id OR
        -- Anyone can view notes for public streaks
        EXISTS (SELECT 1 FROM public.streaks WHERE id = streak_id AND is_public = true) OR
        -- Owner of the streak can view all notes for their streak
        EXISTS (SELECT 1 FROM public.streaks WHERE id = streak_id AND created_by = auth.uid())
    );

-- Users can create notes for streaks they have access to
CREATE POLICY "Users can create notes for accessible streaks" ON public.notes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND (
            -- Anyone can create notes for public streaks
            EXISTS (SELECT 1 FROM public.streaks WHERE id = streak_id AND is_public = true) OR
            -- Owner of the streak can create notes for their streak
            EXISTS (SELECT 1 FROM public.streaks WHERE id = streak_id AND created_by = auth.uid())
        )
    );

-- Users can update their own notes
CREATE POLICY "Users can update their own notes" ON public.notes
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notes
CREATE POLICY "Users can delete their own notes" ON public.notes
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION update_notes_updated_at();
