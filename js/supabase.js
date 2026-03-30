import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://robmbzpiwqozxifgsyuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYm1ienBpd3FvenhpZmdzeXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTU3NjIsImV4cCI6MjA5MDM3MTc2Mn0.5Ftzi_lZZe8konYWHi48nx54QjKa6SuLIlqErkmIwyA';

export const supabase = createClient(supabaseUrl, supabaseKey);
