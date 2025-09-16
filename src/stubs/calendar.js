export async function requestCalendarPermissionsAsync() {
  return { status: 'granted', granted: true };
}
export async function getCalendarsAsync() { return []; }
export async function createCalendarAsync() { return 'stub-cal-id'; }
export async function createEventAsync() { return 'stub-event-id'; }
export async function deleteEventAsync() { return true; }