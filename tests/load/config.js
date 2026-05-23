export const CONFIG = {
  SUPABASE_URL: __ENV.SUPABASE_URL || 'https://lietpzxydupsxmlncrpi.supabase.co',
  SUPABASE_ANON_KEY: __ENV.SUPABASE_ANON_KEY || '',
  TEST_USERS: [
    { email: 'loadtest1@finventree.com', password: __ENV.TEST_PASS || '' },
    { email: 'loadtest2@finventree.com', password: __ENV.TEST_PASS || '' },
    { email: 'loadtest3@finventree.com', password: __ENV.TEST_PASS || '' },
    { email: 'loadtest4@finventree.com', password: __ENV.TEST_PASS || '' },
    { email: 'loadtest5@finventree.com', password: __ENV.TEST_PASS || '' },
  ],
};
