/**
 * user repository is for all database operations for users. info hiding so that other code do not know we are using supabase

 */

class UserRepository {
  constructor(dbClient, createDbClientFn = null) {
    this.db = dbClient;
    this.createDbClient = createDbClientFn;
  }

  _getClient(accessToken = null) {
    // If access token is provided and we have the factory function, create a new client
    if (accessToken && this.createDbClient) {
      return this.createDbClient(accessToken);
    }
    // Otherwise use the default client (for operations that don't need RLS)
    return this.db;
  }

  async findByEmail(email) {
    const { data, error } = await this.db
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  async findByUsername(username) {
    const { data, error } = await this.db
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  async create(userData) {
    const { data, error } = await this.db
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  async findById(id, accessToken = null) {
    const client = this._getClient(accessToken);
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  async update(id, updates, accessToken = null) {
    const client = this._getClient(accessToken);
    const { data, error } = await client
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }
}

module.exports = UserRepository;
