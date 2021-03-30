import {join} from 'path';
import {
  readFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
  copyFileSync
} from 'fs';

import {simpleParser, ParsedMail} from 'mailparser';
import dayjs from 'dayjs';
import sanitize from 'sanitize-filename';

interface ParsedMailStruct {
  fileName: string;
  fileContents: Buffer;
  mail: ParsedMail;
}

const maildirNew = '/home/nthurow/storage/email/Gmail/new';
const maildirOut = '/tmp/maildir-out';

const dirContents = readdirSync(maildirNew);

async function renderParsedEmails(emailPromises: Promise<ParsedMailStruct>[]) {
  const emails = await Promise.all(emailPromises);

  const mailDateMap = emails.reduce<Map<string | number, ParsedMailStruct[]>>(
    (mailDateMap, mailStruct) => {
      const year = mailStruct.mail.date
        ? dayjs(mailStruct.mail.date).year()
        : 'unknown_date';
      const existingMails = mailDateMap.get(year) || [];

      return mailDateMap.set(year, [...existingMails, mailStruct]);
    },
    new Map()
  );

  mailDateMap.forEach((parsedMailStructs, date) => {
    const existingDir = join(maildirOut, date.toString());

    if (!existsSync(existingDir)) {
      mkdirSync(existingDir);
    }

    parsedMailStructs.forEach(mailDirStruct => {
      const mailDate = dayjs(mailDirStruct.mail.date).format(
        'YYYY-MM-DD-HH-mm-ss'
      );
      const fileName = `${mailDate}---${
        mailDirStruct.mail.from?.text || 'no-from'
      }----${mailDirStruct.mail.subject || 'no-subject'}`;
      const santizedFileName = sanitize(fileName, {replacement: '++'});

      copyFileSync(mailDirStruct.fileName, join(existingDir, santizedFileName));
    });
  });
}

const parsedEmails = dirContents
  .map(itemName => {
    return join(maildirNew, itemName);
  })
  .filter(itemName => {
    const itemStats = statSync(itemName);

    return itemStats.isFile();
  })
  .slice(0, 25)
  .map(fileName => {
    return {fileName, fileContents: readFileSync(fileName)};
  })
  .map(fileStruct => {
    return new Promise<ParsedMailStruct>((resolve, reject) => {
      simpleParser(fileStruct.fileContents, (err, mail) => {
        if (!err) {
          resolve({
            ...fileStruct,
            mail
          });
        } else {
          reject(err);
        }
      });
    });
  });

renderParsedEmails(parsedEmails);
