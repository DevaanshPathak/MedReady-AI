import { createClient } from '@/lib/supabase/client'

// Mock is already set up in jest.setup.js
describe('Supabase Client', () => {
  it('creates a client instance', () => {
    const client = createClient()
    expect(client).toBeDefined()
  })

  it('has auth methods', () => {
    const client = createClient()
    expect(client.auth).toBeDefined()
    expect(client.auth.signInWithPassword).toBeDefined()
    expect(client.auth.signUp).toBeDefined()
    expect(client.auth.signOut).toBeDefined()
    expect(client.auth.getUser).toBeDefined()
  })

  it('has database query methods', () => {
    const client = createClient()
    expect(client.from).toBeDefined()
    
    const query = client.from('test_table')
    expect(query.select).toBeDefined()
    expect(query.insert).toBeDefined()
    expect(query.update).toBeDefined()
    expect(query.delete).toBeDefined()
  })

  it('chains query methods', () => {
    const client = createClient()
    const queryBuilder = client.from('profiles')
    const selectQuery = queryBuilder.select('*')
    const eqQuery = selectQuery.eq('id', '123')
    
    expect(queryBuilder).toBeDefined()
    expect(selectQuery).toBeDefined()
    expect(eqQuery).toBeDefined()
  })
})
