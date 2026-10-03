import { UserAccount, AuthSession, LoginCredentials, RegisterData } from '../types/auth';
import { UserProfile } from '../types/health';
import { AuthCryptoService } from './authCrypto';
import { HealthStorageService, DEFAULT_PROFILE } from './healthStorage';

const STORAGE_USERS_KEY = 'health_app_users_v1';
const STORAGE_SESSION_KEY = 'health_app_active_session_v1';

export class AuthService {
  /**
   * Returns all registered user accounts from local secure storage
   */
  public static getAllAccounts(): UserAccount[] {
    try {
      const raw = localStorage.getItem(STORAGE_USERS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private static saveAllAccounts(accounts: UserAccount[]): void {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to save accounts locally', e);
    }
  }

  /**
   * Returns the current authenticated session or null
   */
  public static getCurrentSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Initializes the default senior demo account (Eleonor Vance) if no accounts exist
   */
  public static async initDefaultDemoUserIfEmpty(): Promise<UserAccount> {
    const existing = this.getAllAccounts();
    const demoAccount = existing.find((u) => u.username.toLowerCase() === 'eleonor');
    if (demoAccount) {
      return demoAccount;
    }

    const salt = AuthCryptoService.generateSalt();
    const passwordHash = await AuthCryptoService.hashPassword('health2026', salt);

    const newDemoUser: UserAccount = {
      id: 'usr_eleonor_default',
      username: 'eleonor',
      email: 'eleonor.vance@example.com',
      displayName: 'Eleonor Vance',
      age: 78,
      salt,
      passwordHash,
      iterations: AuthCryptoService.DEFAULT_ITERATIONS,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      profile: {
        ...DEFAULT_PROFILE,
        name: 'Eleonor Vance',
        age: 78,
      },
    };

    const updated = [newDemoUser, ...existing];
    this.saveAllAccounts(updated);
    return newDemoUser;
  }

  /**
   * Registers a new user with cryptographically salted and hashed password
   */
  public static async register(data: RegisterData): Promise<{ session: AuthSession; message: string }> {
    const username = data.username.trim().toLowerCase();
    const displayName = data.displayName.trim() || username;

    if (!username) {
      throw new Error('Please enter a username or email.');
    }
    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
    if (!data.password || data.password.length < 4) {
      throw new Error('Password must be at least 4 characters for security.');
    }

    const accounts = this.getAllAccounts();
    const exists = accounts.some((a) => a.username.toLowerCase() === username);
    if (exists) {
      throw new Error(`An account with username "${username}" already exists. Please log in.`);
    }

    // Cryptographic Salting & PBKDF2-SHA256 Hashing
    const salt = AuthCryptoService.generateSalt();
    const passwordHash = await AuthCryptoService.hashPassword(data.password, salt);

    const now = new Date().toISOString();
    const userProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      name: displayName,
      age: data.age || 75,
      targetSystolicMax: data.targetSystolicMax || 130,
      targetDiastolicMax: data.targetDiastolicMax || 85,
    };

    const newUser: UserAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username,
      displayName,
      age: data.age || 75,
      salt,
      passwordHash,
      iterations: AuthCryptoService.DEFAULT_ITERATIONS,
      createdAt: now,
      lastLoginAt: now,
      profile: userProfile,
    };

    accounts.push(newUser);
    this.saveAllAccounts(accounts);

    // Also try to sync with backend SQLite if running
    this.syncAccountToBackend(newUser).catch(() => {});

    // Save profile to active profile storage
    HealthStorageService.saveProfile(userProfile);

    // Create active session
    const session: AuthSession = {
      token: `tok_${newUser.id}_${Date.now()}`,
      user: {
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName,
        age: newUser.age,
        createdAt: newUser.createdAt,
        lastLoginAt: newUser.lastLoginAt,
      },
      profile: userProfile,
    };

    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));

    return {
      session,
      message: `Welcome, ${displayName}! Your account has been securely created.`,
    };
  }

  /**
   * Authenticates user against stored salt and PBKDF2 hash
   */
  public static async login(creds: LoginCredentials): Promise<{ session: AuthSession; message: string }> {
    const username = creds.username.trim().toLowerCase();
    const password = creds.password;

    if (!username || !password) {
      throw new Error('Please enter both your username and password.');
    }

    // Ensure demo account is seeded if initial run
    await this.initDefaultDemoUserIfEmpty();

    const accounts = this.getAllAccounts();
    const user = accounts.find((a) => a.username.toLowerCase() === username);

    if (!user) {
      throw new Error('Account not found. Please check your username or create a new account.');
    }

    // Verify salted password with constant-time check
    const isValid = await AuthCryptoService.verifyPassword(
      password,
      user.salt,
      user.passwordHash,
      user.iterations || AuthCryptoService.DEFAULT_ITERATIONS
    );

    if (!isValid) {
      throw new Error('Incorrect password. Please try again.');
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date().toISOString();
    this.saveAllAccounts(accounts);

    // Update active profile in storage
    if (user.profile) {
      HealthStorageService.saveProfile(user.profile);
    }

    const session: AuthSession = {
      token: `tok_${user.id}_${Date.now()}`,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        age: user.age,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      profile: user.profile || DEFAULT_PROFILE,
    };

    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));

    return {
      session,
      message: `Welcome back, ${user.displayName}!`,
    };
  }

  /**
   * 1-Click Demo Login for quick testing
   */
  public static async loginWithDemoAccount(): Promise<AuthSession> {
    const demo = await this.initDefaultDemoUserIfEmpty();
    const session: AuthSession = {
      token: `tok_${demo.id}_${Date.now()}`,
      user: {
        id: demo.id,
        username: demo.username,
        displayName: demo.displayName,
        age: demo.age,
        createdAt: demo.createdAt,
        lastLoginAt: new Date().toISOString(),
      },
      profile: demo.profile,
    };

    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    HealthStorageService.saveProfile(demo.profile);
    return session;
  }

  /**
   * Logs out the user and clears session token
   */
  public static logout(): void {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  }

  /**
   * Updates user profile in active account and session
   */
  public static updateUserProfile(updatedProfile: UserProfile): void {
    const session = this.getCurrentSession();
    if (session) {
      session.profile = updatedProfile;
      session.user.displayName = updatedProfile.name;
      session.user.age = updatedProfile.age;
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    }

    const accounts = this.getAllAccounts();
    const idx = accounts.findIndex((a) => a.id === session?.user.id);
    if (idx !== -1) {
      accounts[idx].profile = updatedProfile;
      accounts[idx].displayName = updatedProfile.name;
      accounts[idx].age = updatedProfile.age;
      this.saveAllAccounts(accounts);
    }
  }

  private static async syncAccountToBackend(user: UserAccount): Promise<void> {
    try {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch {
      // Offline fallback
    }
  }
}
