const { db } = require('./util.js');
const fs = require('fs');
const path = require('path');

const setup = async () => {
  const dbCon = await db.getConnection();
  const queries = fs
    .readFileSync(path.join(__dirname, 'db.sql'), { encoding: 'UTF-8' })
    .split(';\n');
  for (query of queries) {
    if (query.length && !query.match(/\/\*/)) {
      await dbCon.query(query);
    }
  }
  await dbCon.end();
};

setup();
