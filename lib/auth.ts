/**
 * Frontend-only auth client.
 *
 * The UI talks to auth exclusively through this module. Profiles are created
 * and verified against accounts stored in this browser (passwords are salted
 * and hashed, never stored as plain text). To add real authentication,
 * replace these implementations with calls to your auth provider; the forms,
 * dialogs and navbar do not need to change.
 */
import { accountsStorage, type AccountResult } from "@/lib/storage/accounts";

export type AuthResult = AccountResult;

export const authClient = {
  signIn(credentials: { email: string; password: string; remember: boolean }): Promise<AuthResult> {
    return accountsStorage.signIn(credentials.email, credentials.password, credentials.remember);
  },

  signUp(input: { name: string; username: string; email: string; password: string; avatar: string; bio: string }): Promise<AuthResult> {
    return accountsStorage.register(input);
  },

  /** No email can be sent without a backend, so we say so instead of pretending. */
  async requestPasswordReset(): Promise<{ ok: false; error: string }> {
    return {
      ok: false,
      error: "Password reset needs an email service, which isn't connected yet. If you've forgotten it, you can create a new profile.",
    };
  },

  async signOut(): Promise<void> {
    accountsStorage.signOut();
  },
};
