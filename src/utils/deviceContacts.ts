/**
 * Shared Web Contacts API type shim + utility.
 * Only declare the global Navigator augment once to avoid TS duplicate property errors.
 */

export interface ContactsManager {
  select(
    props: string[],
    opts?: { multiple?: boolean }
  ): Promise<Array<{ name?: string[]; tel?: string[] }>>;
  getProperties(): Promise<string[]>;
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }
}

/** Returns true when the Web Contacts API is available on this device. */
export function hasContactsApi(): boolean {
  return typeof navigator !== 'undefined' && 'contacts' in navigator && !!navigator.contacts;
}
