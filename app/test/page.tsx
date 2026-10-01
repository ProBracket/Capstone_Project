import { supabase } from '@/lib/supabase';

export default async function TestPage() {
    const { data, error } = await supabase.from('test_table').select('*');

    if (error) return<pre>Error: {error.message}</pre>;
    return <pre>{JSON.stringify(data, null, 2)}</pre>;
}