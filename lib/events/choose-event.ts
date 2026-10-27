export function registrationPath(eventId: string): string {
  return `/registration?event=${encodeURIComponent(eventId)}`;
}

/** One open event can open directly. Several events need an explicit choice. */
export function chooseRegistrationEvent<T extends { id: string }>(events: T[]): T | null {
  if (events.length === 1) return events[0];
  return null;
}

/** Only return to registration. Anything else is ignored. */
export function safeRegistrationNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/registration') || next.startsWith('//') || next.includes('://')) {
    return null;
  }
  return next;
}
