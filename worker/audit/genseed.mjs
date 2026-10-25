// 1000 synthetic students + 30 extra coordinators, same known password as the seed (local test DB only).
const H = 'pbkdf2-sha256$100000$8V9LJsNXcKJHAxJ4yvSeWQ==$FK+amiK8IIgcF4TfZxlGOh2cx/QLjeqlZCb+C2FiV1M=';
const rows = [];
for (let i = 1; i <= 1000; i++) rows.push(`('u${String(i).padStart(4,'0')}','load${i}@load.test','${H}','Load Student ${i}','student','Computer Science',${i%10===0?1:0})`);
for (let i = 1; i <= 30; i++) rows.push(`('c${String(i).padStart(4,'0')}','coord${i}@load.test','${H}','Load Coord ${i}','coordinator','Mechanical',0)`);
console.log(rows.map(r=>`INSERT INTO profiles (id,email,password_hash,name,role,department,is_organizer) VALUES ${r};`).join("\n"));
