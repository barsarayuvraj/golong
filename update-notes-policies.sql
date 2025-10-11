-- Update notes table policies (safe to run multiple times)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view notes for accessible streaks" ON public.notes;
DROP POLICY IF EXISTS "Users can create notes for accessible streaks" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

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
