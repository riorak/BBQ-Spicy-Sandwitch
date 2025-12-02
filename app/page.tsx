import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClient()
  
  // Test connection
  const { data, error } = await supabase.from('_prisma_migrations').select('*').limit(1)
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black gap-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-black dark:text-zinc-50">
            Polyedge.ai
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            Privacy-first Polymarket trading companion
          </p>
        </div>
        
        <div className="mt-8 p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
            Supabase Connection Status
          </h2>
          {error ? (
            <div className="text-red-500">
              <p className="font-medium">❌ Connection failed</p>
              <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">{error.message}</p>
            </div>
          ) : (
            <p className="text-green-500 font-medium">✅ Connected successfully!</p>
          )}
        </div>
      </main>
    </div>
  );
}
