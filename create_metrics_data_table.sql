CREATE TABLE IF NOT EXISTS metrics_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    project_ref VARCHAR(255),
    metrics_data JSONB
);
ALTER TABLE metrics_data ENABLE ROW LEVEL SECURITY;

