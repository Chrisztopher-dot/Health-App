import { UserProfile } from './health';

export interface UserAccount {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  age: number;
  salt: string; // Cryptographic salt in hex
  passwordHash: string; // PBKDF2-SHA256 derived hash
  iterations: number;
  createdAt: string;
  lastLoginAt: string;
  profile: UserProfile;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    age: number;
    createdAt: string;
    lastLoginAt: string;
  };
  profile: UserProfile;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  displayName: string;
  password: string;
  age?: number;
  targetSystolicMax?: number;
  targetDiastolicMax?: number;
}
