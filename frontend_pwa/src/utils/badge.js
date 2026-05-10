// src/utils/badge.js
export async function setAppBadge(count) {
  if (!navigator.setAppBadge) {
    console.log('❌ Badge API nije podržan');
    return;
  }
  
  try {
    if (count > 0) {
      await navigator.setAppBadge(count);
    } else {
      await navigator.clearAppBadge();
    }
    console.log(`🔔 Badge: ${count}`);
  } catch (error) {
    console.error('❌ Badge greška:', error);
  }
}