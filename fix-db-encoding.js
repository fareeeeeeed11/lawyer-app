import Database from 'better-sqlite3';

const db = new Database('justice_v2.db');

try {
    // 1. Identify rows with corrupted currency values
    // Using a broad check for non-ASCII characters or common corruption patterns if possible, 
    // but here we know the specific case.

    // Fix existing data to 'ريال سعودي' if it looks corrupted or is the old default
    db.prepare("UPDATE cases SET currency = 'ريال سعودي' WHERE currency IS NULL OR currency = '' OR currency NOT IN ('دولار', 'يورو', 'درهم إماراتي', 'دينار كويتي', 'جنية مصري', 'دينار بحريني', 'ريال عماني', 'ريال قطري', 'دينار أردني')").run();

    console.log('Database currency values successfully cleaned and set to default.');
} catch (err) {
    console.error('Error fixing database:', err);
} finally {
    db.close();
}
