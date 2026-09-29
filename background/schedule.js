/**
 * Time-slot ("créneau") logic — active slot detection, validation.
 * Slots are same-day only ("09:00"→"12:00"), no midnight crossing.
 */

import { getConfig } from './config.js';

export function parseSlot(slot) {
  const [startH, startM] = slot.start.split(':').map(Number);
  const [endH, endM] = slot.end.split(':').map(Number);
  return {
    startMinutes: startH * 60 + startM,
    endMinutes: endH * 60 + endM,
  };
}

function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function isValidSlot(slot) {
  if (!slot || typeof slot.start !== 'string' || typeof slot.end !== 'string') return false;
  const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRe.test(slot.start) || !timeRe.test(slot.end)) return false;
  const { startMinutes, endMinutes } = parseSlot(slot);
  return startMinutes < endMinutes;
}

export function getActiveSlot(date = new Date()) {
  const now = minutesSinceMidnight(date);
  const schedules = getConfig().schedules || [];
  return schedules.find(slot => {
    const { startMinutes, endMinutes } = parseSlot(slot);
    return now >= startMinutes && now < endMinutes;
  }) || null;
}

export function isWithinActiveSlot(date = new Date()) {
  return getActiveSlot(date) !== null;
}

export function getNextSlot(date = new Date()) {
  const now = minutesSinceMidnight(date);
  const schedules = getConfig().schedules || [];
  const upcoming = schedules
    .map(slot => ({ slot, ...parseSlot(slot) }))
    .filter(s => s.startMinutes > now)
    .sort((a, b) => a.startMinutes - b.startMinutes);
  return upcoming.length ? upcoming[0].slot : null;
}
