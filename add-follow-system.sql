-- Add follow system tables and privacy settings

-- 1. Add privacy setting to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_private BOOLEAN DEFAULT false;

-- 2. Create follows table (approved follows)
CREATE TABLE public.follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 3. Create follow_requests table (pending requests)
CREATE TABLE public.follow_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(requester_id, target_id)
);

-- 4. Create indexes for performance
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_follow_requests_requester_id ON public.follow_requests(requester_id);
CREATE INDEX idx_follow_requests_target_id ON public.follow_requests(target_id);
CREATE INDEX idx_follow_requests_status ON public.follow_requests(status);

-- 5. Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for follows table
CREATE POLICY "Users can view their own follows" ON public.follows
  FOR SELECT USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can create follows" ON public.follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete their own follows" ON public.follows
  FOR DELETE USING (follower_id = auth.uid());

-- 7. RLS Policies for follow_requests table
CREATE POLICY "Users can view their own follow requests" ON public.follow_requests
  FOR SELECT USING (requester_id = auth.uid() OR target_id = auth.uid());

CREATE POLICY "Users can create follow requests" ON public.follow_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update follow requests they received" ON public.follow_requests
  FOR UPDATE USING (target_id = auth.uid());

CREATE POLICY "Users can delete their own follow requests" ON public.follow_requests
  FOR DELETE USING (requester_id = auth.uid());

-- 8. Function to handle follow request acceptance
CREATE OR REPLACE FUNCTION handle_follow_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to 'accepted', create a follow relationship
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.requester_id, NEW.target_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
    
    -- Set responded_at timestamp
    NEW.responded_at = NOW();
  END IF;
  
  -- If status changed to 'rejected', just set responded_at
  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    NEW.responded_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Trigger for follow request acceptance
CREATE TRIGGER handle_follow_request_acceptance_trigger
  BEFORE UPDATE ON public.follow_requests
  FOR EACH ROW EXECUTE FUNCTION handle_follow_request_acceptance();

-- 10. Function to create follow notifications
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the person being followed
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.following_id,
    'follow',
    'New Follower!',
    'Someone started following you.',
    jsonb_build_object('follower_id', NEW.follower_id)
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Trigger for follow notifications
CREATE TRIGGER create_follow_notification_trigger
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION create_follow_notification();

-- 12. Function to create follow request notifications
CREATE OR REPLACE FUNCTION create_follow_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the person receiving the follow request
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.target_id,
    'follow_request',
    'New Follow Request',
    'Someone wants to follow you.',
    jsonb_build_object('requester_id', NEW.requester_id)
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 13. Trigger for follow request notifications
CREATE TRIGGER create_follow_request_notification_trigger
  AFTER INSERT ON public.follow_requests
  FOR EACH ROW EXECUTE FUNCTION create_follow_request_notification();
