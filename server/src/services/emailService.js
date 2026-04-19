const Imap = require('imap');
const { simpleParser } = require('mailparser');

/**
 * Fetches ALL emails with the matching subject from the last 2 weeks.
 * Returns an array of { csvBuffer, receivedDate } sorted oldest-first.
 */
function fetchAllCSVsFromLastTwoWeeks() {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user:     process.env.GMAIL_USER,
      password: process.env.GMAIL_APP_PASSWORD,
      host:     'imap.gmail.com',
      port:     993,
      tls:      true,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err) => {
        if (err) return reject(err);

        const since = new Date();
        since.setDate(since.getDate() - 14); // last 2 weeks

        const subject = process.env.EMAIL_SUBJECT || 'Predicted CSV File';
        imap.search([['SUBJECT', subject], ['SINCE', since]], (err, results) => {
          if (err) return reject(err);
          if (!results || results.length === 0) {
            imap.end();
            return resolve([]);
          }

          console.log(`[Email] Found ${results.length} matching email(s)`);
          fetchMultipleAttachments(imap, results, resolve, reject);
        });
      });
    });

    imap.once('error', reject);
    imap.once('end', () => {});
    imap.connect();
  });
}

function fetchMultipleAttachments(imap, uids, resolve, reject) {
  const results = [];
  let pending = uids.length;

  const fetcher = imap.fetch(uids, { bodies: '', markSeen: true });

  fetcher.on('message', (msg) => {
    let rawEmail = '';
    let receivedDate = new Date();

    msg.on('body', (stream) => {
      stream.on('data', (chunk) => { rawEmail += chunk.toString('utf8'); });
    });
    msg.once('attributes', (attrs) => {
      receivedDate = attrs.date || new Date();
    });
    msg.once('end', () => {
      simpleParser(rawEmail, (err, parsed) => {
        if (!err) {
          const attachment = parsed.attachments && parsed.attachments.find(a =>
            a.contentType === 'text/csv' || (a.filename && a.filename.endsWith('.csv'))
          );
          if (attachment) {
            results.push({ csvBuffer: attachment.content, receivedDate });
          }
        }
        pending--;
        if (pending === 0) {
          imap.end();
          // Sort oldest first
          results.sort((a, b) => a.receivedDate - b.receivedDate);
          resolve(results);
        }
      });
    });
  });

  fetcher.once('error', reject);
}

// Keep backwards compat for manual fetch
async function fetchLatestCSV() {
  const all = await fetchAllCSVsFromLastTwoWeeks();
  if (all.length === 0) throw new Error('No email found with subject: ' + (process.env.EMAIL_SUBJECT || 'Predicted CSV File'));
  return all[all.length - 1]; // most recent
}

module.exports = { fetchLatestCSV, fetchAllCSVsFromLastTwoWeeks };
