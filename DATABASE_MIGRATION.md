# Database Migration Notes

## Authentication Migration

This project has been migrated from Supabase authentication to Clerk authentication.

### What Changed

**Before (Supabase Auth):**
- Used Supabase's built-in authentication system
- User profiles stored in Supabase PostgreSQL database
- Required database schema setup with RLS policies
- Authentication tied to database

**After (Clerk Auth):**
- Uses Clerk for authentication and user management
- User profiles managed by Clerk
- No database required for authentication
- Authentication is independent of database

### Database Schema

The `database-schema.sql` file in this repository was designed for Supabase and includes:
- User profiles table (linked to Supabase auth.users)
- Questions, answers, quiz sessions tables
- Row Level Security (RLS) policies

**Important:** If you want to implement data persistence (storing quiz results, progress tracking, etc.), you will need to:

1. Choose a database solution (e.g., PostgreSQL, MongoDB, etc.)
2. Update the schema to use Clerk's user IDs instead of Supabase auth references
3. Implement API routes to store/retrieve data

### Current Implementation

The current application uses Clerk for authentication and operates without a persistent database:
- Login/Signup handled by Clerk
- User sessions managed by Clerk
- Quiz data is temporary (not persisted between sessions)

### Future Considerations

If you want to add data persistence:

1. **Database Setup**: Choose and set up a database (PostgreSQL, MySQL, MongoDB, etc.)
2. **User ID Mapping**: Use Clerk's user IDs (`auth().userId`) to associate data with users
3. **API Routes**: Implement endpoints to:
   - Save quiz results
   - Track user progress
   - Store user preferences
4. **Data Migration**: Adapt the existing schema or create a new one suitable for your chosen database

### Example: Using Clerk with PostgreSQL

```typescript
// In an API route
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Now use userId to store data in your database
  // e.g., INSERT INTO quiz_results (user_id, score) VALUES (userId, score)
}
```

### Migration Path for Existing Supabase Data

If you have existing data in Supabase and want to migrate:

1. Export your data from Supabase
2. Set up a new database
3. Create a mapping between Supabase user IDs and Clerk user IDs
4. Import the data with the new user ID associations

---

For questions or assistance with database integration, please refer to:
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Database Integration](https://nextjs.org/docs/app/building-your-application/data-fetching)
