
// commands to be run in mongo

use rap

db.players.ensureIndex({ id:1 }, { unique: true, dropDups: true });

db.rooms.ensureIndex({ id:1 }, { unique: true, dropDups: true });

db.battles.ensureIndex({ id:1 }, { unique: true, dropDups: true });
db.battles.ensureIndex({ room_id:1 });

db.rounds.ensureIndex({ id:1 }, { unique: true, dropDups: true });
db.rounds.ensureIndex({ battle_id:1 });

db.songs.ensureIndex({ id:1 }, { unique: true, dropDups: true });


