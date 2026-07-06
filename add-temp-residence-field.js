'use strict';

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

async function main() {
  const serviceAccountPath = process.env.SERVICE_ACCOUNT || path.join(__dirname, 'newserchhipnorthvc-firebase-adminsdk-fbsvc-dc91a97c53.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Missing service account key:', serviceAccountPath);
    process.exit(1);
  }

  const projectId = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')).project_id;
  console.log(`Project: ${projectId}`);

  const app = admin.initializeApp({ credential: admin.cert(serviceAccountPath) });
  const db = getFirestore(app);

  console.log('\n📝 Adding isTemporaryResidence field to existing records...');

  const recordsSnap = await db.collection('records').get();
  let count = 0;
  let updated = 0;
  const BATCH = 400;
  let batch = db.batch();
  let ops = 0;

  for (const doc of recordsSnap.docs) {
    const data = doc.data();
    const needsUpdate = (data.families || []).some(f => !f.hasOwnProperty('isTemporaryResidence'));

    if (needsUpdate) {
      const updatedFamilies = (data.families || []).map(f => ({
        ...f,
        isTemporaryResidence: f.isTemporaryResidence || false
      }));

      batch.update(doc.ref, { families: updatedFamilies });
      updated++;
      ops++;

      if (ops >= BATCH) {
        await batch.commit();
        console.log(`  Committed ${updated} record updates...`);
        batch = db.batch();
        ops = 0;
      }
    }
    count++;
  }

  if (ops > 0) await batch.commit();

  console.log(`\n✅ Migration complete!`);
  console.log(`   Total records checked: ${count}`);
  console.log(`   Records updated: ${updated}`);
  console.log(`   Records unchanged: ${count - updated}`);

  await app.delete();
}

main().catch(err => { console.error('❌ Migration failed:', err); process.exit(1); });
