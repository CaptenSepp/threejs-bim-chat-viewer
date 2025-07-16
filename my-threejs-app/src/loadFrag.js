export async function loadFragments(fragments, path = '/frags/school_str.frag') {
  console.log('Lade Fragmente von', path);
  try {
    const file = await fetch(path);
    if (!file.ok) throw new Error(`HTTP ${file.status}`);
    const buffer = await file.arrayBuffer();
    await fragments.core.load(buffer, { modelId: 'school_str' });
    console.log('Fragmente geladen');
  } catch (err) {
    console.error('Fehler beim Laden der Fragmente:', err);
  }
}
