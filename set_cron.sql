SELECT cron.schedule(
	'collect_metrics',
	'* * * * *', -- Executes every minute (cron syntax)
	$$
	    -- SQL query
	    SELECT net.http_get(
		-- URL of Edge function
		url:='https://<reference id>.functions.supabase.co/collect',
		headers:='{
		    "Content-Type": "application/json",
		    "Authorization": "Bearer <TOKEN>"
		}'::JSONB
	    ) as request_id;
	$$
);