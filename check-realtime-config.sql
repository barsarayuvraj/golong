-- Check Realtime Configuration

-- Check if the profiles table has replication enabled
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'profiles' 
AND schemaname = 'public';

-- Check publication settings (this controls what gets replicated)
SELECT * FROM pg_publication_tables WHERE tablename = 'profiles';

-- Check if there are any publications
SELECT * FROM pg_publication;

-- Check if realtime extension is installed
SELECT * FROM pg_extension WHERE extname = 'realtime';

SELECT 'Realtime configuration check completed' as status;
