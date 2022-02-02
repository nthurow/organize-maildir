import {join} from 'path';
import {Transform, Writable} from 'stream';
import {createReadStream, copyFile, readFile, readdirSync, statSync, existsSync, mkdirSync, copyFileSync} from 'fs';

import {simpleParser, ParsedMail, MailParser, Headers, AddressObject} from 'mailparser';
import dayjs from 'dayjs';
import sanitize from 'sanitize-filename';

export async function main(maildirNew: string, maildirOut: string) {
  const dirContents = readdirSync(maildirNew);

  const mailTransformStream = new Transform({
    objectMode: true,
    transform(filePath, encoding, cb) {
      const parser = new MailParser();

      createReadStream(filePath)
        .pipe(parser)
        .on('headers', (headers) => {
          cb(null, {src: filePath, headers});
        })
        .on('error', cb);
    }
  });

  const generateFileNameStream = new Transform({
    objectMode: true,
    transform({src, headers}: {src: string; headers: Headers}, encoding, cb) {
      const to = headers.get('to') as AddressObject | AddressObject[] | undefined;
      const date = headers.get('date') as Date | undefined;
      const subject = headers.get('subject') as string | undefined;
      const from = headers.get('from') as AddressObject | undefined;
      const year = date ? dayjs(date).year().toString() : 'unknown_date';

      const mailTo = Array.isArray(to)
        ? to
            .slice(0, 5)
            .map((toAddress) => toAddress.text)
            .join(', ')
        : to?.text;
      const mailDate = dayjs(date).format('YYYY-MM-DD-HH-mm-ss');
      const fileName = `${mailDate}---from:${from?.text || 'no-from'}---to:${mailTo}---subject:${
        subject || 'no-subject'
      }`;
      const santizedFileName = sanitize(fileName, {replacement: '++'});

      cb(null, {src, sub: year, dest: santizedFileName});
    }
  });

  const moveFileStream = new Writable({
    objectMode: true,
    write({src, dest, sub}: {src: string; dest: string; sub: string}, encoding, cb) {
      if (!existsSync(join(maildirOut, sub))) {
        mkdirSync(join(maildirOut, sub));
      }

      copyFile(src, join(maildirOut, sub, dest), (err) => {
        if (err) {
          return cb(err);
        }

        this.emit('processed', {src, dest, sub});
        cb();
      });
    }
  });

  let processedCount = 0;
  const totalCount = dirContents.length;

  mailTransformStream
    .pipe(generateFileNameStream)
    .pipe(moveFileStream)
    .on('processed', ({src}: {src: string}) => {
      console.log(`Finished ${++processedCount}/${totalCount} - ${src}`);
    });

  await dirContents.reduce(async (soFar, item) => {
    await soFar;

    return new Promise((resolve, reject) => {
      const res = mailTransformStream.write(join(maildirNew, item));

      if (res === false) {
        mailTransformStream.once('drain', () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }, Promise.resolve());

  mailTransformStream.end();
}
