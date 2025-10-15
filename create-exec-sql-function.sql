-- Create exec_sql function for MCP server
-- This function allows safe execution of SELECT queries only

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    rec RECORD;
    rows_array JSON[] := '{}';
BEGIN
    -- Basic security check - only allow SELECT statements
    IF NOT (upper(trim(sql_query)) LIKE 'SELECT%') THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- Additional security checks for dangerous keywords
    IF upper(sql_query) ~ '(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE|GRANT|REVOKE|EXECUTE)' THEN
        RAISE EXCEPTION 'Dangerous SQL keywords detected. Only SELECT queries are allowed.';
    END IF;
    
    -- Execute the query and convert result to JSON
    FOR rec IN EXECUTE sql_query LOOP
        rows_array := array_append(rows_array, row_to_json(rec));
    END LOOP;
    
    -- Return the result as JSON
    result := array_to_json(rows_array);
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information as JSON
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM,
            'code', SQLSTATE
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;
