WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n<3000)
INSERT INTO events (id,title,type,description,coordinator_id,venue_id,starts_at,ends_at,capacity,status,department)
SELECT 'g'||n,'Historic event '||n,'lecture','Archived event with a typical paragraph of description text so the row is realistic in size.','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
 strftime('%Y-%m-%dT%H:%M:%fZ','now','-'||(n+48)||' hours'), strftime('%Y-%m-%dT%H:%M:%fZ','now','-'||(n+46)||' hours'),100,'completed','Computer Science' FROM seq;
WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n<60000)
INSERT INTO registrations (id,event_id,user_id,status,created_at)
SELECT 'gr'||n,'g'||(1+(n%3000)),'u'||printf('%04d',1+((n%3000)+7*(n/3000))%1000),'confirmed',strftime('%Y-%m-%dT%H:%M:%fZ','now','-'||(n%3000)||' hours') FROM seq;
WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n<30000)
INSERT INTO notifications (id,user_id,event_id,kind,body,created_at)
SELECT lower(hex(randomblob(16))),'u0001',NULL,'event_changed','The details of "Some event" were updated. Open the event to see the new time and venue.',strftime('%Y-%m-%dT%H:%M:%fZ','now','-'||n||' minutes') FROM seq;
