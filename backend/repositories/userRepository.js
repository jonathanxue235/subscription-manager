/**
 * user repository is for all database operations for users. info hiding so that other code do not know we are using supabase

 */

class UserRepository {
  constructor(dbClient) {
    this.db = dbClient;
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

  async findById(id) {
    const { data, error } = await this.db
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }
}

module.exports = UserRepository;
