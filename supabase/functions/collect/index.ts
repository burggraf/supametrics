// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const targetServiceRoleKey = Deno.env.get('targetServiceRoleKey');
const targetProjectRef = Deno.env.get('targetProjectRef');
const metricsProjectRef = Deno.env.get('metricsProjectRef');
const metricsServiceRoleKey = Deno.env.get('metricsServiceRoleKey');
const supabaseUrl = `https://${metricsProjectRef}.supabase.co`;
const supabase = createClient(supabaseUrl, metricsServiceRoleKey);

console.log("collect function says: 'Hello from Functions!'")

function parsePrometheusMetrics(data: string): object {
  const lines = data.split('\n');
  const metricsArray: any = [];

  for (const line of lines) {
    // Ignore comment lines
    if (line.startsWith('#')) continue;

    // Extract the metric name and value
    const match = line.match(/([^ {]+){([^}]*)} (.*)/);
    if (!match) continue;

    const metricName = match[1];
    const labels = match[2].replace(/supabase_project_ref=".*?",/g, '');
    const metricValue = parseFloat(match[3]);

    // Parse labels into an object
    const labelsData: { [key: string]: string } = {};
    const labelPairs = labels.split(',');
    for (const pair of labelPairs) {
      const [key, value] = pair.split('=');
      labelsData[key] = value.replace(/"/g, '');
    }
    metricsArray.push({
      metric: metricName,
      labels: labelsData,
      value: metricValue
    });

  }

  return metricsArray;
}

serve(async (req) => {

  const url = `https://${targetProjectRef}.supabase.co/customer/v1/privileged/metrics`;
  const auth = `service_role:${targetServiceRoleKey}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${btoa(auth)}`
    }
  });
  if (response.ok) {
    const text = (await response.text());
    const metricsData = parsePrometheusMetrics(text);

    const { error } = await supabase
      .from('metrics_data')
      .insert([
        { project_ref: targetProjectRef, metrics_data: metricsData },
      ]);

    if (error) {
      return new Response(`Error inserting data: ${error.message}`, { status: 500 });
    } else {
      return new Response('Metrics data successfully inserted', { status: 200 });
    }
  } else {
    return new Response('Error fetching metrics data', { status: 500 });
  }

  // return new Response(
  //   JSON.stringify(data),
  //   { headers: { "Content-Type": "application/json" } },
  // );
})

/**
 
// To invoke:

curl -i --location --request GET \
'https://eyjslsbgyvsmhdzkxkzu.supabase.co/functions/v1/collect' \
--header 'Authorization: Bearer <anon_token>'

 */

/**
 CREATE TABLE IF NOT EXISTS metrics_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    project_ref VARCHAR(255),
    metrics_data JSONB
);
 */
